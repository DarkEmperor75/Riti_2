import {
    BadRequestException,
    Injectable,
    InternalServerErrorException,
    Logger,
} from '@nestjs/common';
import { TicketEntity } from '../entities/ticket.entity';
import { StripeServiece } from 'src/payments/services';
import { Decimal } from '@prisma/client/runtime/library';
import {
    Attendee,
    Event,
    EventStatus,
    Host,
    NotificationType,
    Prisma,
    Ticket,
    TicketPaymentStatus,
    TicketStatus,
    TicketType,
    User,
} from '@prisma/client';
import { DatabaseService } from 'src/database/database.service';
import { NotificationsService } from 'src/notifications/services';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

export type EventForTicketPurchase = Prisma.EventGetPayload<{
    select: {
        id: true;
        title: true;
        hostId: true;
        capacity: true;
        ticketsSold: true;
        eventType: true;
        studentDiscount: true;
        price: true;
        status: true;
        host: {
            select: {
                userId: true;
                hostingStatus: true;
                stripeChargesEnabled: true;
                stripePayoutsEnabled: true;
            };
        };
    };
}>;

@Injectable()
export class TicketPricingService {
    private readonly logger = new Logger(TicketPricingService.name);

    constructor(
        private readonly stripe: StripeServiece,
        private db: DatabaseService,
        private notificationsService: NotificationsService,
        @InjectQueue('refunds') private refundQueue: Queue,
    ) {}

    static calculatePrice(
        isAttendeeStudent: boolean,
        eventStudentDiscount: number,
        eventPrice: number,
    ): number {
        const qualifiesForDiscount =
            isAttendeeStudent && eventStudentDiscount > 0;

        if (!qualifiesForDiscount) return eventPrice;

        return eventPrice - (eventPrice * eventStudentDiscount) / 100;
    }

    async createTicketReservation(
        attendee: Attendee & { user: User },
        event: EventForTicketPurchase,
        isPaid: Boolean,
    ) {
        return this.db.$transaction(async (tx) => {
            if (event.capacity === null)
                throw new BadRequestException('Event capacity is null');
            const updated = await tx.event.update({
                where: {
                    id: event.id,
                    status: EventStatus.PUBLISHED,
                },
                data: {
                    ticketsSold: {
                        increment: 1,
                    },
                },
                select: {
                    capacity: true,
                    ticketsSold: true,
                    tickets: {
                        where: {
                            attendeeId: attendee.id,
                            status: {
                                in: [
                                    TicketStatus.IN_PROGRESS,
                                    TicketStatus.PURCHASED,
                                ],
                            },
                        },
                    },
                },
            });

            if (!updated.capacity)
                throw new BadRequestException(
                    'Event does not have any capacity',
                );

            if (updated.tickets.length > 0) {
                this.logger.debug(`updated tickets: ${updated.tickets.length}`);
                throw new BadRequestException(
                    'User already has a tickets for this event',
                );
            }

            if (updated.capacity < updated.ticketsSold) {
                this.logger.debug(
                    `updated capacity: ${updated.capacity}, ticketsSold: ${updated.ticketsSold}`,
                );
                this.notificationsService.queueNotification({
                    userId: event.host.userId,
                    type: NotificationType.EVENT_SOLD_OUT,
                    title: 'Event sold out',
                    message: `The event ${event.title} has sold out`,
                });
                throw new BadRequestException('Event sold out');
            }

            const price = isPaid
                ? TicketPricingService.calculatePrice(
                      attendee.isStudent,
                      event.studentDiscount,
                      Number(event.price.toString()),
                  )
                : 0;

            try {
                return await tx.ticket.create({
                    data: {
                        attendeeId: attendee.id,
                        eventId: event.id,
                        ticketType: attendee.isStudent
                            ? TicketType.STUDENT
                            : TicketType.REGULAR,
                        status: isPaid
                            ? TicketStatus.IN_PROGRESS
                            : TicketStatus.PURCHASED,
                        pricePaid: price,
                        paymentStatus: isPaid
                            ? TicketPaymentStatus.INITIATED
                            : TicketPaymentStatus.COMPLETED,
                        paymentExpiresAt: isPaid
                            ? new Date(Date.now() + 5 * 60 * 1000)
                            : null,
                    },
                    select: {
                        id: true,
                        pricePaid: true,
                        status: true,
                    },
                });
            } catch (error) {
                if (
                    error instanceof Prisma.PrismaClientKnownRequestError &&
                    error.code === 'P2002'
                ) {
                    throw new BadRequestException('User already has a ticket');
                }

                throw error;
            }
        });
    }

    async createTicketCheckoutSession(
        ticket: Prisma.TicketGetPayload<{
            select: { id: true; pricePaid: true; status: true };
        }>,
        event: EventForTicketPurchase,
        attendee: Attendee,
    ) {
        const totalAmountOre = Math.round(Number(ticket.pricePaid) * 100);

        const session = await this.stripe.getClient().checkout.sessions.create({
            mode: 'payment',
            metadata: {
                ticketId: ticket.id,
                eventId: event.id,
                attendeeId: attendee.id,
            },
            line_items: [
                {
                    price_data: {
                        currency: 'nok',
                        product_data: {
                            name: `Ticket ${event.title}`,
                        },
                        unit_amount: totalAmountOre,
                    },
                    quantity: 1,
                },
            ],
            payment_intent_data: {
                metadata: {
                    ticketId: ticket.id,
                    eventId: event.id,
                    attendeeId: attendee.id,
                },
            },
            success_url: `${process.env.FRONTEND_URL}/events/${event.id}?status=success`,
            cancel_url: `${process.env.FRONTEND_URL}/events/${event.id}?status=cancel`,
        });

        if (!session.url)
            throw new InternalServerErrorException(
                'Failed to create checkout session!',
            );

        await this.db.ticket.update({
            where: { id: ticket.id },
            data: {
                stripeCheckoutSessionId: session.id,
            },
        });

        return session;
    }

    async initiateRefund(eventId: string) {
        this.logger.debug(`Initiating ticket refunds for event ${eventId}`);
        const tickets = await this.db.ticket.findMany({
            where: { eventId },
            select: { id: true },
        });

        for (const ticket of tickets) {
            try {
                await this.refundQueue.add(
                    'refund-ticket',
                    { ticketId: ticket.id },
                    {
                        attempts: 5,
                        backoff: {
                            type: 'exponential',
                            delay: 10000,
                        },
                        removeOnComplete: true,
                        removeOnFail: false,
                    },
                );
            } catch (error) {
                this.logger.error(
                    `Failed to refund ticket ${ticket.id}: ${error.message}`,
                );
                continue;
            }
        }

        this.logger.debug(`Initiated ticket refunds for event ${eventId}`);
    }
}
