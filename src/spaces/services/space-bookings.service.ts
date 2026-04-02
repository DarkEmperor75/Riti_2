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

        return this.db.$transaction(async (tx) => {
            const conflict = await tx.booking.findFirst({
                where: {
                    spaceId,
                    status: { in: ['APPROVED', 'PAID'] },
                    OR: [
                        {
                            startTime: { lt: endDateTimeUTC },
                            endTime: { gt: startDateTimeUTC },
                        },
                    ],
                },
            });

            if (conflict) throw new ConflictException('Time slot unavailable');

            const result = await tx.booking.create({
                data: {
                    spaceId,
                    renterId,
                    startTime: startDateTimeUTC,
                    endTime: endDateTimeUTC,
                    totalPrice: new Prisma.Decimal(
                        space.pricePerHour.toNumber() * durationHours,
                    ),
                    status: 'PENDING',
                    expiryTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    note,
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
                const overlap = await tx.booking.findFirst({
                    where: {
                        spaceId: booking.spaceId,
                        status: { in: ['APPROVED', 'PAID'] },
                        OR: [
                            {
                                startTime: { lt: booking.endTime },
                                endTime: { gt: booking.startTime },
                            },
                        ],
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
                        OR: [
                            {
                                startTime: { lt: booking.endTime },
                                endTime: { gt: booking.startTime },
                            },
                        ],
                        id: { not: bookingId },
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

    async cancelBooking(bookingId: string, renterId: string): Promise<void> {
        const booking = await this.db.booking.findUnique({
            where: { id: bookingId },
            select: {
                id: true,
                status: true,
                startTime: true,
                stripePaymentIntentId: true,
                stripeRefundId: true,
                totalPrice: true,
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

        if (
            booking.status === 'CANCELLED' ||
            booking.status === 'EXPIRED' ||
            booking.status === 'REJECTED'
        ) {
            throw new BadRequestException(
                `Booking doesn't qualify for a cancellation`,
            );
        }

        if (booking.stripeRefundId)
            throw new BadRequestException('Booking already refunded');

        if (booking.status === 'APPROVED' || booking.status === 'PAID') {
            const now = new Date();
            const cutoff = new Date(
                booking.startTime.getTime() - 24 * 60 * 60 * 1000,
            );

            if (now > cutoff) {
                throw new BadRequestException(
                    'Cannot cancel within 24h of start time',
                );
            }
        }

        let refundId: string | null = null;

        if (booking.status === BookingStatus.PAID) {
            if (!booking.stripePaymentIntentId)
                throw new BadRequestException(
                    'Missing payment intent for refund',
                );

            refundId = await this.paymentService.refundStripePayment(
                booking.stripePaymentIntentId,
                bookingId,
            );

            await this.financialsService.recordLedgerEntry({
                reference: `REF-${refundId}`,
                description: `Ticket refunded to ${booking.renter.fullName}`,
                type: FinancialType.REFUND,
                amount: -Number(booking.totalPrice),
                actorType:
                    booking.renter.userType === 'HOST'
                        ? FinancialActor.HOST
                        : FinancialActor.ATTENDEE,
                actorId: booking.renter.id,
            });

            const logger = new Logger(SpaceBookingsService.name);
            logger.log(`Refund ID: ${refundId}`);
        }

        await this.db.$transaction(async (tx) => {
            await tx.booking.update({
                where: { id: bookingId },
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
                    id: booking.id,
                    spaceName: booking.space.name,
                    date: this.tzService.toLocalDate(
                        booking.startTime,
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
                    id: booking.id,
                    spaceName: booking.space.name,
                    customerName: booking.renter.fullName,
                    date: this.tzService.toLocalDate(
                        booking.startTime,
                        booking.space.timezone!,
                    ),
                },
            )
            .catch((err) =>
                this.logger.error('Vendor booking cancelled email failed', err),
            );
    }

    private formatRelativeTime(createdAt: Date): string {
        const diffMs = Date.now() - createdAt.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

        if (diffHours < 1) return 'Just now';
        if (diffHours === 1) return '1h ago';
        return `${diffHours}h ago`;
    }
}
