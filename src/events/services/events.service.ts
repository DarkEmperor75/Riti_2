import {
    BadGatewayException,
    ForbiddenException,
    HttpException,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { StorageService } from 'src/common/services';
import { DatabaseService } from 'src/database/database.service';
import {
    CreateEventDto,
    EventPreviewResponseDto,
    HostEventAttendeesResponseDto,
    HostEventResponseDto,
    HostEventStatsDto,
    PublicEventResponseDto,
    UpdateEventDto,
} from '../dto';
import {
    EventResponse,
    EventResponseData,
    EventApiErrorCode,
    HostEventsList,
    PublicEventsList,
} from '../types';
import { UsersService } from 'src/users/services';
import {
    BookingStatus,
    Event,
    EventCategory,
    EventStatus,
    EventType,
    HostStatus,
    NotificationType,
    PaymentStatus,
    Prisma,
    TicketStatus,
} from '@prisma/client';
import { ApiFail } from 'src/common/types';
import { plainToInstance } from 'class-transformer';
import { NotificationsService } from 'src/notifications/services';
import { TicketPricingService } from 'src/tickets/services';

@Injectable()
export class EventsService {
    private readonly logger = new Logger(EventsService.name);
    constructor(
        private db: DatabaseService,
        private storageService: StorageService,
        private usersService: UsersService,
        private notificationsService: NotificationsService,
        private ticketPricingService: TicketPricingService,
    ) {}

    async createEvent(
        userId: string,
        dto: CreateEventDto,
    ): Promise<EventResponse> {
        this.logger.debug('Creating event for user: ', userId);
        const validatedUserWithHostId =
            await this.validateUserAndReturnHostId(userId);
        if (!validatedUserWithHostId.success) return validatedUserWithHostId;
        const hostId = validatedUserWithHostId.hostId;

        const validationErrors = this.eventValidationEngine(dto);
        if (!validationErrors.success) {
            return validationErrors;
        }

        if (dto.bookingId) {
            const validationErrors = await this.bookingValidationEngine(
                dto.bookingId,
                userId,
                dto.capacity ?? undefined,
                dto.startTime ?? undefined,
                dto.endTime ?? undefined,
            );

            if (!validationErrors.success) {
                return validationErrors;
            }
        }

        const coverImg: string | undefined = dto.coverImg
            ? await this.uploadEventImage(dto.coverImg, userId)
            : undefined;

        let warnings: string[] = [];

        try {
            const [existingEvents, newEvent] = await this.db.$transaction(
                async (tx) => {
                    const existingEvents = (await tx.event
                        .findMany({
                            where: {
                                hostId,
                            },
                            select: {
                                id: true,
                                title: true,
                                startTime: true,
                                endTime: true,
                            },
                        })
                        .catch(() => [])) as Pick<
                        Event,
                        'id' | 'title' | 'startTime' | 'endTime' | 'hostId'
                    >[];

                    const newEvent = await tx.event.create({
                        data: {
                            hostId,
                            title: dto.title,
                            description: dto.description,
                            category: dto.category,
                            ...(dto.startTime && { startTime: dto.startTime }),
                            ...(dto.endTime && { endTime: dto.endTime }),
                            ...(dto.capacity && { capacity: dto.capacity }),
                            ...(dto.bookingId && {
                                bookingId: dto.bookingId,
                            }),
                            ...(dto.eventType && { eventType: dto.eventType }),
                            ...(dto.eventType === EventType.FREE && {
                                payoutStatus: PaymentStatus.NOT_APPLICABLE,
                            }),
                            ...(dto.price &&
                                dto.studentDiscount &&
                                dto.eventType === EventType.PAID && {
                                    price: dto.price,
                                }),
                            ...(dto.studentDiscount &&
                                dto.price &&
                                dto.eventType === EventType.PAID && {
                                    studentDiscount: dto.studentDiscount,
                                }),
                            ...(coverImg !== undefined && { coverImg }),
                        },
                    });

                    return [existingEvents, newEvent];
                },
            );

            if (existingEvents.length > 0) {
                existingEvents.forEach((event) => {
                    if (
                        event.startTime?.getTime() === dto.startTime?.getTime()
                    ) {
                        warnings.push(
                            `Warning: Event "${event.title}" starts at the same time.`,
                        );
                    }
                });
            }

            if (!newEvent) {
                return {
                    success: false,
                    error: {
                        code: 'SERVER_ERROR',
                        message: 'Failed to create event in database',
                    },
                };
            }

            return await this.buildEventResponse(
                newEvent as Event,
                hostId,
                warnings,
            );
        } catch (error) {
            this.logger.error(error);
            return {
                success: false,
                error: {
                    code: 'SERVER_ERROR',
                    message: 'Failed to create event in database',
                    details: error.message,
                },
            };
        }
    }

    async updateEvent(
        userId: string,
        dto: UpdateEventDto,
        eventId: string,
    ): Promise<EventResponse> {
        this.logger.debug('Updating event for user: ', userId);

        const validatedUserWithHostId =
            await this.validateUserAndReturnHostId(userId);
        if (!validatedUserWithHostId.success) return validatedUserWithHostId;
        const hostId = validatedUserWithHostId.hostId;

        const validateEventOrThrowErrors = await this.validateEventForUpdate(
            dto,
            eventId,
            hostId,
            userId,
        );

        if (!validateEventOrThrowErrors.success)
            return validateEventOrThrowErrors;

        const coverImg: string | undefined = dto.coverImg
            ? await this.uploadEventImage(dto.coverImg, userId)
            : undefined;

        const updateEventInput: Prisma.EventUpdateInput = {
            ...(dto.title !== undefined && { title: dto.title }),
            ...(dto.description !== undefined && {
                description: dto.description,
            }),
            ...(dto.category !== undefined && { category: dto.category }),
            ...(dto.startTime !== undefined && { startTime: dto.startTime }),
            ...(dto.endTime !== undefined && { endTime: dto.endTime }),
            ...(dto.capacity !== undefined && { capacity: dto.capacity }),
            ...(dto.bookingId !== undefined && { bookingId: dto.bookingId }),
            ...(dto.eventType !== undefined && { eventType: dto.eventType }),
            ...(dto.eventType === EventType.FREE && {
                payoutStatus: PaymentStatus.NOT_APPLICABLE,
            }),
            ...(dto.price !== undefined &&
                dto.eventType === EventType.PAID && {
                    price: dto.price,
                }),
            ...(dto.studentDiscount !== undefined &&
                dto.eventType === EventType.PAID && {
                    studentDiscount: dto.studentDiscount,
                }),
            ...(coverImg !== undefined && { coverImg }),
        };

        try {
            const updatedEvent = await this.db.event.update({
                where: { id: eventId, hostId },
                data: updateEventInput,
            });

            return await this.buildEventResponse(
                updatedEvent as Event,
                hostId,
                [],
            );
        } catch (error) {
            this.logger.error(error);
            return {
                success: false,
                error: {
                    code: 'SERVER_ERROR',
                    message: 'Failed to update event in database',
                    details: error.message,
                },
            };
        }
    }

    async publishEvent(
        userId: string,
        eventId: string,
    ): Promise<EventResponse> {
        this.logger.debug('Publishing event for user: ', userId);
        const validatedUserWithHostId =
            await this.validateUserAndReturnHostId(userId);
        if (!validatedUserWithHostId.success) return validatedUserWithHostId;
        const hostId = validatedUserWithHostId.hostId;

        const event = await this.db.event.findUnique({
            where: { id: eventId, hostId },
        });

        if (!event)
            return {
                success: false,
                error: {
                    code: 'EVENT_NOT_FOUND',
                    message: 'Event not found',
                },
            };

        if (event.status === EventStatus.PUBLISHED)
            return {
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Event is already published',
                },
            };

        const eventResponse = await this.buildEventResponse(event, hostId, []);

        if (!eventResponse.success) return eventResponse;

        const canPublish: boolean = eventResponse.data.canPublish;

        if (!canPublish)
            return {
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Event is not ready to be published',
                },
            };

        try {
            const updatedEvent = await this.db.event.update({
                where: { id: eventId, hostId },
                data: { status: EventStatus.PUBLISHED },
            });

            return await this.buildEventResponse(
                updatedEvent as Event,
                hostId,
                [],
            );
        } catch (error) {
            this.logger.error(error);
            return {
                success: false,
                error: {
                    code: 'SERVER_ERROR',
                    message: 'Failed to publish event in database',
                    details: error.message,
                },
            };
        }
    }

    async cancelEvent(userId: string, eventId: string): Promise<EventResponse> {
        this.logger.debug('Canceling event for user: ', userId);
        const validatedUserWithHostId =
            await this.validateUserAndReturnHostId(userId);
        if (!validatedUserWithHostId.success) return validatedUserWithHostId;
        const hostId = validatedUserWithHostId.hostId;

        const event = await this.db.event.findUnique({
            where: { id: eventId, hostId },
        });

        if (!event)
            return {
                success: false,
                error: {
                    code: 'EVENT_NOT_FOUND',
                    message: 'Event not found',
                },
            };

        if (event.status !== EventStatus.PUBLISHED)
            return {
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Cannot cancel events that are not published!',
                },
            };

        if (event.eventType === EventType.PAID) {
            return {
                success: false,
                error: {
                    code: 'SERVER_ERROR',
                    message: 'Paid event cancellation is not supported yet!',
                },
            };
        }

        try {
            const result = await this.db.$transaction(async (tx) => {
                const updatedEvent = await tx.event.update({
                    where: { id: eventId, hostId },
                    data: { status: EventStatus.CANCELLED },
                    include: {
                        tickets: {
                            select: {
                                id: true,
                                attendee: {
                                    select: {
                                        userId: true,
                                    },
                                },
                            },
                        },
                    },
                });

                updatedEvent.tickets.forEach((ticket) => {
                    tx.ticket.updateMany({
                        where: {
                            id: ticket.id,
                            attendee: {
                                userId: ticket.attendee.userId,
                            },
                        },
                        data: {
                            status: TicketStatus.CANCELLED,
                        },
                    });
                });

                await this.ticketPricingService.initiateRefund(eventId);

                const notitificationData: Array<{
                    userId: string;
                    type: NotificationType;
                    title: string;
                    message: string;
                    meta?: Record<string, any>;
                }> = [
                    {
                        userId: hostId,
                        type: NotificationType.EVENT_CANCELLED,
                        title: 'Event Cancelled',
                        message: `The event "${event.title}" has been cancelled.`,
                        meta: { eventId: event.id },
                    },
                    ...updatedEvent.tickets.map((ticket) => ({
                        userId: ticket.attendee.userId,
                        type: NotificationType.EVENT_CANCELLED,
                        title: 'Event Cancelled',
                        message: `The event "${event.title}" has been cancelled.`,
                        meta: { eventId: event.id },
                    })),
                ];

                await this.notificationsService.queueBulkNotifications(
                    notitificationData,
                );

                const attendeeUserIds = updatedEvent.tickets.map(
                    (ticket) => ticket.attendee.userId,
                );

                return { updatedEvent, attendeeUserIds };
            });

            await this.notificationsService.queueBulkNotifications(
                result.attendeeUserIds.map((userId) => ({
                    userId,
                    type: NotificationType.EVENT_CANCELLED,
                    title: 'Event Cancelled',
                    message: `The event "${event.title}" has been cancelled.`,
                    meta: { eventId: event.id },
                })),
            );

            return this.buildEventResponse(result.updatedEvent, hostId, []);
        } catch (error) {
            this.logger.error(error);
            return {
                success: false,
                error: {
                    code: 'SERVER_ERROR',
                    message: 'Failed to cancel event in database',
                    details: error.message,
                },
            };
        }
    }

    async deleteEvent(userId: string, eventId: string): Promise<EventResponse> {
        this.logger.debug('Deleting event for user: ', userId);
        const validatedUserWithHostId =
            await this.validateUserAndReturnHostId(userId);
        if (!validatedUserWithHostId.success) return validatedUserWithHostId;
        const hostId = validatedUserWithHostId.hostId;

        const event = await this.db.event.findUnique({
            where: { id: eventId, hostId },
        });

        if (!event)
            return {
                success: false,
                error: {
                    code: 'EVENT_NOT_FOUND',
                    message: 'Event not found',
                },
            };

        if (event.status !== EventStatus.DRAFT)
            return {
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Cannot delete events that are not draft!',
                },
            };

        try {
            const deletedEvent = await this.db.event.delete({
                where: { id: eventId, hostId },
            });
            return await this.buildEventResponse(deletedEvent, hostId, []);
        } catch (error) {
            this.logger.error(error);
            return {
                success: false,
                error: {
                    code: 'SERVER_ERROR',
                    message: 'Failed to delete event in database',
                    details: error.message,
                },
            };
        }
    }

    async getHostEvents(
        userId: string,
        page = 1,
        limit = 10,
        sortBy = 'asc' as 'asc' | 'desc',
    ): Promise<HostEventsList> {
        const validated = await this.validateUserAndReturnHostId(userId);
        if (!validated.success) {
            throw new BadGatewayException(validated.error.message);
        }
        const hostId = validated.hostId;

        const skip = (page - 1) * limit;

        const [events, total] = await this.db.$transaction([
            this.db.event.findMany({
                where: { hostId },
                orderBy: { startTime: sortBy },
                skip,
                take: limit,
                select: {
                    id: true,
                    title: true,
                    startTime: true,
                    capacity: true,
                    status: true,
                    coverImg: true,
                    category: true,
                    eventType: true,
                    ticketsSold: true,
                    tickets: {
                        select: {
                            id: true,
                        },
                    },
                    booking: {
                        select: {
                            space: {
                                select: {
                                    city: true,
                                    address: true,
                                    location: true,
                                },
                            },
                        },
                    },
                },
            }),
            this.db.event.count({ where: { hostId } }),
        ]);

        const items = events.map((e) =>
            plainToInstance(EventPreviewResponseDto, {
                id: e.id,
                title: e.title,
                eventDate: e.startTime,
                capacityUsed: `${e.ticketsSold}/${e.capacity ?? 0}`,
                eventStaus: e.status,
                coverImg: e.coverImg,
                category: e.category,
                eventType: e.eventType,
                city: e.booking?.space.city,
                address: e.booking?.space.address,
                location: e.booking?.space?.location,
            }),
        );

        return {
            items,
            meta: {
                page,
                limit,
                totalItems: total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async getHostEventsForAttendees(
        userId: string,
        hostId: string,
        page = 1,
        limit = 10,
        sortBy = 'asc' as 'asc' | 'desc',
    ): Promise<HostEventsList> {
        const user = await this.usersService.getUserProfile(userId);
        if (!user) throw new NotFoundException('User not found');

        const host = await this.db.host.findUnique({
            where: { id: hostId },
            select: {
                id: true,
                hostingStatus: true,
            },
        });

        if (!host) throw new NotFoundException('Host not found');

        if (host.hostingStatus !== HostStatus.ACTIVE)
            throw new ForbiddenException('Host is not active');

        const skip = (page - 1) * limit;

        const [events, total] = await this.db.$transaction([
            this.db.event.findMany({
                where: { hostId },
                orderBy: { startTime: sortBy },
                skip,
                take: limit,
                select: {
                    id: true,
                    title: true,
                    startTime: true,
                    capacity: true,
                    status: true,
                    coverImg: true,
                    category: true,
                    eventType: true,
                    ticketsSold: true,
                    tickets: {
                        select: {
                            id: true,
                        },
                    },
                    booking: {
                        select: {
                            space: {
                                select: {
                                    city: true,
                                    address: true,
                                    location: true,
                                },
                            },
                        },
                    },
                },
            }),
            this.db.event.count({ where: { hostId } }),
        ]);

        const items = events.map((e) =>
            plainToInstance(EventPreviewResponseDto, {
                id: e.id,
                title: e.title,
                eventDate: e.startTime,
                capacityUsed: `${e.ticketsSold}/${e.capacity ?? 0}`,
                eventStaus: e.status,
                coverImg: e.coverImg,
                category: e.category,
                eventType: e.eventType,
                city: e.booking?.space.city,
                address: e.booking?.space.address,
                location: e.booking?.space?.location,
            }),
        );

        return {
            items,
            meta: {
                page,
                limit,
                totalItems: total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async getHostEventById(
        userId: string,
        eventId: string,
    ): Promise<HostEventResponseDto> {
        const validated = await this.validateUserAndReturnHostId(userId);
        if (!validated.success) {
            throw new BadGatewayException(validated.error.message);
        }
        const hostId = validated.hostId;

        const event = await this.db.event.findFirst({
            where: { id: eventId, hostId },
            select: {
                id: true,
                title: true,
                startTime: true,
                capacity: true,
                status: true,
                coverImg: true,
                category: true,
                eventType: true,
                description: true,
                endTime: true,
                price: true,
                studentDiscount: true,
                payoutStatus: true,
                ticketsSold: true,
                booking: {
                    select: {
                        space: {
                            select: {
                                address: true,
                                city: true,
                            },
                        },
                    },
                },
                tickets: {
                    select: {
                        id: true,
                        attendeeId: true,
                    },
                },
            },
        });

        if (!event) {
            throw new NotFoundException('Event not found');
        }

        const location = event.booking?.space?.city ?? '';
        const address = event.booking?.space?.address ?? '';

        return plainToInstance(HostEventResponseDto, {
            id: event.id,
            title: event.title,
            eventDate: event.startTime,
            capacityUsed: `${event.ticketsSold}/${event.capacity ?? 0}`,
            eventStaus: event.status,
            coverImg: event.coverImg,
            category: event.category,
            eventType: event.eventType,
            description: event.description,
            startTime: event.startTime,
            endTime: event.endTime,
            location,
            address,
            price: event.price?.toString() ?? '0',
            studentDiscount: event.studentDiscount?.toString() ?? '0',
            capacity: event.capacity ?? 0,
            payoutStatus: event.payoutStatus,
            tickets: event.tickets.map((t) => t.id),
            attendees: event.tickets.map((t) => t.attendeeId),
        });
    }

    async getPublicEvents(
        page = 1,
        limit = 10,
        filters: {
            date_from?: string;
            date_to?: string;
            price_min?: string;
            price_max?: string;
            category?: EventCategory;
            city?: string;
        },
    ): Promise<PublicEventsList> {
        const skip = (page - 1) * limit;

        const where: Prisma.EventWhereInput = {
            status: EventStatus.PUBLISHED,
            bookingId: {
                not: null,
            },
        };

        if (filters.date_from || filters.date_to) {
            where.startTime = {};
            if (filters.date_from) {
                (where.startTime as any).gte = new Date(filters.date_from);
            }
            if (filters.date_to) {
                (where.startTime as any).lte = new Date(filters.date_to);
            }
        }

        if (filters.price_min || filters.price_max) {
            where.price = {};
            if (filters.price_min) {
                (where.price as any).gte = new Prisma.Decimal(
                    filters.price_min,
                );
            }
            if (filters.price_max) {
                (where.price as any).lte = new Prisma.Decimal(
                    filters.price_max,
                );
            }
        }

        if (filters.category) {
            where.category = filters.category;
        }

        if (filters.city) {
            where.booking = {
                space: {
                    vendor: {
                        user: {
                            city: filters.city,
                        },
                    },
                },
            };
        }

        const [events, total] = await this.db.$transaction([
            this.db.event.findMany({
                where,
                orderBy: { startTime: 'asc' },
                skip,
                take: limit,
                select: {
                    id: true,
                    title: true,
                    startTime: true,
                    capacity: true,
                    status: true,
                    coverImg: true,
                    category: true,
                    price: true,
                    host: {
                        select: {
                            user: { select: { fullName: true } },
                        },
                    },
                    eventType: true,
                    ticketsSold: true,
                    booking: {
                        select: {
                            space: {
                                select: { id: true, city: true, address: true },
                            },
                        },
                    },
                },
            }),
            this.db.event.count({ where }),
        ]);

        this.logger.debug('Public events: ', events);

        const items = events.map((e) =>
            plainToInstance(EventPreviewResponseDto, {
                id: e.id,
                title: e.title,
                eventDate: e.startTime,
                organizer: e.host.user.fullName,
                capacityUsed: `${e.ticketsSold}/${e.capacity ?? 0}`,
                eventStaus: e.status,
                coverImg: e.coverImg,
                category: e.category,
                eventType: e.eventType,
                price: e.price?.toString() ?? '0',
                city: e.booking?.space?.city ?? '',
                address: e.booking?.space?.address ?? '',
            }),
        );

        return {
            items,
            meta: {
                page,
                limit,
                totalItems: total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async getPublicEventById(eventId: string): Promise<PublicEventResponseDto> {
        this.logger.debug('Get public event by id: ', eventId);
        const event = await this.db.event.findFirst({
            where: {
                id: eventId,
                status: EventStatus.PUBLISHED,
                bookingId: {
                    not: null,
                },
            },
            select: {
                id: true,
                title: true,
                startTime: true,
                endTime: true,
                capacity: true,
                status: true,
                coverImg: true,
                category: true,
                eventType: true,
                description: true,
                price: true,
                studentDiscount: true,
                ticketsSold: true,
                host: {
                    select: { id: true, user: { select: { fullName: true } } },
                },
                booking: {
                    select: {
                        space: {
                            select: {
                                address: true,
                                city: true,
                                location: true,
                            },
                        },
                    },
                },
            },
        });

        if (!event) throw new NotFoundException('Event not found');

        const city = event.booking?.space?.city ?? '';
        const location = event.booking?.space?.location ?? '';
        const address = event.booking?.space?.address ?? '';

        return plainToInstance(PublicEventResponseDto, {
            id: event.id,
            title: event.title,
            eventDate: event.startTime,
            organizer: event.host.user.fullName,
            capacityUsed: `${event.ticketsSold}/${event.capacity ?? 0}`,
            eventStaus: event.status,
            coverImg: event.coverImg,
            category: event.category,
            eventType: event.eventType,
            description: event.description,
            startTime: event.startTime,
            endTime: event.endTime,
            city,
            location,
            address,
            price: event.price?.toString() ?? '0',
            studentDiscount: event.studentDiscount?.toString() ?? '0',
            capacity: event.capacity ?? 0,
            hostId: event.host.id,
        });
    }

    async getEventAttendees(
        hostId: string,
        eventId: string,
    ): Promise<HostEventAttendeesResponseDto> {
        await this.ensureHostOwnsEvent(hostId, eventId);

        try {
            const tickets = await this.db.ticket.findMany({
                where: { eventId, status: TicketStatus.PURCHASED },
                select: {
                    id: true,
                    attendeeId: true,
                    ticketType: true,
                    status: true,
                    pricePaid: true,
                    createdAt: true,
                    attendee: {
                        select: {
                            user: {
                                select: { fullName: true, email: true },
                            },
                        },
                    },
                },
                orderBy: { createdAt: 'asc' },
            });

            const items = tickets.map((t) => ({
                ticketId: t.id,
                attendeeId: t.attendeeId,
                attendeeName: t.attendee.user.fullName,
                attendeeEmail: t.attendee.user.email,
                ticketType: t.ticketType,
                status: t.status,
                pricePaid: Number(t.pricePaid),
                purchasedAt: t.createdAt,
            }));

            const totalSold = tickets.length;
            const totalRevenue = tickets.reduce(
                (sum, t) => sum + Number(t.pricePaid),
                0,
            );

            return {
                items,
                totalSold,
                totalRevenue,
            };
        } catch (error) {
            this.logger.error(
                `Failed to load attendees for event ${eventId}`,
                error.stack,
            );
            if (error instanceof HttpException) {
                throw error;
            }
            throw new BadGatewayException('Failed to load attendees');
        }
    }

    async getEventStats(
        hostId: string,
        eventId: string,
    ): Promise<HostEventStatsDto> {
        const event = await this.ensureHostOwnsEvent(hostId, eventId);

        const aggregates = await this.db.ticket.groupBy({
            by: ['ticketType'],
            where: { eventId, status: TicketStatus.PURCHASED },
            _count: { _all: true },
            _sum: { pricePaid: true },
        });

        const totalSold = event.ticketsSold;
        const regularSold =
            aggregates.find((a) => a.ticketType === 'REGULAR')?._count._all ??
            0;
        const studentSold =
            aggregates.find((a) => a.ticketType === 'STUDENT')?._count._all ??
            0;
        const grossRevenue = aggregates.reduce(
            (sum, agg) => sum + Number(agg._sum.pricePaid ?? 0),
            0,
        );

        const totalCancelled = await this.db.ticket.count({
            where: { eventId, status: TicketStatus.CANCELLED },
        });

        const totalRevenue =
            grossRevenue - totalCancelled * Number(event.price);

        const capacity = event.capacity ?? null;
        const isSoldOut = capacity !== null && totalSold >= capacity;

        return {
            totalSold,
            regularSold,
            studentSold,
            totalCancelled,
            totalRevenue,
            capacity,
            isSoldOut,
        };
    }

    private async ensureHostOwnsEvent(userId: string, eventId: string) {
        const event = await this.db.event.findUnique({
            where: { id: eventId },
            select: {
                id: true,
                capacity: true,
                price: true,
                ticketsSold: true,
                host: {
                    select: {
                        userId: true,
                    },
                },
            },
        });

        if (!event) {
            throw new NotFoundException('Event not found');
        }

        if (event.host.userId !== userId) {
            throw new ForbiddenException('You do not own this event');
        }

        return event;
    }

    private async validateEventForUpdate(
        dto: UpdateEventDto,
        eventId: string,
        hostId: string,
        userId: string,
    ): Promise<ApiFail<EventApiErrorCode> | { success: true }> {
        const existingEvent = await this.db.event.findUnique({
            where: { id: eventId, hostId },
            select: {
                hostId: true,
                status: true,
                capacity: true,
                ticketsSold: true,
            },
        });

        if (!existingEvent) {
            return {
                success: false,
                error: {
                    code: 'EVENT_NOT_FOUND',
                    message: 'Event not found',
                },
            };
        }

        if (dto.capacity !== undefined) {
            if (dto.capacity < existingEvent.ticketsSold) {
                return {
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message:
                            'Capacity cannot be lower than tickets already sold',
                    },
                };
            }
        }

        if (
            existingEvent.status === EventStatus.COMPLETED ||
            existingEvent.status === EventStatus.CANCELLED
        ) {
            return {
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message:
                        'Cannot update events that are completed or cancelled',
                },
            };
        }

        const validationErrors = this.eventValidationEngine(
            dto,
            existingEvent.status,
        );
        if (!validationErrors.success) return validationErrors;

        if (dto.bookingId) {
            const validationErrors = await this.bookingValidationEngine(
                dto.bookingId,
                userId,
                dto.capacity ?? undefined,
                dto.startTime ?? undefined,
                dto.endTime ?? undefined,
                eventId,
            );

            if (!validationErrors.success) return validationErrors;
        }

        return { success: true };
    }

    private async validateUserAndReturnHostId(
        userId: string,
    ): Promise<{ success: true; hostId: string } | ApiFail<EventApiErrorCode>> {
        try {
            const user = await this.usersService.findUserById(userId);
            if (!user || !user.hostProfile) {
                return {
                    success: false,
                    error: {
                        code: 'USER_NOT_FOUND',
                        message: 'User or host profile not found',
                    },
                };
            }

            return {
                success: true,
                hostId: user.hostProfile.id,
            };
        } catch (error) {
            this.logger.error(error);
            return {
                success: false,
                error: {
                    code: 'SERVER_ERROR',
                    message: 'Failed to validate Host',
                    details: error.message,
                },
            };
        }
    }

    private eventValidationEngine(
        dto: UpdateEventDto,
        currentEventStaus?: EventStatus,
    ): ApiFail<EventApiErrorCode> | { success: true } {
        if (currentEventStaus && currentEventStaus === EventStatus.PUBLISHED) {
            if (dto.capacity) {
                return {
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message:
                            'Cannot change capacity when event is already published',
                    },
                };
            }

            if (dto.startTime) {
                return {
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message:
                            'Cannot change start time when event is already published',
                    },
                };
            }

            if (dto.endTime) {
                return {
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message:
                            'Cannot change end time when event is already published',
                    },
                };
            }

            if (dto.eventType) {
                return {
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message:
                            'Cannot change event type when event is already published',
                    },
                };
            }

            if (dto.bookingId) {
                return {
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message:
                            'Cannot change booking when event is already published',
                    },
                };
            }
        }

        if (dto.eventType === EventType.PAID) {
            if (!dto.price) {
                return {
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Price is required for paid events',
                    },
                };
            }

            if (dto.price && !dto.studentDiscount) {
                return {
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message:
                            'Student discount is required when price is set',
                    },
                };
            }
        }

        if (dto.startTime && dto.endTime) {
            if (dto.startTime > dto.endTime) {
                return {
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Start time must be before end time',
                    },
                };
            }
        }

        if (dto.startTime && !dto.endTime) {
            return {
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'End time is required',
                },
            };
        }

        if (dto.capacity) {
            if (dto.capacity < 1)
                return {
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Capacity must be at least 1',
                    },
                };
        }

        return { success: true };
    }

    private async bookingValidationEngine(
        bookingId: string,
        userId: string,
        capacity?: number,
        startTime?: Date,
        endTime?: Date,
        currentEventId?: string,
    ): Promise<ApiFail<EventApiErrorCode> | { success: true }> {
        const currentBooking = await this.db.booking
            .findUnique({
                where: {
                    id: bookingId,
                },
                select: {
                    renterId: true,
                    status: true,
                    startTime: true,
                    endTime: true,
                    events: {
                        select: {
                            id: true,
                        },
                    },
                    space: {
                        select: {
                            capacity: true,
                        },
                    },
                },
            })
            .catch((error) => {
                this.logger.error('Failed to find booking', error);
                throw {
                    success: false,
                    error: {
                        code: 'SERVER_ERROR',
                        message: 'Failed to find booking',
                        details: error.message,
                    },
                };
            });

        if (!currentBooking) {
            return {
                success: false,
                error: {
                    code: 'BOOKING_NOT_FOUND',
                    message: `Booking with ID ${bookingId} not found`,
                },
            };
        }

        const spaceCapacity = currentBooking.space?.capacity;
        if (spaceCapacity && capacity && spaceCapacity < capacity) {
            return {
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message:
                        'Event capacity must be less than or equal to space capacity',
                },
            };
        }

        if (currentBooking.status !== BookingStatus.PAID) {
            return {
                success: false,
                error: {
                    code: 'BOOKING_NOT_CONFIRMED',
                    message: 'Booking must be CONFIRMED to link to an event',
                },
            };
        }

        if (currentBooking.renterId !== userId) {
            return {
                success: false,
                error: {
                    code: 'BOOKING_NOT_OWNED',
                    message: 'You do not own this booking',
                },
            };
        }

        if (currentEventId && currentBooking.events) {
            currentBooking.events.forEach((e) => {
                if (e.id === currentEventId) {
                    return {
                        success: false,
                        error: {
                            code: 'VALIDATION_ERROR',
                            message:
                                'This Booking Is Already In Use by another event!',
                        },
                    };
                }
            });
        }

        if (startTime && endTime) {
            if (
                currentBooking.startTime > startTime ||
                currentBooking.endTime < endTime
            ) {
                this.logger.debug(
                    `Event times must be within booking times: ${currentBooking.startTime} - ${currentBooking.endTime}, ${startTime} - ${endTime}`,
                );
                return {
                    success: false,
                    error: {
                        code: 'EVENT_TIME_OUTSIDE_BOOKING',
                        message: 'Event times must be within booking times',
                    },
                };
            }
        }

        return { success: true };
    }

    private async uploadEventImage(
        image: Express.Multer.File,
        userId: string,
    ): Promise<string> {
        try {
            const { url } = await this.storageService.uploadImage(
                image,
                'events',
                userId,
            );

            return url;
        } catch (error) {
            this.logger.error('Error uploading image', error);
            throw new BadGatewayException('Failed to upload image', error);
        }
    }

    private async buildEventResponse(
        event: Event,
        hostId: string,
        warnings: string[],
    ): Promise<EventResponse> {
        const missingForPublish: EventResponseData['missingForPublish'] = [];

        if (!event.startTime || !event.endTime) missingForPublish.push('times');
        if (!event.capacity) missingForPublish.push('capacity');
        if (!event.coverImg) missingForPublish.push('coverImg');
        if (!event.bookingId) missingForPublish.push('booking');
        if (event.eventType === EventType.PAID) {
            try {
                const host = await this.db.host.findUnique({
                    where: { id: hostId },
                    select: { stripeOnboardingCompletedAt: true },
                });

                if (!host || !host.stripeOnboardingCompletedAt) {
                    missingForPublish.push('stripeConnected');
                }
            } catch (error) {
                this.logger.error(error);
                return {
                    success: false,
                    error: {
                        code: 'SERVER_ERROR',
                        message: 'Server failed to verify host stripe status',
                        details: error.message,
                    },
                };
            }
        }
        if (!event.eventType) missingForPublish.push('eventType');

        const canPublish: boolean = missingForPublish.length === 0;

        return {
            success: true,
            warnings: warnings.length > 0 ? warnings : undefined,
            data: {
                event: {
                    id: event.id,
                    status: event.status,
                    title: event.title,
                    description: event.description,
                    category: event.category,
                    eventType: event.eventType,
                    startTime: event.startTime ?? undefined,
                    endTime: event.endTime ?? undefined,
                    bookingId: event.bookingId ?? undefined,
                    coverImg: event.coverImg ?? undefined,
                },
                canPublish,
                missingForPublish,
            },
            meta: {
                eventId: event.id,
                hostId,
            },
        };
    }
}
