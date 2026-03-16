import {
    BadGatewayException,
    ForbiddenException,
    HttpException,
    Injectable,
    InternalServerErrorException,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { DatabaseService } from 'src/database/database.service';
import {
    AdminBookingListItemDto,
    AdminBookingsListResponseDto,
    AdminBookingsQueryDto,
    AdminCommissionOverviewResponseDto,
    AdminEventCancelDto,
    AdminEventCancelResponseDto,
    AdminListSpacesQueryDto,
    AdminSpaceListItemDto,
    AdminSpaceListResponseDto,
    AdminSpaceStatusResponseDto,
    AdminSuspendUserDto,
    AdminSuspendUserResponseDto,
    AdminUserDetailResponseDto,
    AdminUserListItemDto,
    AdminUsersListResponseDto,
    AdminUsersQueryDto,
    UpdateSpaceStatusDto,
} from '../dto';
import {
    EventStatus,
    EventType,
    HostStatus,
    NotificationType,
    Prisma,
    SpaceStatus,
    TicketStatus,
    UserStatus,
    VendorStatus,
} from '@prisma/client';
import { AdminSpaceUpdateEntity, AdminEventUpdateEntity } from '../entities';
import {
    AdminTicketListItemDto,
    AdminTicketsListResponseDto,
    AdminTicketsQueryDto,
} from '../dto/admin-tickets.dto';
import { NotificationsService } from 'src/notifications/services';
import { EmailsService } from 'src/emails/services';
import { TicketPricingService } from 'src/tickets/services';

@Injectable()
export class AdminService {
    private readonly logger = new Logger(AdminService.name);
    constructor(
        private db: DatabaseService,
        private notificationsService: NotificationsService,
        private emailsService: EmailsService,
        private ticketsPricingService: TicketPricingService,
    ) {}

    async listSpacesForReview(
        query: AdminListSpacesQueryDto,
    ): Promise<AdminSpaceListResponseDto> {
        const {
            status,
            vendorStatus,
            page,
            limit,
            sortBy = 'createdAt',
            order = 'desc',
        } = query;

        const skip = (page - 1) * limit;

        const where: Prisma.SpaceWhereInput = {
            ...(status !== undefined && { status }),
            vendor: {
                ...(vendorStatus !== undefined && { vendorStatus }),
                user: { isAdmin: false },
            },
        };

        const [spaces, total] = await Promise.all([
            this.db.space.findMany({
                where,
                select: {
                    id: true,
                    name: true,
                    status: true,
                    spaceType: true,
                    capacity: true,
                    pricePerHour: true,
                    city: true,
                    address: true,
                    location: true,
                    adminReason: true,
                    createdAt: true,
                    updatedAt: true,
                    images: {
                        select: {
                            url: true,
                            order: true,
                        },
                    },
                    instructionsPdf: {
                        select: {
                            name: true,
                            url: true,
                            order: true,
                        },
                    },
                    vendor: {
                        select: {
                            id: true,
                            businessName: true,
                            vendorStatus: true,
                            user: {
                                select: {
                                    fullName: true,
                                },
                            },
                        },
                    },
                },
                orderBy: { [sortBy]: order },
                skip,
                take: limit,
            }),
            this.db.space.count({ where }),
        ]);

        this.logger.debug(`Vendor name: ${spaces[0]?.vendor?.user?.fullName}`);
        return {
            spaces: spaces.map((space) =>
                plainToInstance(
                    AdminSpaceListItemDto,
                    {
                        ...space,
                        location: space.location,
                        images: space.images,
                        instructionsPdf: space.instructionsPdf,
                        vendorId: space.vendor.id,
                        vendorBusinessName: space.vendor.businessName,
                        vendorStatus: space.vendor.vendorStatus,
                        vendorName: space.vendor.user.fullName,
                    },
                    {
                        excludeExtraneousValues: true,
                    },
                ),
            ),
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async updateSpaceStatus(
        userId: string,
        spaceId: string,
        dto: UpdateSpaceStatusDto,
    ): Promise<AdminSpaceStatusResponseDto> {
        const space = await this.db.space.findUnique({
            where: { id: spaceId },
            select: {
                id: true,
                name: true,
                status: true,
                adminReason: true,
                bookings: {
                    select: {
                        id: true,
                        startTime: true,
                        endTime: true,
                    },
                },
                vendor: {
                    select: {
                        id: true,
                        userId: true,
                        businessName: true,
                        vendorStatus: true,
                        user: {
                            select: {
                                fullName: true,
                                email: true,
                                language: true,
                            },
                        },
                        spaces: {
                            select: {
                                status: true,
                            },
                        },
                    },
                },
            },
        });

        if (!space) throw new NotFoundException('Space not found');
        AdminSpaceUpdateEntity.validateSpaceToBeUpdated(space, dto);
        const areAllSpacesSuspended =
            AdminSpaceUpdateEntity.areAllSpacesSuspended(space);

        const data: Prisma.SpaceUpdateInput = {
            status: dto.status,
            isSuspended: dto.status === SpaceStatus.SUSPENDED,
            reviewedBy: { connect: { id: userId } },
            reviewedAt: new Date(),
            ...(dto.status === SpaceStatus.REJECTED && dto.reason
                ? { adminReason: dto.reason }
                : {}),
            ...(areAllSpacesSuspended &&
                dto.status === SpaceStatus.SUSPENDED && {
                    vendor: {
                        update: {
                            vendorStatus: SpaceStatus.SUSPENDED,
                        },
                    },
                }),
        };

        try {
            return this.db.$transaction(async (tx) => {
                const updatedSpace = await tx.space.update({
                    where: { id: spaceId },
                    data,
                    select: {
                        id: true,
                        status: true,
                    },
                });

                try {
                    await tx.auditLog.create({
                        data: {
                            action: `SPACE_STATUS_UPDATE`,
                            entityId: spaceId,
                            entityType: 'SPACE',
                            adminId: userId,
                            oldStatus: space.status,
                            newStatus: dto.status,
                            reason: dto.reason,
                        },
                    });

                    const {
                        notificationMessage,
                        notificationTitle,
                        notificationType,
                    } = this.createNotificationsForSpaceStatusUpdate(
                        dto.status,
                        space.name,
                        dto.reason ?? undefined,
                    );

                    await this.notificationsService.queueNotification({
                        userId: space.vendor.userId,
                        type: notificationType,
                        title: notificationTitle,
                        message: notificationMessage,
                        meta: {
                            spaceId: space.id,
                            spaceName: space.name,
                        },
                    });

                    if (dto.status === SpaceStatus.ACTIVE) {
                        this.emailsService
                            .sendVendorSpaceBookingConfirmedEmail(
                                {
                                    id: space.vendor.userId,
                                    fullName: space.vendor.user.fullName,
                                    email: space.vendor.user.email,
                                    language: space.vendor.user.language,
                                },
                                {
                                    id: space.id,
                                    spaceName: space.name,
                                    customerName: space.vendor.user.fullName,
                                    date: new Date().toLocaleDateString(
                                        'en-GB',
                                    ),
                                    startTime: '',
                                    endTime: '',
                                    amount: '',
                                },
                            )
                            .catch((err) =>
                                this.logger.error(
                                    'Vendor space booking confirmed email failed',
                                    err,
                                ),
                            );
                    }

                    if (
                        dto.status === SpaceStatus.SUSPENDED ||
                        dto.status === SpaceStatus.REJECTED
                    ) {
                        this.emailsService
                            .sendVendorSpaceBookingCancelledEmail(
                                {
                                    id: space.vendor.userId,
                                    fullName: space.vendor.user.fullName,
                                    email: space.vendor.user.email,
                                    language: space.vendor.user.language,
                                },
                                {
                                    id: space.id,
                                    spaceName: space.name,
                                    customerName: space.vendor.user.fullName,
                                    date: new Date().toLocaleDateString(
                                        'en-GB',
                                    ),
                                },
                            )
                            .catch((err) =>
                                this.logger.error(
                                    'Vendor space booking cancelled email failed',
                                    err,
                                ),
                            );
                    }
                } catch (error) {
                    this.logger.error(error, 'Error creating audit log');
                    throw new InternalServerErrorException(
                        'Error creating audit log',
                    );
                }

                return plainToInstance(
                    AdminSpaceStatusResponseDto,
                    {
                        spaceId: updatedSpace.id,
                        status: updatedSpace.status,
                    },
                    {
                        excludeExtraneousValues: true,
                    },
                );
            });
        } catch (error) {
            this.logger.error(error);
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException(
                'Error updating space',
                error,
            );
        }
    }

    async cancelEvent(
        userId: string,
        eventId: string,
        dto: AdminEventCancelDto,
    ): Promise<AdminEventCancelResponseDto> {
        const event = await this.db.event.findUnique({
            where: { id: eventId },
            select: {
                id: true,
                eventType: true,
                status: true,
            },
        });

        if (!event) throw new NotFoundException('Event not found');
        AdminEventUpdateEntity.validateEventToBeCancelled(event.status);

        try {
            return this.db.$transaction(async (tx) => {
                if (event.eventType === EventType.PAID)
                    this.ticketsPricingService.initiateRefund(eventId);

                const updatedEvent = await tx.event.update({
                    where: { id: event.id },
                    data: {
                        status: EventStatus.CANCELLED,
                        suspensionReason: dto.reason,
                        suspendedAt: new Date(),
                    },
                    select: {
                        id: true,
                        status: true,
                    },
                });

                try {
                    await tx.ticket.updateMany({
                        where: {
                            eventId: event.id,
                            status: { not: 'CANCELLED' },
                            cancelledAt: new Date(),
                        },
                        data: {
                            status: TicketStatus.CANCELLED,
                            cancelledAt: new Date(),
                        },
                    });
                } catch (error) {
                    this.logger.error(error, 'Error cancelling tickets');
                    throw new BadGatewayException('Error cancelling tickets');
                }

                try {
                    await tx.auditLog.create({
                        data: {
                            action: `EVENT_CANCEL`,
                            entityId: event.id,
                            entityType: 'EVENT',
                            adminId: userId,
                            reason: dto.reason,
                            oldStatus: event.status,
                            newStatus: EventStatus.CANCELLED,
                        },
                    });
                } catch (error) {
                    this.logger.error(error, 'Error creating audit log');
                    throw new InternalServerErrorException(
                        'Error creating audit log',
                    );
                }

                return plainToInstance(
                    AdminEventCancelResponseDto,
                    {
                        eventId: updatedEvent.id,
                        status: updatedEvent.status,
                    },
                    {
                        excludeExtraneousValues: true,
                    },
                );
            });
        } catch (error) {
            this.logger.error(error);
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException(
                'Error cancelling event',
                error,
            );
        }
    }

    async listBookings(
        query: AdminBookingsQueryDto,
    ): Promise<AdminBookingsListResponseDto> {
        const {
            status,
            spaceId,
            page,
            limit,
            sortBy = 'createdAt',
            order = 'desc',
        } = query;
        const skip = (page - 1) * limit;

        const where: Prisma.BookingWhereInput = {
            ...(status && { status }),
            ...(spaceId && { spaceId }),
        };

        const [bookings, total] = await Promise.all([
            this.db.booking.findMany({
                where,
                include: {
                    space: { select: { id: true, name: true } },
                    renter: { select: { id: true, fullName: true } },
                },
                orderBy: { [sortBy]: order },
                skip,
                take: limit,
            }),
            this.db.booking.count({ where }),
        ]);

        return {
            bookings: bookings.map((b) =>
                plainToInstance(
                    AdminBookingListItemDto,
                    {
                        ...b,
                        bookingId: b.id,
                        spaceId: b.space.id,
                        renterId: b.renter.id,
                        spaceName: b.space.name,
                        renterName: b.renter.fullName,
                        totalPrice: b.totalPrice.toNumber(),
                    },
                    {
                        excludeExtraneousValues: true,
                    },
                ),
            ),
            meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }

    async listTickets(
        query: AdminTicketsQueryDto,
    ): Promise<AdminTicketsListResponseDto> {
        const { status, eventId, attendeeId, page, limit = 20 } = query;
        const skip = (page - 1) * limit;

        const where: Prisma.TicketWhereInput = {
            ...(status !== undefined && { status }),
            ...(eventId !== undefined && { eventId }),
            ...(attendeeId !== undefined && { attendeeId }),
        };

        const [tickets, total] = await Promise.all([
            this.db.ticket.findMany({
                where,
                include: {
                    event: { select: { id: true, title: true } },
                    attendee: {
                        include: {
                            user: { select: { id: true, fullName: true } },
                        },
                    },
                },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.db.ticket.count({ where }),
        ]);

        return {
            tickets: tickets.map((t) =>
                plainToInstance(
                    AdminTicketListItemDto,
                    {
                        ...t,
                        ticketId: t.id,
                        eventId: t.event.id,
                        attendeeId: t.attendee.id,
                        eventTitle: t.event.title,
                        attendeeName: t.attendee.user.fullName,
                        pricePaid: t.pricePaid.toNumber(),
                    },
                    {
                        excludeExtraneousValues: true,
                    },
                ),
            ),
            meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }

    async listUsers(
        query: AdminUsersQueryDto,
    ): Promise<AdminUsersListResponseDto> {
        const { userType, status, email, page, limit = 50 } = query;
        const skip = (page - 1) * limit;

        const where: Prisma.UserWhereInput = {
            ...(userType && { userType }),
            ...(status && { status }),
            ...(email && { email: { contains: email } }),
            isAdmin: false,
        };

        const [users, total] = await Promise.all([
            this.db.user.findMany({
                where,
                include: {
                    vendorProfile: { select: { vendorStatus: true } },
                    hostProfile: { select: { hostingStatus: true } },
                    spaces: {
                        select: { id: true },
                        where: { status: 'ACTIVE' },
                    },
                    bookings: true,
                    attendeeProfile: { include: { tickets: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.db.user.count({ where }),
        ]);

        return {
            users: users.map((u) =>
                plainToInstance(
                    AdminUserListItemDto,
                    {
                        ...u,
                        vendorStatus: u.vendorProfile?.vendorStatus,
                        hostingStatus: u.hostProfile?.hostingStatus,
                        spacesCount: u.spaces.length,
                        bookingsCount: u.bookings.length,
                        ticketsCount: u.attendeeProfile?.tickets.length || 0,
                        eventsCount: 0,
                        city: u.city,
                    },
                    {
                        excludeExtraneousValues: true,
                    },
                ),
            ),
            meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }

    async getUserDetails(userId: string): Promise<AdminUserDetailResponseDto> {
        const user = await this.db.user.findUnique({
            where: { id: userId },
            include: {
                attendeeProfile: {
                    select: {
                        bio: true,
                        phoneNumber: true,
                        isStudent: true,
                        stripeAccountId: true,
                        stripeOnboarded: true,
                        stripeVerified: true,
                    },
                },
                hostProfile: {
                    select: {
                        bio: true,
                        phoneNumber: true,
                        website: true,
                        instagramUrl: true,
                        tikTokUrl: true,
                        twitterUrl: true,
                        otherSocialLinks: true,
                        stripeAccountId: true,
                        stripeOnboardingCompletedAt: true,
                        hostingStatus: true,
                        suspendedAt: true,
                        suspensionReason: true,
                    },
                },
                vendorProfile: {
                    select: {
                        isOnBoarded: true,
                        vendorStatus: true,
                        businessName: true,
                        contactPhone: true,
                        contactEmail: true,
                        businessPfp: true,
                        stripeAccountId: true,
                        stripeOnboardingCompletedAt: true,
                        stripeChargesEnabled: true,
                        approvedAt: true,
                        approvedBy: true,
                        rejectionReason: true,
                        suspendedAt: true,
                        suspensionReason: true,
                    },
                },
            },
        });

        if (!user) throw new NotFoundException('User not found');

        const [
            spacesCount,
            eventsCount,
            bookingsCount,
            ticketsCount,
            sessionsCount,
        ] = await Promise.all([
            this.db.space.count({ where: { vendorId: userId } }),
            this.db.event.count({ where: { hostId: userId } }),
            this.db.booking.count({ where: { renterId: userId } }),
            this.db.ticket.count({ where: { attendeeId: userId } }),
            this.db.session.count({ where: { userId } }),
        ]);

        return plainToInstance(
            AdminUserDetailResponseDto,
            {
                ...user,
                attendee: user.attendeeProfile,
                host: user.hostProfile,
                vendor: user.vendorProfile,
                spacesCount,
                eventsCount,
                bookingsCount,
                ticketsCount,
                sessionsCount,
            },
            {
                excludeExtraneousValues: true,
            },
        );
    }

    async suspendUser(
        adminId: string,
        userId: string,
        dto: AdminSuspendUserDto,
    ): Promise<AdminSuspendUserResponseDto> {
        return this.db.$transaction(async (tx) => {
            const user = await tx.user.findUnique({
                where: { id: userId },
                include: { hostProfile: true, vendorProfile: true },
            });

            if (!user) throw new NotFoundException('User not found');
            if (user.isAdmin)
                throw new ForbiddenException('Cannot suspend admin accounts');
            if (user.status === 'SUSPENDED')
                throw new ForbiddenException('User already suspended');

            const updatedUser = await tx.user.update({
                where: { id: userId },
                data: {
                    status: UserStatus.SUSPENDED,
                    updatedAt: new Date(),
                    suspendedAt: new Date(),
                    suspensionReason: dto.reason,
                },
                select: { id: true, status: true },
            });

            if (user.hostProfile) {
                await tx.host.update({
                    where: { userId },
                    data: {
                        hostingStatus: HostStatus.SUSPENDED,
                        suspendedAt: new Date(),
                        suspensionReason: dto.reason,
                    },
                });
            }

            if (user.vendorProfile) {
                await tx.vendor.update({
                    where: { userId },
                    data: {
                        vendorStatus: VendorStatus.SUSPENDED,
                        suspendedAt: new Date(),
                        suspensionReason: dto.reason,
                    },
                });
            }

            await tx.auditLog.create({
                data: {
                    action: 'USER_SUSPEND',
                    entityId: userId,
                    entityType: 'USER',
                    adminId,
                    oldStatus: user.status,
                    newStatus: 'SUSPENDED',
                    reason: dto.reason,
                },
            });

            return plainToInstance(
                AdminSuspendUserResponseDto,
                {
                    userId: updatedUser.id,
                    status: updatedUser.status,
                    suspendedAt: new Date(),
                },
                {
                    excludeExtraneousValues: true,
                },
            );
        });
    }

    async unsuspendUser(
        adminId: string,
        userId: string,
    ): Promise<{
        userId: string;
        status: UserStatus;
        unsuspendedAt: Date | null;
    }> {
        return this.db.$transaction(async (tx) => {
            const user = await tx.user.findUnique({
                where: { id: userId },
                include: { hostProfile: true, vendorProfile: true },
            });

            if (!user) throw new NotFoundException('User not found');
            if (user.status !== 'SUSPENDED')
                throw new ForbiddenException('User not suspended');

            const updatedUser = await tx.user.update({
                where: { id: userId },
                data: {
                    status: UserStatus.ACTIVE,
                    updatedAt: new Date(),
                    suspendedAt: null,
                    suspensionReason: null,
                },
                select: { id: true, status: true },
            });

            if (user.hostProfile) {
                await tx.host.update({
                    where: { userId },
                    data: {
                        hostingStatus: HostStatus.ACTIVE,
                        suspendedAt: null,
                        suspensionReason: null,
                    },
                });
            }

            if (user.vendorProfile) {
                await tx.vendor.update({
                    where: { userId },
                    data: {
                        vendorStatus: VendorStatus.APPROVED,
                        suspendedAt: null,
                        suspensionReason: null,
                    },
                });
            }

            await tx.auditLog.create({
                data: {
                    action: 'USER_UNSUSPEND',
                    entityId: userId,
                    entityType: 'USER',
                    adminId,
                    oldStatus: user.status,
                    newStatus: 'ACTIVE',
                },
            });

            return {
                userId: updatedUser.id,
                status: updatedUser.status,
                unsuspendedAt: new Date(),
            };
        });
    }

    async getCommissionOverview(): Promise<AdminCommissionOverviewResponseDto> {
        const commissionFilter: Prisma.BookingWhereInput = {
            status: { in: ['PAID', 'COMPLETED'] },
            stripeRefundId: null,
        };

        const lifetime = await this.db.booking.aggregate({
            where: commissionFilter,
            _sum: { applicationFeeAmount: true },
        });

        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const today = await this.db.booking.aggregate({
            where: {
                ...commissionFilter,
                createdAt: { gte: startOfToday },
            },
            _sum: { applicationFeeAmount: true },
        });

        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const month = await this.db.booking.aggregate({
            where: {
                ...commissionFilter,
                createdAt: { gte: startOfMonth },
            },
            _sum: { applicationFeeAmount: true },
        });

        const refunds = await this.db.booking.aggregate({
            where: { stripeRefundId: { not: null } },
            _sum: { applicationFeeAmount: true },
        });

        const toNok = (øre?: number | null) => (øre ? øre / 100 : 0);

        return {
            lifetimeCommission: toNok(lifetime._sum.applicationFeeAmount),
            todayCommission: toNok(today._sum.applicationFeeAmount),
            monthCommission: toNok(month._sum.applicationFeeAmount),
            refundedCommission: toNok(refunds._sum.applicationFeeAmount),
        };
    }

    async getPlatformFinancialOverview() {
        const [bookingStats, ticketStats] = await Promise.all([
            this.aggregateBookings(),
            this.aggregateTickets(),
        ]);

        const totalGross = bookingStats.gross + ticketStats.gross;

        const totalRefunded = bookingStats.refunded + ticketStats.refunded;

        const totalTransferred =
            bookingStats.transferred + ticketStats.transferred;

        const platformNet = bookingStats.platformRevenue;

        return {
            currency: 'NOK',

            bookings: bookingStats,
            tickets: ticketStats,

            summary: {
                totalGross,
                totalRefunded,
                totalTransferred,
                platformNet,
            },
        };
    }

    private async aggregateBookings() {
        const bookings = await this.db.booking.aggregate({
            _sum: {
                totalPrice: true,
                applicationFeeAmount: true,
                vendorPayoutAmount: true,
            },
            where: {
                stripePaymentStatus: 'COMPLETED',
            },
        });

        const refunded = await this.db.booking.aggregate({
            _sum: {
                totalPrice: true,
            },
            where: {
                refundedAt: { not: null },
            },
        });

        const transferred = await this.db.booking.aggregate({
            _sum: {
                vendorPayoutAmount: true,
            },
            where: {
                stripeTransferId: { not: null },
            },
        });

        return {
            gross: Number(bookings._sum.totalPrice ?? 0),
            refunded: Number(refunded._sum.totalPrice ?? 0),
            transferred: Number(transferred._sum.vendorPayoutAmount ?? 0),
            platformRevenue: Number(bookings._sum.applicationFeeAmount ?? 0),
        };
    }

    private async aggregateTickets() {
        const tickets = await this.db.ticket.aggregate({
            _sum: {
                pricePaid: true,
            },
            where: {
                paymentStatus: 'COMPLETED',
            },
        });

        const refunded = await this.db.ticket.aggregate({
            _sum: {
                pricePaid: true,
            },
            where: {
                refundedAt: { not: null },
            },
        });

        const transferred = await this.db.ticket.aggregate({
            _sum: {
                pricePaid: true,
            },
            where: {
                stripeTransferId: { not: null },
            },
        });

        return {
            gross: Number(tickets._sum.pricePaid ?? 0),
            refunded: Number(refunded._sum.pricePaid ?? 0),
            transferred: Number(transferred._sum.pricePaid ?? 0),
        };
    }

    private createNotificationsForSpaceStatusUpdate(
        status: SpaceStatus,
        spaceName: string,
        reason?: string,
    ): {
        notificationType: NotificationType;
        notificationTitle: string;
        notificationMessage: string;
    } {
        const notificationType: NotificationType =
            status === SpaceStatus.SUSPENDED
                ? NotificationType.SPACE_SUSPENDED
                : status === SpaceStatus.REJECTED
                  ? NotificationType.BOOKING_REJECTED
                  : NotificationType.BOOKING_APPROVED;

        const notificationTitle: string =
            notificationType === NotificationType.BOOKING_APPROVED
                ? 'Booking Approved'
                : notificationType === NotificationType.BOOKING_REJECTED
                  ? 'Booking Rejected'
                  : 'Space Suspended';

        const notificationMessage =
            notificationType === NotificationType.BOOKING_APPROVED
                ? `Congrats! Your space: ${spaceName} has been approved!`
                : notificationType === NotificationType.BOOKING_REJECTED
                  ? `Your space: ${spaceName} has been rejected due to the following reason: ${reason}`
                  : `Your space: ${spaceName} has been suspended due to the following reason: ${reason}`;

        return { notificationType, notificationTitle, notificationMessage };
    }
}
