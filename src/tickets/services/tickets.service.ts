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
    FinancialActor,
    FinancialType,
    HostStatus,
    NotificationType,
    Prisma,
    TicketPaymentStatus,
    TicketStatus,
} from '@prisma/client';
import { TicketEntity } from '../entities';
import { Paginated, PaginatedQuery } from 'src/common/types';
import { plainToInstance } from 'class-transformer';
import { TicketPricingService } from './ticket-pricing.service';
import { TicketsInventoryService } from './tickets-inventory.service';
import { NotificationsService } from 'src/notifications/services';
import { PaymentsService } from 'src/payments/services';
import { FinancialsService } from 'src/financials/services';

@Injectable({ scope: Scope.REQUEST })
export class TicketsService {
    private readonly logger = new Logger(TicketsService.name);
    constructor(
        private db: DatabaseService,
        private notificationsService: NotificationsService,
        private ticketPricingService: TicketPricingService,
        private paymentsService: PaymentsService,
        private ticketsInventoryService: TicketsInventoryService,
        private financialsService: FinancialsService,
    ) {}

    async purchaseTicket(
        userId: string,
        dto: PurchaseTicketDto,
    ): Promise<FreeTicketRes | PaidTicketRes> {
        this.logger.debug(`Getting attendee for User with UserID: ${userId}`);
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

        const existingTicket = await this.db.ticket.findFirst({
            where: {
                eventId: event.id,
                attendeeId: attendee.id,
                status: {
                    in: [TicketStatus.IN_PROGRESS, TicketStatus.PURCHASED],
                },
            },
            select: {
                status: true,
            },
        });

        if (existingTicket) {
            throw new BadRequestException(
                `You already have a ticket (${existingTicket.status}) for this event`,
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
                'Your ticket is being processed, make sure to pay the amount within 2 minutes.',
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
                attendee: {
                    select: {
                        userId: true,
                    },
                },
            },
        });

        if (!ticket) throw new NotFoundException('Ticket not found');

        if (ticket.status === TicketStatus.CANCELLED)
            throw new BadRequestException('Ticket already cancelled');

        if (ticket.status !== TicketStatus.PURCHASED)
            throw new BadRequestException(
                `Ticket not refundable because it is ${ticket.status}`,
            );

        if (ticket.isRefunded)
            throw new BadRequestException(`Your ticket is already refunded!`);

        let isRefunded: boolean = true;

        if (ticket.event.eventType === EventType.PAID) {
            try {
                await this.paymentsService.refundTicket(ticket);
            } catch (error) {
                isRefunded = false;
                throw new BadGatewayException(error);
            }
        }

        await this.financialsService.recordLedgerEntry({
            reference: `REF-${ticket.id}`,
            description: `Ticket refund`,
            type: FinancialType.REFUND,
            amount: -Number(ticket.pricePaid),
            actorType: FinancialActor.ATTENDEE,
            actorId: ticket.attendee.userId,
            ticketId: ticket.id,
        });

        await this.db.$transaction(async (tx) => {
            const updatedTicket = await tx.ticket.updateMany({
                where: { id: ticket.id, status: TicketStatus.PURCHASED },
                data: {
                    status: TicketStatus.CANCELLED,
                    isRefunded,
                    cancelledAt: new Date(),
                    refundedAt: new Date(),
                    paymentStatus: TicketPaymentStatus.REFUNDED,
                },
            });

            if (updatedTicket.count === 0)
                throw new BadRequestException('Ticket already processed');

            await this.ticketsInventoryService.decrement(ticket.eventId, tx);
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
