import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { EmailType, Language } from '@prisma/client';
import { DatabaseService } from 'src/database/database.service';
import { EMAIL_TEMPLATE_MAP } from '../templates';
import Redis from 'ioredis';

interface QueueEmailParams {
    userId: string;
    type: EmailType;
    to: string;
    language: Language;
    vars: Record<string, string>;
    metadata?: Record<string, any>;
}

const RATE_LIMITS: Partial<
    Record<EmailType, { max: number; windowSec: number }>
> = {
    [EmailType.FORGOT_PASSWORD]: { max: 20, windowSec: 60 * 60 },
    [EmailType.WELCOME]: { max: 50, windowSec: 60 * 60 },
    [EmailType.EVENT_REMINDER]: { max: 50, windowSec: 60 * 60 },
};

@Injectable()
export class EmailsService {
    private readonly logger = new Logger(EmailsService.name);

    constructor(
        private readonly db: DatabaseService,
        @InjectQueue('emails') private readonly emailsQueue: Queue,
        @Inject('REDIS_CLIENT') private readonly redis: Redis,
    ) {}

    private async checkRateLimit(
        userId: string,
        type: EmailType,
        metadata?: Record<string, any>,
    ): Promise<void> {
        const limit = RATE_LIMITS[type];
        if (!limit) return;

        const scopeKey =
            type === EmailType.EVENT_REMINDER && metadata?.eventId
                ? `${userId}:${type}:${metadata.eventId}`
                : `${userId}:${type}`;

        const key = `email_rl:${scopeKey}`;
        const current = await this.redis.incr(key);

        if (current === 1) {
            await this.redis.expire(key, limit.windowSec);
        }

        if (current > limit.max) {
            this.logger.warn(`Rate limit hit for user ${userId} type ${type}`);
            throw new Error(`Rate limit exceeded for email type ${type}`);
        }
    }

    async queueEmail(params: QueueEmailParams): Promise<void> {
        await this.checkRateLimit(params.userId, params.type, params.metadata);
        const { userId, type, to, language, vars, metadata } = params;

        const lang = language === Language.NO ? 'no' : 'en';
        const templateSet = EMAIL_TEMPLATE_MAP[type];
        const template = templateSet[lang] ?? templateSet['en'];

        const subject = this.render(template.subject, vars);
        const htmlBody = this.render(template.htmlContent, vars);
        const textBody = this.render(template.textContent, vars);

        const email = await this.db.email.create({
            data: {
                userId,
                type,
                status: 'QUEUED',
                to: [to],
                subject,
                language: lang,
                htmlBody,
                textBody,
                metadata: metadata ?? undefined,
            },
        });

        await this.emailsQueue.add(
            'send-email',
            { emailId: email.id },
            {
                attempts: 3,
                backoff: { type: 'exponential', delay: 5000 },
                removeOnComplete: true,
                removeOnFail: false,
            },
        );

        this.logger.log(`Queued email [${type}] → ${to} (${lang})`);
    }

    async sendWelcomeEmail(user: {
        id: string;
        fullName: string;
        email: string;
        language: Language;
    }) {
        await this.queueEmail({
            userId: user.id,
            type: EmailType.WELCOME,
            to: user.email,
            language: user.language,
            vars: {
                name: user.fullName,
                loginUrl: `${process.env.FRONTEND_URL}/login`,
            },
        });
    }

    async sendForgotPasswordEmail(
        user: {
            id: string;
            fullName: string;
            email: string;
            language: Language;
        },
        resetToken: string,
    ) {
        await this.queueEmail({
            userId: user.id,
            type: EmailType.FORGOT_PASSWORD,
            to: user.email,
            language: user.language,
            vars: {
                name: user.fullName,
                resetUrl: `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`,
                expiresIn: '1 hour',
            },
        });
    }

    async sendBookingConfirmationEmail(
        user: {
            id: string;
            fullName: string;
            email: string;
            language: Language;
        },
        booking: {
            id: string;
            spaceName: string;
            date: string;
            startTime: string;
            endTime: string;
            amount: string;
        },
    ) {
        await this.queueEmail({
            userId: user.id,
            type: EmailType.BOOKING_CONFIRMATION,
            to: user.email,
            language: user.language,
            vars: {
                name: user.fullName,
                spaceName: booking.spaceName,
                date: booking.date,
                startTime: booking.startTime,
                endTime: booking.endTime,
                amount: booking.amount,
                bookingId: booking.id,
                bookingUrl: `${process.env.FRONTEND_URL}/bookings/${booking.id}`,
            },
            metadata: { bookingId: booking.id },
        });
    }

    async sendBookingCancellationEmail(
        user: {
            id: string;
            fullName: string;
            email: string;
            language: Language;
        },
        booking: { id: string; spaceName: string; date: string },
    ) {
        await this.queueEmail({
            userId: user.id,
            type: EmailType.BOOKING_CANCELLATION,
            to: user.email,
            language: user.language,
            vars: {
                name: user.fullName,
                spaceName: booking.spaceName,
                date: booking.date,
                bookingId: booking.id,
            },
            metadata: { bookingId: booking.id },
        });
    }

    async sendEventReminderEmail(
        user: {
            id: string;
            fullName: string;
            email: string;
            language: Language;
        },
        event: {
            id: string;
            title: string;
            startTime: string;
            location: string;
        },
    ) {
        await this.queueEmail({
            userId: user.id,
            type: EmailType.EVENT_REMINDER,
            to: user.email,
            language: user.language,
            vars: {
                name: user.fullName,
                eventTitle: event.title,
                startTime: event.startTime,
                location: event.location,
                eventUrl: `${process.env.FRONTEND_URL}/events/${event.id}`,
            },
            metadata: { eventId: event.id },
        });
    }

    async sendEventRefundConfirmationEmail(
        user: {
            id: string;
            fullName: string;
            email: string;
            language: Language;
        },
        refund: { bookingId: string; amount: string; refundDate: string },
    ) {
        await this.queueEmail({
            userId: user.id,
            type: EmailType.EVENT_REFUND_CONFIRMATION,
            to: user.email,
            language: user.language,
            vars: {
                name: user.fullName,
                bookingId: refund.bookingId,
                amount: refund.amount,
                refundDate: refund.refundDate,
            },
            metadata: { bookingId: refund.bookingId },
        });
    }

    async sendHostNewBookingEmail(
        host: {
            id: string;
            fullName: string;
            email: string;
            language: Language;
        },
        booking: {
            id: string;
            spaceName: string;
            customerName: string;
            date: string;
            startTime: string;
            endTime: string;
            amount: string;
        },
    ) {
        await this.queueEmail({
            userId: host.id,
            type: EmailType.SPACE_BOOKING_CONFIRMED,
            to: host.email,
            language: host.language,
            vars: {
                name: host.fullName,
                spaceName: booking.spaceName,
                customerName: booking.customerName,
                date: booking.date,
                startTime: booking.startTime,
                endTime: booking.endTime,
                amount: booking.amount,
                bookingId: booking.id,
                dashboardUrl: `${process.env.FRONTEND_URL}/dashboard/bookings/${booking.id}`,
            },
            metadata: { bookingId: booking.id },
        });
    }

    async sendHostBookingCancelledEmail(
        host: {
            id: string;
            fullName: string;
            email: string;
            language: Language;
        },
        booking: {
            id: string;
            spaceName: string;
            customerName: string;
            date: string;
        },
    ) {
        await this.queueEmail({
            userId: host.id,
            type: EmailType.SPACE_BOOKING_CANCELLED,
            to: host.email,
            language: host.language,
            vars: {
                name: host.fullName,
                spaceName: booking.spaceName,
                customerName: booking.customerName,
                date: booking.date,
                bookingId: booking.id,
                dashboardUrl: `${process.env.FRONTEND_URL}/dashboard/bookings/${booking.id}`,
            },
            metadata: { bookingId: booking.id },
        });
    }

    async sendHostEventCancellationEmail(
        host: {
            id: string;
            fullName: string;
            email: string;
            language: Language;
        },
        event: { id: string; title: string; eventDate: string },
    ) {
        await this.queueEmail({
            userId: host.id,
            type: EmailType.EVENT_CANCELLATION,
            to: host.email,
            language: host.language,
            vars: {
                name: host.fullName,
                eventTitle: event.title,
                eventDate: event.eventDate,
                dashboardUrl: `${process.env.FRONTEND_URL}/dashboard/events/${event.id}`,
            },
            metadata: { eventId: event.id },
        });
    }

    async sendHostRefundProcessedEmail(
        host: {
            id: string;
            fullName: string;
            email: string;
            language: Language;
        },
        refund: {
            bookingId: string;
            customerName: string;
            amount: string;
            refundDate: string;
        },
    ) {
        await this.queueEmail({
            userId: host.id,
            type: EmailType.SPACE_REFUND_CONFIRMATION,
            to: host.email,
            language: host.language,
            vars: {
                name: host.fullName,
                bookingId: refund.bookingId,
                customerName: refund.customerName,
                amount: refund.amount,
                refundDate: refund.refundDate,
                dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`,
            },
            metadata: { bookingId: refund.bookingId },
        });
    }

    async sendHostEventPayoutEmail(
        host: {
            id: string;
            fullName: string;
            email: string;
            language: Language;
        },
        payout: {
            eventId: string;
            eventTitle: string;
            amount: string;
            payoutDate: string;
        },
    ) {
        await this.queueEmail({
            userId: host.id,
            type: EmailType.EVENT_PAYOUT,
            to: host.email,
            language: host.language,
            vars: {
                name: host.fullName,
                eventTitle: payout.eventTitle,
                amount: payout.amount,
                payoutDate: payout.payoutDate,
                dashboardUrl: `${process.env.FRONTEND_URL}/dashboard/payouts`,
            },
            metadata: { eventId: payout.eventId },
        });
    }

    async sendVendorSpaceBookingConfirmedEmail(
        vendor: {
            id: string;
            fullName: string;
            email: string;
            language: Language;
        },
        booking: {
            id: string;
            spaceName: string;
            customerName: string;
            date: string;
            startTime: string;
            endTime: string;
            amount: string;
        },
    ) {
        await this.queueEmail({
            userId: vendor.id,
            type: EmailType.SPACE_BOOKING_CONFIRMED,
            to: vendor.email,
            language: vendor.language,
            vars: {
                name: vendor.fullName,
                spaceName: booking.spaceName,
                customerName: booking.customerName,
                date: booking.date,
                startTime: booking.startTime,
                endTime: booking.endTime,
                amount: booking.amount,
                bookingId: booking.id,
                dashboardUrl: `${process.env.FRONTEND_URL}/dashboard/bookings/${booking.id}`,
            },
            metadata: { bookingId: booking.id },
        });
    }

    async sendVendorSpaceBookingCancelledEmail(
        vendor: {
            id: string;
            fullName: string;
            email: string;
            language: Language;
        },
        booking: {
            id: string;
            spaceName: string;
            customerName: string;
            date: string;
        },
    ) {
        await this.queueEmail({
            userId: vendor.id,
            type: EmailType.SPACE_BOOKING_CANCELLED,
            to: vendor.email,
            language: vendor.language,
            vars: {
                name: vendor.fullName,
                spaceName: booking.spaceName,
                customerName: booking.customerName,
                date: booking.date,
                bookingId: booking.id,
                dashboardUrl: `${process.env.FRONTEND_URL}/dashboard/bookings/${booking.id}`,
            },
            metadata: { bookingId: booking.id },
        });
    }

    async sendVendorSpacePayoutEmail(
        vendor: {
            id: string;
            fullName: string;
            email: string;
            language: Language;
        },
        payout: {
            spaceId: string;
            spaceName: string;
            amount: string;
            payoutDate: string;
        },
    ) {
        await this.queueEmail({
            userId: vendor.id,
            type: EmailType.SPACE_BOOKING_PAYOUT,
            to: vendor.email,
            language: vendor.language,
            vars: {
                name: vendor.fullName,
                spaceName: payout.spaceName,
                amount: payout.amount,
                payoutDate: payout.payoutDate,
                dashboardUrl: `${process.env.FRONTEND_URL}/dashboard/payouts`,
            },
            metadata: { spaceId: payout.spaceId },
        });
    }

    private render(template: string, vars: Record<string, string>): string {
        return template.replace(
            /\{\{\s*(\w+)\s*\}\}/g,
            (_, key) => vars[key] ?? '',
        );
    }
}
