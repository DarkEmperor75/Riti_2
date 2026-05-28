import {
    BadGatewayException,
    BadRequestException,
    ConflictException,
    ForbiddenException,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import {
    BookingStatus,
    FinancialActor,
    FinancialType,
    NotificationType,
    Prisma,
    StripePaymentStatus,
} from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { DateTime } from 'luxon';
import dayjs from 'dayjs';
import { DatabaseService } from 'src/database/database.service';
import { CreateBookingDto } from '../dto/create-booking.dto';
import {
    BookingStatusResponseDto,
    VendorBookingDto,
    VendorBookingsListDto,
    VendorBookingsQueryDto,
} from '../dto';
import { plainToInstance } from 'class-transformer';
import { UserBookingsQueryDto } from '../dto/user-bookings.dto';
import { BookingEntity } from '../entities';
import { NotificationsService } from 'src/notifications/services';
import { PaymentsService } from 'src/payments/services';
import { EmailsService } from 'src/emails/services';
import { FinancialsService } from 'src/financials/services';
import { TimezoneService } from 'src/common/services';

@Injectable()
export class SpaceBookingsService {
    private readonly logger = new Logger(SpaceBookingsService.name);

    constructor(
        private db: DatabaseService,
        private notificationsService: NotificationsService,
        private paymentService: PaymentsService,
        private emailsService: EmailsService,
        private financialsService: FinancialsService,
        private tzService: TimezoneService,
    ) {}

    async createBookingRequest(
        dto: CreateBookingDto,
        renterId: string,
    ): Promise<{ id: string; status: string }> {
        const { spaceId, startDate, startTime, durationHours, note } = dto;

        const space = await this.db.space.findUnique({
            where: { id: spaceId },
            include: { vendor: true, bookings: true, daysBlocked: true },
        });

        if (!space) throw new NotFoundException('Space not found');
        if (!space.timezone)
            throw new BadGatewayException(
                'Space lacks timezone for booking to be successfull',
            );

        const startDateTimeUTC = this.tzService.parseLocalToUTC(
            startDate,
            startTime,
            space.timezone,
        );

        const endDateTimeUTC = this.tzService.addHours(
            startDateTimeUTC,
            durationHours,
            space.timezone,
        );

        this.tzService.assertFuture(startDateTimeUTC, space.timezone);

        BookingEntity.validateBookingToBeCreated(
            space,
            startDateTimeUTC,
            durationHours,
            renterId,
        );

        const isRecurring = dto.isRecurring === true || String(dto.isRecurring) === 'true';
        const weeks = isRecurring ? (Number(dto.recurringWeeks) || 1) : 1;

        if (isRecurring && (weeks < 1 || weeks > 52)) {
            throw new BadRequestException('Recurring weeks must be between 1 and 52');
        }

        const occurrences: Array<{ start: Date; end: Date }> = [];
        const dtStart = DateTime.fromJSDate(startDateTimeUTC, { zone: 'utc' }).setZone(space.timezone);
        const dtEnd = DateTime.fromJSDate(endDateTimeUTC, { zone: 'utc' }).setZone(space.timezone);

        for (let w = 0; w < weeks; w++) {
            const occStart = dtStart.plus({ weeks: w }).toUTC().toJSDate();
            const occEnd = dtEnd.plus({ weeks: w }).toUTC().toJSDate();
            occurrences.push({ start: occStart, end: occEnd });
        }

        // Validate blocked days for all occurrences
        if (space.daysBlocked?.length) {
            for (const occ of occurrences) {
                const bookingStart = dayjs(occ.start).startOf('day');
                const bookingEnd = dayjs(occ.end).endOf('day');

                const isBlocked = space.daysBlocked.some(
                    (d) =>
                        dayjs(d.startingDate).isBefore(bookingEnd) &&
                        dayjs(d.endingDate).isAfter(bookingStart),
                );

                if (isBlocked) {
                    throw new BadRequestException(
                        `One or more selected dates are blocked by the vendor (e.g. ${dayjs(occ.start).format('YYYY-MM-DD')})`,
                    );
                }
            }
        }

        const recurrenceGroupId = isRecurring ? `rec_${uuidv4()}` : null;

        return this.db.$transaction(async (tx) => {
            const bufferMs = 30 * 60 * 1000;
            const OR_conditions = occurrences.map(occ => {
                const searchStart = new Date(occ.start.getTime() - bufferMs);
                const searchEnd = new Date(occ.end.getTime() + bufferMs);
                return {
                    startTime: { lt: searchEnd },
                    endTime: { gt: searchStart },
                };
            });

            const conflict = await tx.booking.findFirst({
                where: {
                    spaceId,
                    status: { in: ['APPROVED', 'PAID', 'COMPLETED'] },
                    OR: OR_conditions,
                },
            });

            if (conflict) {
                throw new ConflictException('Time slot unavailable due to booking conflict or transition buffer');
            }

            const createdBookings: Array<{
                id: string;
                spaceId: string;
                status: string;
                renter: { fullName: string };
            }> = [];
            for (const occ of occurrences) {
                const res = await tx.booking.create({
                    data: {
                        spaceId,
                        renterId,
                        startTime: occ.start,
                        endTime: occ.end,
                        totalPrice: new Prisma.Decimal(
                            space.pricePerHour.toNumber() * durationHours,
                        ),
                        status: 'PENDING',
                        expiryTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                        note,
                        recurrenceGroupId,
                    },
                    select: {
                        id: true,
                        spaceId: true,
                        status: true,
                        renter: {
                            select: {
                                fullName: true,
                            },
                        },
                    },
                });
                createdBookings.push(res);
            }

            const result = createdBookings[0];

            await this.notificationsService.queueNotification({
                userId: space.vendor.userId,
                type: NotificationType.NEW_BOOKING_REQUEST,
                title: 'New booking request',
                message: `You have a new booking request from ${result.renter.fullName}`,
                meta: {
                    bookingId: result.id,
                    spaceId: result.spaceId,
                },
            });

            return {
                id: result.id,
                status: result.status,
            };
        });
    }

    async getVendorBookings(
        userId: string,
        query: VendorBookingsQueryDto,
    ): Promise<VendorBookingsListDto> {
        const { status, spaceId, page, limit } = query;
        const skip = (page - 1) * limit;

        const where: Prisma.BookingWhereInput = {
            space: {
                vendor: { userId },
                ...(spaceId && { id: spaceId }),
            },
            ...(status && { status }),
        };

        const [bookings, total] = await Promise.all([
            this.db.booking.findMany({
                where,
                include: {
                    space: {
                        select: {
                            id: true,
                            name: true,
                            images: { take: 1, orderBy: { order: 'asc' } },
                        },
                    },
                    renter: {
                        select: { fullName: true, email: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.db.booking.count({ where }),
        ]);

        const bookingDtos = bookings.map((booking) => ({
            id: booking.id,
            space: {
                id: booking.space.id,
                name: booking.space.name,
                coverImage: booking.space.images[0]?.url || '',
            },
            renter: {
                fullName: booking.renter.fullName,
                email: booking.renter.email,
            },
            status: booking.status,
            startTime: booking.startTime,
            endTime: booking.endTime,
            totalPrice: Number(booking.totalPrice),
            note: booking.note,
            relativeTime: this.formatRelativeTime(booking.createdAt),
            recurrenceGroupId: booking.recurrenceGroupId,
        }));

        return {
            bookings: plainToInstance(VendorBookingDto, bookingDtos),
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async updateBookingStatus(
        bookingId: string,
        vendorUserId: string,
        newStatus: 'APPROVED' | 'REJECTED',
        reason?: string,
    ): Promise<BookingStatusResponseDto> {
        this.logger.debug('Getting res');
        const result = await this.db.$transaction(async (tx) => {
            if (newStatus === 'REJECTED' && !reason)
                throw new BadRequestException('Reason is required');

            const booking = await tx.booking.findUnique({
                where: { id: bookingId },
                select: {
                    spaceId: true,
                    expiryTime: true,
                    status: true,
                    startTime: true,
                    endTime: true,
                    space: {
                        select: {
                            vendor: {
                                select: {
                                    userId: true,
                                    stripeChargesEnabled: true,
                                    stripePayoutsEnabled: true,
                                },
                            },
                        },
                    },
                },
            });

            if (!booking) throw new NotFoundException('Booking not found');
            BookingEntity.validateBookingToBeUpdated(
                booking.space.vendor.userId,
                vendorUserId,
                booking.status,
                booking.expiryTime ?? undefined,
            );

            if (newStatus === BookingStatus.APPROVED) {
                const bufferMs = 30 * 60 * 1000;
                const searchStart = new Date(booking.startTime.getTime() - bufferMs);
                const searchEnd = new Date(booking.endTime.getTime() + bufferMs);

                const overlap = await tx.booking.findFirst({
                    where: {
                        spaceId: booking.spaceId,
                        status: { in: ['APPROVED', 'PAID', 'COMPLETED'] },
                        id: { not: bookingId },
                        startTime: { lt: searchEnd },
                        endTime: { gt: searchStart },
                    },
                });

                if (overlap) {
                    throw new ConflictException(
                        `Cannot approve - overlaps with booking ${overlap.id.slice(-4)}`,
                    );
                }

                const blockedDays = await tx.daysBlocked.findFirst({
                    where: {
                        spaceId: booking.spaceId,
                        AND: [
                            {
                                startingDate: { lte: booking.endTime },
                            },
                            {
                                endingDate: { gte: booking.startTime },
                            },
                        ],
                    },
                    select: {
                        startingDate: true,
                        endingDate: true,
                    },
                });

                if (blockedDays) {
                    throw new ConflictException(
                        `Cannot approve - dates fall within blocked period (${blockedDays?.startingDate.toISOString()} - ${blockedDays.endingDate.toISOString()})`,
                    );
                }

                if (!booking.space.vendor.stripeChargesEnabled)
                    throw new BadRequestException(
                        'Stripe charges are not enabled for this vendor',
                    );
                if (!booking.space.vendor.stripePayoutsEnabled)
                    throw new BadRequestException(
                        'Stripe payouts are not enabled for this vendor',
                    );

                await tx.booking.updateMany({
                    where: {
                        spaceId: booking.spaceId,
                        status: 'PENDING',
                        id: { not: bookingId },
                        startTime: { lt: searchEnd },
                        endTime: { gt: searchStart },
                    },
                    data: { status: 'REJECTED' },
                });
            }

            const updatedBooking = await tx.booking.update({
                where: { id: bookingId },
                data: {
                    status: newStatus,
                    ...(newStatus === 'REJECTED' && reason !== undefined
                        ? {
                              bookingRejectionReason: reason,
                          }
                        : {}),
                    updatedAt: new Date(),
                },
                select: {
                    id: true,
                    status: true,
                    updatedAt: true,
                    renterId: true,
                    startTime: true,
                    endTime: true,
                    totalPrice: true,
                    renter: {
                        select: { fullName: true, email: true, language: true },
                    },
                    space: {
                        select: {
                            name: true,
                            id: true,
                            timezone: true,
                            vendor: {
                                select: {
                                    userId: true,
                                    user: {
                                        select: {
                                            email: true,
                                            fullName: true,
                                            language: true,
                                        },
                                    },
                                    stripeChargesEnabled: true,
                                    stripePayoutsEnabled: true,
                                },
                            },
                        },
                    },
                },
            });

            return { booking, updatedBooking };
        });

        const { booking, updatedBooking } = result;

        this.logger.debug('Got the res, making notifs');
        const notificationsData: Array<{
            userId: string;
            type: NotificationType;
            title: string;
            message: string;
            meta?: Record<string, any>;
        }> = [
            {
                userId: updatedBooking.renterId,
                type:
                    newStatus === 'APPROVED'
                        ? NotificationType.BOOKING_APPROVED
                        : NotificationType.BOOKING_REJECTED,
                title: `Booking: ${updatedBooking.space.name} ${
                    newStatus === 'APPROVED' ? 'Approved!' : 'rejected'
                }`,
                message: `Your booking for ${updatedBooking.space.name} has been ${
                    newStatus === 'APPROVED' ? 'Approved!' : 'rejected'
                }`,
            },
            {
                userId: booking.space.vendor.userId,
                type:
                    newStatus === 'APPROVED'
                        ? NotificationType.BOOKING_APPROVED
                        : NotificationType.BOOKING_REJECTED,
                title: `Booking: ${updatedBooking.space.name} ${
                    newStatus === 'APPROVED' ? 'Approved!' : 'rejected'
                }`,
                message: `You have ${
                    newStatus === 'APPROVED' ? 'Approved!' : 'rejected'
                } a booking for ${updatedBooking.space.name} from ${updatedBooking.renter.fullName}`,
            },
        ];

        await this.notificationsService.queueBulkNotifications(
            notificationsData,
        );

        this.logger.debug('Queued notifs, triggering emails');

        if (newStatus === 'APPROVED') {
            this.emailsService
                .sendBookingConfirmationEmail(
                    {
                        id: updatedBooking.renterId,
                        fullName: updatedBooking.renter.fullName,
                        email: updatedBooking.renter.email,
                        language: updatedBooking.renter.language,
                    },
                    {
                        id: updatedBooking.space.id,
                        spaceName: updatedBooking.space.name,
                        date: this.tzService.toLocalDate(
                            updatedBooking.startTime,
                            updatedBooking.space.timezone!,
                        ),
                        startTime: this.tzService.toLocalTime(
                            updatedBooking.startTime,
                            updatedBooking.space.timezone!,
                        ),
                        endTime: this.tzService.toLocalTime(
                            updatedBooking.endTime,
                            updatedBooking.space.timezone!,
                        ),
                        amount: updatedBooking.totalPrice.toString(),
                    },
                )
                .catch((err) =>
                    this.logger.error('Booking confirmation email failed', err),
                );

            this.emailsService
                .sendVendorSpaceBookingConfirmedEmail(
                    {
                        id: updatedBooking.space.vendor.userId,
                        fullName: updatedBooking.space.vendor.user.fullName,
                        email: updatedBooking.space.vendor.user.email,
                        language: updatedBooking.space.vendor.user.language,
                    },
                    {
                        id: updatedBooking.id,
                        spaceName: updatedBooking.space.name,
                        customerName: updatedBooking.renter.fullName,
                        date: this.tzService.toLocalDate(
                            booking.startTime,
                            updatedBooking.space.timezone!,
                        ),
                        startTime: this.tzService.toLocalTime(
                            booking.startTime,
                            updatedBooking.space.timezone!,
                        ),
                        endTime: this.tzService.toLocalTime(
                            booking.endTime,
                            updatedBooking.space.timezone!,
                        ),
                        amount: `${updatedBooking.totalPrice} NOK`,
                    },
                )
                .catch((err) =>
                    this.logger.error(
                        'Vendor booking confirmed email failed',
                        err,
                    ),
                );
        }

        this.logger.debug('Done');
        return updatedBooking;
    }

    async getUserBookings(userId: string, query: UserBookingsQueryDto) {
        const { type = 'all', status, page, limit } = query;
        const skip = (page - 1) * limit;

        const now = new Date();
        const where: Prisma.BookingWhereInput = {
            renterId: userId,
            ...(status && { status }),
        };

        if (type === 'upcoming') {
            where.startTime = { gte: now };
        } else if (type === 'history') {
            where.endTime = { lt: now };
        }

        const [bookings, total] = await Promise.all([
            this.db.booking.findMany({
                where,
                include: {
                    space: {
                        select: {
                            id: true,
                            name: true,
                            city: true,
                            address: true,
                            location: true,
                            images: true,
                            timezone: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.db.booking.count({ where }),
        ]);

        const bookingDtos = bookings.map((booking) => ({
            id: booking.id,
            space: {
                id: booking.space.id,
                name: booking.space.name,
                images: booking.space.images.map((image) => image.url),
            },
            status: booking.status,
            city: booking.space.city,
            address: booking.space.address,
            location: booking.space.location,
            timezone: booking.space.timezone,
            startTime: booking.startTime,
            endTime: booking.endTime,
            totalPrice: Number(booking.totalPrice),
            note: booking.note,
            relativeTime: this.formatRelativeTime(booking.createdAt),
            rejectedReason: booking.bookingRejectionReason,
            recurrenceGroupId: booking.recurrenceGroupId,
        }));

        return {
            bookings: bookingDtos,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async cancelBooking(
        bookingId: string,
        renterId: string,
        scope: 'single' | 'future' | 'all' = 'single',
    ): Promise<void> {
        const booking = await this.db.booking.findUnique({
            where: { id: bookingId },
            select: {
                id: true,
                status: true,
                startTime: true,
                stripePaymentIntentId: true,
                stripeRefundId: true,
                totalPrice: true,
                recurrenceGroupId: true,
                renter: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        language: true,
                        userType: true,
                    },
                },
                space: {
                    select: {
                        name: true,
                        timezone: true,
                        vendor: {
                            select: {
                                userId: true,
                                user: {
                                    select: {
                                        fullName: true,
                                        email: true,
                                        language: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!booking) throw new NotFoundException('Booking not found');
        if (booking.renter.id !== renterId)
            throw new ForbiddenException('Not your booking');

        let bookingsToCancel: Array<{
            id: string;
            status: BookingStatus;
            startTime: Date;
            stripePaymentIntentId: string | null;
            stripeRefundId: string | null;
            totalPrice: Prisma.Decimal;
        }> = [booking as any];

        if (booking.recurrenceGroupId) {
            if (scope === 'future') {
                const futureBookings = await this.db.booking.findMany({
                    where: {
                        recurrenceGroupId: booking.recurrenceGroupId,
                        startTime: { gte: booking.startTime },
                        status: { notIn: ['CANCELLED', 'EXPIRED', 'REJECTED'] },
                    },
                    select: {
                        id: true,
                        status: true,
                        startTime: true,
                        stripePaymentIntentId: true,
                        stripeRefundId: true,
                        totalPrice: true,
                    },
                });
                bookingsToCancel = futureBookings;
            } else if (scope === 'all') {
                const allBookings = await this.db.booking.findMany({
                    where: {
                        recurrenceGroupId: booking.recurrenceGroupId,
                        status: { notIn: ['CANCELLED', 'EXPIRED', 'REJECTED'] },
                    },
                    select: {
                        id: true,
                        status: true,
                        startTime: true,
                        stripePaymentIntentId: true,
                        stripeRefundId: true,
                        totalPrice: true,
                    },
                });
                bookingsToCancel = allBookings;
            }
        }

        for (const b of bookingsToCancel) {
            if (
                b.status === 'CANCELLED' ||
                b.status === 'EXPIRED' ||
                b.status === 'REJECTED'
            ) {
                throw new BadRequestException(
                    `Booking ${b.id.slice(-4)} doesn't qualify for a cancellation`,
                );
            }

            if (b.stripeRefundId)
                throw new BadRequestException(`Booking ${b.id.slice(-4)} already refunded`);

            if (b.status === 'APPROVED' || b.status === 'PAID') {
                const now = new Date();
                const cutoff = new Date(
                    b.startTime.getTime() - 24 * 60 * 60 * 1000,
                );

                if (now > cutoff) {
                    throw new BadRequestException(
                        `Cannot cancel booking ${b.id.slice(-4)} within 24h of start time`,
                    );
                }
            }
        }

        for (const b of bookingsToCancel) {
            let refundId: string | null = null;

            if (b.status === BookingStatus.PAID) {
                if (!b.stripePaymentIntentId)
                    throw new BadRequestException(
                        `Missing payment intent for refund on booking ${b.id.slice(-4)}`,
                    );

                refundId = await this.paymentService.refundStripePayment(
                    b.stripePaymentIntentId,
                    b.id,
                );

                await this.financialsService.recordLedgerEntry({
                    reference: `REF-${refundId}`,
                    description: `Ticket refunded to ${booking.renter.fullName}`,
                    type: FinancialType.REFUND,
                    amount: -Number(b.totalPrice),
                    actorType:
                        booking.renter.userType === 'HOST'
                            ? FinancialActor.HOST
                            : FinancialActor.ATTENDEE,
                    actorId: booking.renter.id,
                });
            }

            await this.db.$transaction(async (tx) => {
                await tx.booking.update({
                    where: { id: b.id },
                    data: {
                        status: BookingStatus.CANCELLED,
                        stripeRefundId: refundId ?? undefined,
                        refundedAt: refundId ? new Date() : null,
                        stripePaymentStatus: StripePaymentStatus.REFUNDED,
                        updatedAt: new Date(),
                    },
                });
            });

            this.notificationsService.queueNotification({
                userId: renterId,
                type: NotificationType.BOOKING_CANCELLED,
                title: `Booking Cancelled`,
                message: `You have cancelled your booking for ${booking.space.name}`,
            });

            this.emailsService
                .sendBookingCancellationEmail(
                    {
                        id: booking.renter.id,
                        fullName: booking.renter.fullName,
                        email: booking.renter.email,
                        language: booking.renter.language,
                    },
                    {
                        id: b.id,
                        spaceName: booking.space.name,
                        date: this.tzService.toLocalDate(
                            b.startTime,
                            booking.space.timezone!,
                        ),
                    },
                )
                .catch((err) =>
                    this.logger.error('Booking cancellation email failed', err),
                );

            this.emailsService
                .sendVendorSpaceBookingCancelledEmail(
                    {
                        id: booking.space.vendor.userId,
                        fullName: booking.space.vendor.user.fullName,
                        email: booking.space.vendor.user.email,
                        language: booking.space.vendor.user.language,
                    },
                    {
                        id: b.id,
                        spaceName: booking.space.name,
                        customerName: booking.renter.fullName,
                        date: this.tzService.toLocalDate(
                            b.startTime,
                            booking.space.timezone!,
                        ),
                    },
                )
                .catch((err) =>
                    this.logger.error('Vendor booking cancelled email failed', err),
                );
        }
    }

    private formatRelativeTime(createdAt: Date): string {
        const diffMs = Date.now() - createdAt.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

        if (diffHours < 1) return 'Just now';
        if (diffHours === 1) return '1h ago';
        return `${diffHours}h ago`;
    }
}
