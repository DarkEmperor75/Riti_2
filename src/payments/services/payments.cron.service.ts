import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DatabaseService } from 'src/database/database.service';
import { StripeServiece } from './stripe.service';
import {
    EventStatus,
    FinancialActor,
    FinancialType,
    PaymentStatus,
    Prisma,
    TicketPaymentStatus,
    TicketStatus,
} from '@prisma/client';
import { EmailsService } from 'src/emails/services';
import { FinancialsService } from 'src/financials/services';

@Injectable()
export class PaymentsCronService {
    private readonly logger = new Logger(PaymentsCronService.name);
    constructor(
        private db: DatabaseService,
        private stripe: StripeServiece,
        private emailsService: EmailsService,
        private financialsService: FinancialsService,
    ) {}

    @Cron(CronExpression.EVERY_HOUR)
    async releaseVendorPayouts() {
        const now = new Date();

        const eligibleBookings = await this.db.booking.findMany({
            where: {
                status: 'COMPLETED',
                payoutReleasedAt: null,
                stripeChargeId: { not: null },
                vendorPayoutAmount: { not: null },
                endTime: {
                    lt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
                },
            },
            select: {
                id: true,
                vendorPayoutAmount: true,
                stripeChargeId: true,
                applicationFeeAmount: true,
                space: {
                    select: {
                        id: true,
                        name: true,
                        vendor: {
                            select: {
                                userId: true,
                                stripeAccountId: true,
                                stripeOnboardingCompletedAt: true,
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

        for (const booking of eligibleBookings) {
            try {
                if (!booking.space.vendor.stripeAccountId) continue;
                if (!booking.space.vendor.stripeOnboardingCompletedAt) continue;

                const transfer = await this.stripe.getClient().transfers.create(
                    {
                        amount: booking.vendorPayoutAmount!,
                        currency: 'nok',
                        destination: booking.space.vendor.stripeAccountId,
                        source_transaction: booking.stripeChargeId!,
                        metadata: {
                            bookingId: booking.id,
                        },
                    },
                    {
                        idempotencyKey: `vendor-payout-${booking.id}`,
                    },
                );

                await this.db.booking.update({
                    where: { id: booking.id },
                    data: {
                        stripeTransferId: transfer.id,
                        payoutReleasedAt: new Date(),
                    },
                });

                await this.db.payout.create({
                    data: {
                        actorType: 'VENDOR',
                        actorId: booking.space.vendor.userId,
                        stripeTransferId: transfer.id,
                        amount: booking.vendorPayoutAmount!,
                        status: 'COMPLETED',
                        processedAt: new Date(),
                    },
                });

                this.emailsService.sendVendorSpacePayoutEmail(
                    {
                        id: booking.space.vendor.userId,
                        fullName: booking.space.vendor.user.fullName,
                        email: booking.space.vendor.user.email,
                        language: booking.space.vendor.user.language,
                    },
                    {
                        spaceId: booking.space.id,
                        spaceName: booking.space.name,
                        amount: booking.vendorPayoutAmount?.toString() ?? '0',
                        payoutDate: new Date().toISOString(),
                    },
                );

                this.logger.debug(
                    `Payout for booking ${booking.id} released, transfer id: ${transfer.id}, recording ledger entry`,
                );

                await this.financialsService.recordLedgerEntry({
                    reference: `PAY-${booking.id}`,
                    description: `Vendor payout`,
                    type: FinancialType.PAYOUT,
                    amount: -Number(booking.vendorPayoutAmount),
                    actorType: FinancialActor.VENDOR,
                    actorId: booking.space.vendor.userId,
                });

                await this.financialsService.recordLedgerEntry({
                    reference: `FEE-${booking.id}`,
                    description: 'Platform fee from booking',
                    type: FinancialType.PLATFORM_FEE,
                    amount: Number(booking.applicationFeeAmount),
                });

                this.logger.debug(
                    `Payout for booking ${booking.id} released, ledger entry recorded`,
                );

                this.logger.log(`Released payout for booking ${booking.id}`);
            } catch (error) {
                this.logger.error(
                    `Failed payout for booking ${booking.id}`,
                    error,
                );
            }
        }
    }

    @Cron(CronExpression.EVERY_10_MINUTES)
    async expireStaleTicketReservations() {
        this.logger.log('Checking for expired tickets');
        const expiredTickets = await this.db.ticket.findMany({
            where: {
                status: TicketStatus.IN_PROGRESS,
                paymentExpiresAt: { lt: new Date() },
            },
            select: {
                id: true,
                eventId: true,
            },
        });

        for (const ticket of expiredTickets) {
            await this.db.$transaction(async (tx) => {
                const updatedTicket = await tx.ticket.updateMany({
                    where: { id: ticket.id, status: TicketStatus.IN_PROGRESS },
                    data: {
                        status: TicketStatus.EXPIRED,
                        paymentStatus: TicketPaymentStatus.FAILED,
                    },
                });

                if (updatedTicket.count > 0) {
                    await this.decrement(ticket.eventId, tx);
                }
            });
        }
    }

    @Cron(CronExpression.EVERY_HOUR)
    async releaseHostEventPayouts() {
        const now = new Date();

        this.logger.log('Checking for host payouts');

        const eligibleEvents = await this.db.event.findMany({
            where: {
                status: EventStatus.COMPLETED,
                payoutStatus: PaymentStatus.UNINITIATED,
                endTime: {
                    lt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
                },
            },
            select: {
                id: true,
                hostId: true,
                host: {
                    select: {
                        userId: true,
                        stripeAccountId: true,
                        stripeOnboardingCompletedAt: true,
                    },
                },
            },
        });

        for (const event of eligibleEvents) {
            if (!event.host.stripeAccountId) continue;
            if (!event.host.stripeOnboardingCompletedAt) continue;

            const tickets = await this.db.ticket.findMany({
                where: {
                    eventId: event.id,
                    status: TicketStatus.PURCHASED,
                    paymentStatus: TicketPaymentStatus.COMPLETED,
                    stripeTransferId: null,
                    refundedAt: null,
                },
                select: {
                    id: true,
                    pricePaid: true,
                },
            });

            if (tickets.length === 0) continue;

            const totalAmountOre = tickets.reduce(
                (sum, t) => sum + Math.round(Number(t.pricePaid) * 100),
                0,
            );

            try {
                const transfer = await this.stripe.getClient().transfers.create(
                    {
                        amount: totalAmountOre,
                        currency: 'nok',
                        destination: event.host.stripeAccountId,
                        metadata: {
                            eventId: event.id,
                            type: 'event_payout',
                        },
                    },
                    {
                        idempotencyKey: `host-payout-${event.id}`,
                    },
                );

                await this.db.$transaction(async (tx) => {
                    await tx.ticket.updateMany({
                        where: {
                            eventId: event.id,
                            stripeTransferId: null,
                        },
                        data: {
                            stripeTransferId: transfer.id,
                        },
                    });

                    const updatedEvent = await tx.event.update({
                        where: { id: event.id },
                        data: {
                            payoutStatus: PaymentStatus.COMPLETED,
                        },
                        select: {
                            id: true,
                            title: true,
                            host: {
                                select: {
                                    id: true,
                                    userId: true,
                                    user: {
                                        select: {
                                            id: true,
                                            fullName: true,
                                            email: true,
                                            language: true,
                                        },
                                    },
                                },
                            },
                        },
                    });

                    if (!updatedEvent.host)
                        throw new NotFoundException('Host not found');

                    await tx.payout.create({
                        data: {
                            actorType: 'HOST',
                            actorId: updatedEvent.host.userId,
                            stripeTransferId: transfer.id,
                            amount: totalAmountOre / 100,
                            status: 'COMPLETED',
                            processedAt: new Date(),
                        },
                    });

                    this.emailsService
                        .sendHostEventPayoutEmail(
                            {
                                id: updatedEvent.host.userId,
                                fullName: updatedEvent.host.user.fullName,
                                email: updatedEvent.host.user.email,
                                language: updatedEvent.host.user.language,
                            },
                            {
                                eventId: event.id,
                                eventTitle: updatedEvent.title,
                                amount: `${totalAmountOre / 100} NOK`,
                                payoutDate: new Date().toLocaleDateString(
                                    'en-GB',
                                ),
                            },
                        )
                        .catch((err) =>
                            this.logger.error('Host payout email failed', err),
                        );

                    await this.financialsService.recordLedgerEntry({
                        reference: `PAY-${event.id}`,
                        description: `Host payout`,
                        type: FinancialType.PAYOUT,
                        amount: -Number(totalAmountOre / 100),
                        actorType: FinancialActor.HOST,
                        actorId: event.host.userId,
                    });
                });
            } catch (error) {
                this.logger.error(`Failed payout for event ${event.id}`, error);
            }
        }
    }

    @Cron(CronExpression.EVERY_MINUTE)
    async reconcileStripePayments() {
        this.logger.log('Running Stripe reconciliation');

        const incompleteTickets = await this.db.ticket.findMany({
            where: {
                paymentStatus: TicketPaymentStatus.INITIATED,
                stripePaymentIntentId: { not: null },
            },
        });

        for (const ticket of incompleteTickets) {
            const paymentIntent = await this.stripe
                .getClient()
                .paymentIntents.retrieve(ticket.stripePaymentIntentId!);

            if (paymentIntent.status === 'succeeded') {
                await this.db.ticket.update({
                    where: { id: ticket.id },
                    data: {
                        paymentStatus: TicketPaymentStatus.COMPLETED,
                        status: TicketStatus.PURCHASED,
                    },
                });
            }
        }
    }

    async triggerReleaseVendorPayouts() {
        return this.releaseVendorPayouts();
    }

    async decrement(eventId: string, tx?: Prisma.TransactionClient) {
        const client = tx || this.db;

        const result = await client.event.updateMany({
            where: {
                id: eventId,
                ticketsSold: { gt: 0 },
            },
            data: {
                ticketsSold: { decrement: 1 },
            },
        });

        if (result.count === 0) {
            this.logger.error(`Failed to decrease the value of tickets sold`);
        }
    }
}
