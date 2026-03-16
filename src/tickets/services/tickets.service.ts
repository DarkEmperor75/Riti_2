import {
    BadGatewayException,
    BadRequestException,
    ForbiddenException,
    Injectable,
    Logger,
    NotFoundException,
    Scope,
} from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import {
    FreeTicketRes,
    PaidTicketRes,
    PurchaseTicketDto,
    TicketResponseDto,
} from '../dto';
import {
    EventStatus,
    EventType,
    HostStatus,
    NotificationType,
    Prisma,
    Ticket,
    TicketPaymentStatus,
    TicketStatus,
    TicketType,
} from '@prisma/client';
import { TicketEntity } from '../entities';
import { Paginated, PaginatedQuery } from 'src/common/types';
import { plainToInstance } from 'class-transformer';
import { TicketPricingService } from './ticket-pricing.service';
import { NotificationsService } from 'src/notifications/services';
import { PaymentsService } from 'src/payments/services';

@Injectable({ scope: Scope.REQUEST })
export class TicketsService {
    private readonly logger = new Logger(TicketsService.name);
    constructor(
        private db: DatabaseService,
        private notificationsService: NotificationsService,
        private ticketPricingService: TicketPricingService,
        private paymentsService: PaymentsService,
    ) {}

    async purchaseTicket(
        userId: string,
        dto: PurchaseTicketDto,
    ): Promise<FreeTicketRes | PaidTicketRes> {
        const attendee = await this.db.attendee.findUnique({
            where: {
                userId,
            },
            include: {
                user: true,
            },
        });

        if (!attendee) throw new NotFoundException('Attendee not found');

        const event = await this.db.event.findUnique({
            where: { id: dto.eventId },
            select: {
                id: true,
                title: true,
                hostId: true,
                capacity: true,
                ticketsSold: true,
                eventType: true,
                studentDiscount: true,
                price: true,
                status: true,
                host: {
                    select: {
                        userId: true,
                        hostingStatus: true,
                        stripeChargesEnabled: true,
                        stripePayoutsEnabled: true,
                    },
                },
            },
        });

        if (!event || event.status !== EventStatus.PUBLISHED) {
            throw new BadRequestException('Event not available');
        }

        if (event.host.hostingStatus !== HostStatus.ACTIVE) {
            throw new ForbiddenException(
                'Host is suspended, so their events are not available',
            );
        }

        if (event.eventType === EventType.FREE) {
            const ticket =
                await this.ticketPricingService.createTicketReservation(
                    attendee,
                    event,
                    false,
                );
            await this.queueTicketPurchaseNotifications(
                userId,
                event.host.userId,
                attendee.user.fullName,
                event.id,
                event.title,
                ticket.id,
            );

            return {
                success: true,
                message: `Ticket for ${event.title} purchased successfully!`,
            };
        }

        if (
            !event.host.stripeChargesEnabled ||
            !event.host.stripePayoutsEnabled
        ) {
            throw new BadGatewayException(
                'Host is not permitted to accept payments',
            );
        }

        const ticket = await this.ticketPricingService.createTicketReservation(
            attendee,
            event,
            true,
        );

        this.logger.debug('Creating checkout session for ticket: ', ticket.id);

        const checkout = await this.ticketPricingService
            .createTicketCheckoutSession(ticket, event, attendee)
            .catch((error) => {
                this.logger.error(error);
                throw new BadGatewayException(
                    'Failed to create checkout session',
                );
            });

        return {
            checkoutUrl: checkout.url ? checkout.url : '',
            status: ticket.status,
            message:
                'Your ticket is being processed, make sure to pay the amount within 5 minutes.',
        };
    }

    async cancelTicket(
        userId: string,
        ticketId: string,
    ): Promise<{
        success: boolean;
        message: string;
        ticketId: string;
    }> {
        const ticket = await this.db.ticket.findFirst({
            where: {
                id: ticketId,
                attendee: { userId },
            },
            include: {
                event: {
                    select: {
                        id: true,
                        title: true,
                        startTime: true,
                        eventType: true,
                    },
                },
            },
        });

        if (!ticket) throw new NotFoundException('Ticket not found');

        if (ticket.status === TicketStatus.CANCELLED)
            throw new BadRequestException('Ticket already cancelled');

        if (ticket.status !== TicketStatus.PURCHASED)
            throw new BadRequestException(`Ticket not refundable because it is ${ticket.status}`);

        if(ticket.event.eventType === EventType.PAID)
            await this.paymentsService.refundTicket(ticket);

        await this.db.$transaction(async (tx) => {
            await tx.ticket.update({
                where: { id: ticket.id },
                data: {
                    status: TicketStatus.CANCELLED,
                    isRefunded: true,
                    cancelledAt: new Date(),
                    refundedAt: new Date(),
                    paymentStatus: TicketPaymentStatus.REFUNDED,
                },
            });

            await tx.event.update({
                where: { id: ticket.eventId },
                data: {
                    ticketsSold: { decrement: 1 },
                },
            });
        });

        await this.notificationsService.create(
            userId,
            NotificationType.TICKET_CANCELLED,
            'Ticket Cancelled',
            `You have successfully cancelled your ticket for ${ticket.event.title}.`,
        );

        return {
            success: true,
            message: `Ticket for ${ticket.event.title} cancelled successfully!`,
            ticketId: ticket.id,
        };
    }

    async myTickets(
        userId: string,
        { page = 1, limit = 10, status }: PaginatedQuery<TicketStatus>,
    ): Promise<Paginated<TicketResponseDto>> {
        const skip = (page - 1) * limit;
        const where: Prisma.TicketWhereInput = {
            attendee: { userId },
            ...(status && { status }),
        };

        const [tickets, totalItems] = await Promise.all([
            this.db.ticket.findMany({
                where,
                skip,
                take: parseInt(limit.toString()),
                include: {
                    event: {
                        select: {
                            coverImg: true,
                            title: true,
                            startTime: true,
                            status: true,
                            booking: {
                                select: {
                                    space: {
                                        select: {
                                            address: true,
                                            location: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.db.ticket.count({ where }),
        ]);

        this.logger.debug('Got Tickets for user: ', userId);
        return {
            items: tickets.map((t) => TicketEntity.fromPrisma(t).toDto()),
            meta: {
                page,
                limit,
                totalItems,
                totalPages: Math.ceil(totalItems / limit),
            },
        };
    }

    async getTicket(userId: string, id: string): Promise<TicketResponseDto> {
        const ticketModel = await this.db.ticket.findFirst({
            where: { id, attendee: { userId } },
            include: {
                event: {
                    select: {
                        coverImg: true,
                        title: true,
                        startTime: true,
                        status: true,
                        booking: {
                            select: {
                                space: {
                                    select: {
                                        address: true,
                                        location: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
        if (!ticketModel) throw new NotFoundException();
        return plainToInstance(
            TicketResponseDto,
            TicketEntity.fromPrisma(ticketModel).toDto(),
        );
    }

    private async queueTicketPurchaseNotifications(
        userId: string,
        hostUserId: string,
        attendeeFullName: string,
        eventId: string,
        eventTitle: string,
        ticketId: string,
    ) {
        const notificationData: Array<{
            userId: string;
            type: NotificationType;
            title: string;
            message: string;
            meta?: Record<string, any>;
        }> = [
            {
                userId,
                type: NotificationType.TICKET_CONFIRMED,
                title: 'Ticket Confirmation',
                message: `You have successfully purchased a ticket for ${eventTitle}.`,
                meta: {
                    eventId: eventId,
                    ticketId: ticketId,
                },
            },
            {
                userId: hostUserId,
                type: NotificationType.TICKET_SOLD,
                title: 'Ticket Sold',
                message: `${attendeeFullName} has successfully purchased a ticket for ${eventTitle}.`,
                meta: {
                    eventId: eventId,
                    ticketId: ticketId,
                },
            },
        ];

        await this.notificationsService.queueBulkNotifications(
            notificationData,
        );
    }
}
