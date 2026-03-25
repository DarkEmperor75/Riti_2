import {
    BadGatewayException,
    BadRequestException,
    ForbiddenException,
    Injectable,
    InternalServerErrorException,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import Stripe from 'stripe';
import { StripeServiece } from './stripe.service';
import { PaymentsBookingsEntity } from '../entities';
import {
    FinancialActor,
    FinancialType,
    Host,
    Prisma,
    TicketPaymentStatus,
    TicketStatus,
    User,
    Vendor,
} from '@prisma/client';
import { EmailsService } from 'src/emails/services';
import { FinancialsService } from 'src/financials/services';

export enum StripeActorType {
    VENDOR = 'VENDOR',
    HOST = 'HOST',
}

@Injectable()
export class PaymentsService {
    private readonly logger = new Logger(PaymentsService.name);

    constructor(
        private db: DatabaseService,
        private stripe: StripeServiece,
        private emailsService: EmailsService,
        private financialsService: FinancialsService,
    ) {}

    async connectStripeAccount(
        userId: string,
        actorType: StripeActorType,
    ): Promise<{ onboardingUrl: string }> {
        const stripe = this.stripe.getClient();

        let actor: (Vendor & { user: User }) | (Host & { user: User }) | null =
            null;

        if (actorType === StripeActorType.VENDOR) {
            actor = await this.db.vendor.findUnique({
                where: { userId },
                include: { user: true },
            });

            if (!actor) throw new NotFoundException('Vendor profile not found');
            if (actor.vendorStatus === 'SUSPENDED')
                throw new ForbiddenException('Vendor suspended');
        }

        if (actorType === StripeActorType.HOST) {
            actor = await this.db.host.findUnique({
                where: { userId },
                include: { user: true },
            });

            if (!actor) throw new NotFoundException('Host profile not found');
            if (actor.hostingStatus === 'SUSPENDED')
                throw new ForbiddenException('Host suspended');
        }

        if (!actor)
            throw new InternalServerErrorException(
                'Stripe actor resolution failed',
            );

        if (!actor.user.country)
            throw new BadRequestException(
                'You need to specify your country in your profile before you connect your stripe account!',
            );

        const platformUrl = process.env.RITI_DOMAIN_NAME?.startsWith('https://')
            ? process.env.RITI_DOMAIN_NAME
            : 'www.riti.no';

        let account: Stripe.Account;

        if (!actor.stripeAccountId) {
            account = await stripe.accounts.create({
                type: 'express',
                country: actor.user.country,
                email: actor.user.email,
                business_type: 'individual',
                capabilities: {
                    card_payments: { requested: true },
                    transfers: { requested: true },
                },
                business_profile: {
                    mcc: '7999',
                    url: platformUrl,
                },
            });

            const updateData = {
                stripeAccountId: account.id,
                stripeAccountCountry: actor.user.country,
                stripeAccountCreatedAt: new Date(),
            };

            if (actorType === StripeActorType.VENDOR) {
                await this.db.vendor.update({
                    where: { id: actor.id },
                    data: updateData,
                });
            } else {
                await this.db.host.update({
                    where: { id: actor.id },
                    data: updateData,
                });
            }
        } else {
            account = await stripe.accounts.retrieve(actor.stripeAccountId);
        }

        const stripeSyncData = {
            stripeChargesEnabled: account.charges_enabled,
            stripePayoutsEnabled: account.payouts_enabled,
            stripeDetailsSubmitted: account.details_submitted,
            stripeDisabledReason: account.requirements?.disabled_reason ?? null,
        };

        if (actorType === StripeActorType.VENDOR) {
            await this.db.vendor.update({
                where: { id: actor.id },
                data: stripeSyncData,
            });
        } else {
            await this.db.host.update({
                where: { id: actor.id },
                data: stripeSyncData,
            });
        }

        const basePath =
            actorType === StripeActorType.VENDOR ? 'vendor' : 'host';

        const accountLink = await stripe.accountLinks.create({
            account: account.id,
            refresh_url: `${process.env.FRONTEND_URL}/${basePath}/stripe/refresh`,
            return_url: `${process.env.FRONTEND_URL}/${basePath}/stripe/return`,
            type: 'account_onboarding',
        });

        return {
            onboardingUrl: accountLink.url,
        };
    }

    async handleStripeWebhook(event: Stripe.Event): Promise<void> {
        try {
            this.logger.debug(`Stripe event received: ${event.type}`);

            if (event.type.startsWith('v2.core.account')) {
                return this.handleConnectAccountEvent(event);
            }

            if (event.type === 'checkout.session.completed') {
                const session = event.data.object as Stripe.Checkout.Session;
                this.logger.debug(
                    'Checkout session completed',
                    JSON.stringify(session),
                );
                if (session.metadata?.ticketId) {
                    return this.handleTicketCheckoutCompleted(session);
                }

                if (session.metadata?.bookingId) {
                    return this.handleBookingCheckoutSessionCompleted(session);
                }
            }

            return;
        } catch (error) {
            this.logger.error('Error handling Stripe webhook', error);
        }
    }

    async payForSpaceBooking(
        userId: string,
        bookingId: string,
    ): Promise<{ url: string }> {
        const booking = await this.db.booking.findUnique({
            where: { id: bookingId },
            select: {
                id: true,
                renterId: true,
                status: true,
                expiryTime: true,
                stripePaymentIntentId: true,
                totalPrice: true,
                space: {
                    select: {
                        name: true,
                        vendor: {
                            select: {
                                id: true,
                                stripeAccountId: true,
                                stripePayoutsEnabled: true,
                                stripeChargesEnabled: true,
                            },
                        },
                    },
                },
            },
        });

        if (!booking) throw new NotFoundException('Booking not found');

        PaymentsBookingsEntity.validateSpaceBookingPayment(booking, userId);

        const { totalAmountOre, applicationFeeAmount, vendorPayoutAmount } =
            PaymentsBookingsEntity.extractSpaceBookingPaymentCalculation(
                booking,
            );

        const session = await this.stripe
            .getClient()
            .checkout.sessions.create({
                mode: 'payment',
                metadata: {
                    bookingId: booking.id,
                    vendorId: booking.space.vendor.id,
                    renterId: booking.renterId,
                },
                line_items: [
                    {
                        price_data: {
                            currency: 'nok',
                            product_data: {
                                name: `Space Booking - ${booking.space.name}`,
                            },
                            unit_amount: totalAmountOre,
                        },
                        quantity: 1,
                    },
                ],
                payment_intent_data: {
                    metadata: {
                        bookingId: booking.id,
                        vendorId: booking.space.vendor.id,
                        renterId: booking.renterId,
                    },
                },
                success_url: `${process.env.FRONTEND_URL}/bookings/${booking.id}?status=success`,
                cancel_url: `${process.env.FRONTEND_URL}/bookings/${booking.id}?status=cancel`,
            })
            .catch((error: any) => {
                throw new BadGatewayException(
                    `Error Processing request due to: ${error.message}`,
                );
            });

        if (!session.url)
            throw new InternalServerErrorException(
                'Failed to create Stripe checkout session',
            );

        await this.db.booking.update({
            where: { id: booking.id },
            data: {
                stripeCheckoutSessionId: session.id,
                stripePaymentStatus: 'INITIATED',
                applicationFeeAmount,
                vendorPayoutAmount,
            },
        });

        return { url: session.url };
    }

    async refundStripePayment(
        stripePaymentIntentId: string,
        bookingId: string,
    ): Promise<string> {
        try {
            const refund = await this.stripe.getClient().refunds.create({
                payment_intent: stripePaymentIntentId,
                metadata: {
                    bookingId,
                },
            });

            if (!refund.id)
                throw new InternalServerErrorException(
                    'Failed to refund Stripe payment',
                );

            return refund.id;
        } catch (error) {
            this.logger.error('Error refunding Stripe payment', error);
            throw new BadGatewayException('Failed to refund Stripe payment');
        }
    }

    async vendorStripeDetails(userId: string) {
        return this.db.$transaction(async (tx) => {
            const vendor = await tx.vendor.findUnique({
                where: { userId },
                select: {
                    id: true,
                    stripeAccountId: true,
                    stripeOnboardingCompletedAt: true,
                    stripeDisabledReason: true,
                    stripeDetailsSubmitted: true,
                    stripePayoutsEnabled: true,
                    stripeChargesEnabled: true,
                },
            });

            if (!vendor) throw new NotFoundException('Vendor not found');

            let stripeOnboardingCompletedAt =
                vendor.stripeOnboardingCompletedAt;

            if (
                vendor.stripeChargesEnabled &&
                vendor.stripePayoutsEnabled &&
                !vendor.stripeOnboardingCompletedAt
            ) {
                await tx.vendor.update({
                    where: { id: vendor.id },
                    data: {
                        stripeOnboardingCompletedAt: new Date(),
                    },
                    select: {
                        stripeOnboardingCompletedAt: true,
                    },
                });

                stripeOnboardingCompletedAt = new Date();
            }

            return {
                stripeAccountId: vendor.stripeAccountId,
                stripeOnboardingCompletedAt: stripeOnboardingCompletedAt,
                stripeDisabledReason: vendor.stripeDisabledReason,
                stripeDetailsSubmitted: vendor.stripeDetailsSubmitted,
                stripePayoutsEnabled: vendor.stripePayoutsEnabled,
                stripeChargesEnabled: vendor.stripeChargesEnabled,
            };
        });
    }

    async hostStripeDetails(userId: string) {
        return this.db.$transaction(async (tx) => {
            const host = await tx.host.findUnique({
                where: { userId },
                select: {
                    id: true,
                    stripeAccountId: true,
                    stripeOnboardingCompletedAt: true,
                    stripeDisabledReason: true,
                    stripeDetailsSubmitted: true,
                    stripePayoutsEnabled: true,
                    stripeChargesEnabled: true,
                },
            });

            if (!host) throw new NotFoundException('Host not found');

            let stripeOnboardingCompletedAt = host.stripeOnboardingCompletedAt;

            if (
                host.stripeChargesEnabled &&
                host.stripePayoutsEnabled &&
                !host.stripeOnboardingCompletedAt
            ) {
                await tx.host.update({
                    where: { id: host.id },
                    data: {
                        stripeOnboardingCompletedAt: new Date(),
                    },
                    select: {
                        stripeOnboardingCompletedAt: true,
                    },
                });

                stripeOnboardingCompletedAt = new Date();
            }

            return {
                stripeAccountId: host.stripeAccountId,
                stripeOnboardingCompletedAt: stripeOnboardingCompletedAt,
                stripeDisabledReason: host.stripeDisabledReason,
                stripeDetailsSubmitted: host.stripeDetailsSubmitted,
                stripePayoutsEnabled: host.stripePayoutsEnabled,
                stripeChargesEnabled: host.stripeChargesEnabled,
            };
        });
    }

    async refundTicketById(ticketId: string) {
        const ticket = await this.db.ticket.findUnique({
            where: { id: ticketId },
            include: {
                event: {
                    select: {
                        id: true,
                        title: true,
                        startTime: true,
                    },
                },
            },
        });

        if (!ticket) {
            this.logger.error(`Ticket ${ticketId} not found`);
            return;
        }

        return this.refundTicket(ticket);
    }

    async refundTicket(
        ticket: Prisma.TicketGetPayload<{
            include: {
                event: {
                    select: {
                        id: true;
                        title: true;
                        startTime: true;
                    };
                };
            };
        }>,
    ) {
        if (!ticket.stripePaymentIntentId)
            throw new BadRequestException('Missing Stripe payment reference');

        if (!ticket.stripeTransferId) {
            await this.stripe.getClient().refunds.create({
                payment_intent: ticket.stripePaymentIntentId,
                metadata: {
                    ticketId: ticket.id,
                    eventId: ticket.eventId,
                },
            });
        } else {
            return;
        }

        this.logger.debug(`Fetching the refunded ticket: ${ticket.id}`);

        const refundedTicket = await this.db.ticket.findUnique({
            where: { id: ticket.id },
            select: {
                id: true,
                pricePaid: true,
                attendee: {
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
        });

        this.logger.debug(
            `found the ticket with ticketId: ${refundedTicket?.id}`,
        );

        if (!refundedTicket) {
            this.logger.error(`failed to find the ticket!`);
            return;
        }

        this.emailsService
            .sendEventRefundConfirmationEmail(
                {
                    id: refundedTicket.attendee.userId,
                    fullName: refundedTicket.attendee.user.fullName,
                    email: refundedTicket.attendee.user.email,
                    language: refundedTicket.attendee.user.language,
                },
                {
                    bookingId: ticket.id,
                    amount: `${ticket.pricePaid} NOK`,
                    refundDate: new Date().toLocaleDateString('en-GB'),
                },
            )
            .catch((err) =>
                this.logger.error('Refund confirmation email failed', err),
            );
    }

    private async handleConnectAccountEvent(event: Stripe.Event) {
        const accountId =
            (event as any).related_object?.id ??
            (event.data?.object as any)?.id;

        if (!accountId) return;

        const account = await this.stripe
            .getClient()
            .accounts.retrieve(accountId);

        if (
            account.settings?.payouts?.schedule?.interval !== 'manual' &&
            account.payouts_enabled &&
            account.charges_enabled
        ) {
            await this.stripe.getClient().accounts.update(account.id, {
                settings: {
                    payouts: {
                        schedule: {
                            interval: 'manual',
                        },
                    },
                },
            });
        }

        await this.db.$transaction(async (tx) => {
            const vendor = await tx.vendor.findUnique({
                where: { stripeAccountId: account.id },
                select: {
                    id: true,
                    stripeOnboardingCompletedAt: true,
                    stripePayoutsEnabled: true,
                    stripeChargesEnabled: true,
                },
            });

            const host = await tx.host.findUnique({
                where: { stripeAccountId: account.id },
                select: {
                    id: true,
                    stripeOnboardingCompletedAt: true,
                    stripePayoutsEnabled: true,
                    stripeChargesEnabled: true,
                },
            });

            const isFullyEnabled =
                account.charges_enabled && account.payouts_enabled;

            this.logger.log(
                `Updating Stripe account with Account ID: ${account.id}, isFullyEnabled: ${isFullyEnabled}`,
            );

            const stripeData = {
                stripeChargesEnabled: account.charges_enabled,
                stripePayoutsEnabled: account.payouts_enabled,
                stripeDetailsSubmitted: account.details_submitted,
                stripeDisabledReason:
                    account.requirements?.disabled_reason ?? null,
            };

            if (vendor) {
                this.logger.log(`Updating vendor with Vendor ID: ${vendor.id}`);
                await tx.vendor.update({
                    where: { id: vendor.id },
                    data: {
                        ...stripeData,
                        stripeOnboardingCompletedAt:
                            isFullyEnabled &&
                            !vendor.stripeOnboardingCompletedAt
                                ? new Date()
                                : vendor.stripeOnboardingCompletedAt,
                    },
                });
                return;
            }

            if (host) {
                this.logger.log(`Updating host with Host ID: ${host.id}`);
                await tx.host.update({
                    where: { id: host.id },
                    data: {
                        ...stripeData,
                        stripeOnboardingCompletedAt:
                            isFullyEnabled && !host.stripeOnboardingCompletedAt
                                ? new Date()
                                : host.stripeOnboardingCompletedAt,
                    },
                });
                return;
            }
        });
    }

    private async handleBookingCheckoutSessionCompleted(
        session: Stripe.Checkout.Session,
    ): Promise<void> {
        if (!session.id) return;

        const fullSession = await this.stripe
            .getClient()
            .checkout.sessions.retrieve(session.id, {
                expand: ['payment_intent.latest_charge'],
            });

        const paymentIntent =
            fullSession.payment_intent as Stripe.PaymentIntent;

        if (!paymentIntent) {
            this.logger.error('PaymentIntent missing from session');
            return;
        }

        const charge = paymentIntent.latest_charge as Stripe.Charge | null;

        if (!charge) {
            this.logger.error('Charge missing from payment intent');
            return;
        }

        const updatedBooking = await this.db.$transaction(async (tx) => {
            const booking = await tx.booking.findUnique({
                where: { stripeCheckoutSessionId: session.id },
                select: { id: true, status: true },
            });

            if (!booking) {
                this.logger.error(`No booking found for session ${session.id}`);
                return;
            }

            if (paymentIntent.metadata.bookingId !== booking.id) {
                this.logger.error(
                    `Booking id mismatch: ${paymentIntent.metadata.bookingId} !== ${booking.id}`,
                );
                return;
            }

            if (booking.status === 'PAID') return;

            const updatedBooking = await tx.booking.update({
                where: { id: booking.id },
                data: {
                    status: 'PAID',
                    stripePaymentIntentId: paymentIntent.id,
                    stripeChargeId: charge.id,
                    stripePaymentStatus: 'COMPLETED',
                },
                select: {
                    id: true,
                    totalPrice: true,
                    applicationFeeAmount: true,
                    space: {
                        select: {
                            name: true,
                            vendor: {
                                select: {
                                    userId: true,
                                },
                            },
                        },
                    },
                },
            });

            return updatedBooking;
        });

        if (!updatedBooking) {
            this.logger.error('Updated booking missing from transaction');
            return;
        }

        await this.financialsService.recordLedgerEntry({
            reference: `BK-${updatedBooking.id}`,
            description: `Space booking - ${updatedBooking.space.name}`,
            type: FinancialType.BOOKING_PAYMENT,
            amount: Number(updatedBooking.totalPrice),
            actorType: FinancialActor.VENDOR,
            actorId: updatedBooking.space.vendor.userId,
            bookingId: updatedBooking.id,
        });

        await this.financialsService.recordLedgerEntry({
            reference: `FEE-${updatedBooking.id}`,
            description: `Platform commission`,
            type: FinancialType.PLATFORM_FEE,
            amount: Number(updatedBooking.applicationFeeAmount),
        });

        this.logger.log(`Updated booking: ${updatedBooking.id}`);
    }

    private async handleTicketCheckoutCompleted(
        session: Stripe.Checkout.Session,
    ): Promise<void> {
        if (!session.id) return;

        const fullSession = await this.stripe
            .getClient()
            .checkout.sessions.retrieve(session.id, {
                expand: ['payment_intent.latest_charge'],
            });

        const paymentIntent =
            fullSession.payment_intent as Stripe.PaymentIntent;

        if (!paymentIntent) return;

        const charge = paymentIntent.latest_charge as Stripe.Charge | null;
        if (!charge) return;

        const ticketId = paymentIntent.metadata.ticketId;
        if (!ticketId) return;

        const ticket = await this.db.$transaction(async (tx) => {
            const ticket = await tx.ticket.findUnique({
                where: { id: ticketId },
                select: {
                    id: true,
                    status: true,
                    paymentStatus: true,
                    eventId: true,
                },
            });

            if (!ticket) return;

            if (ticket.paymentStatus === TicketPaymentStatus.COMPLETED) {
                return;
            }

            if (ticket.status !== TicketStatus.IN_PROGRESS) {
                return;
            }

            return await tx.ticket.update({
                where: { id: ticket.id },
                data: {
                    status: TicketStatus.PURCHASED,
                    paymentStatus: TicketPaymentStatus.COMPLETED,
                    stripePaymentIntentId: paymentIntent.id,
                    stripeChargeId: charge.id,
                    paymentExpiresAt: null,
                },
                select: {
                    id: true,
                    pricePaid: true,
                    attendee: {
                        select: {
                            userId: true,
                        },
                    },
                },
            });
        });

        if (!ticket) {
            this.logger.error('Ticket missing from transaction');
            return;
        }

        await this.financialsService.recordLedgerEntry({
            reference: `TKT-${ticket.id}`,
            description: 'Event ticket purchase',
            type: FinancialType.TICKET_PAYMENT,
            amount: Number(ticket.pricePaid),
            actorType: FinancialActor.ATTENDEE,
            actorId: ticket.attendee.userId,
        });
    }
}
