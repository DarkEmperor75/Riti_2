import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventStatus, NotificationType } from '@prisma/client';
import { TimezoneService } from 'src/common/services';
import { DatabaseService } from 'src/database/database.service';
import { EmailsService } from 'src/emails/services';
import { NotificationsService } from 'src/notifications/services';

@Injectable()
export class EventCronService {
    private readonly logger = new Logger(EventCronService.name);

    constructor(
        private readonly db: DatabaseService,
        private notificationsService: NotificationsService,
        private emailsService: EmailsService,
        private tzService: TimezoneService,
    ) {}

    @Cron(CronExpression.EVERY_3_HOURS)
    async sendEventReminders() {
        this.logger.log('Sending event reminders');
        const now = new Date();
        const next24Hours = new Date(Date.now() + 24 * 60 * 60 * 1000);
        const events = await this.db.$transaction(async (tx) => {
            const eventsToSend = await tx.event.findMany({
                where: {
                    startTime: {
                        gte: now,
                        lte: next24Hours,
                    },
                    reminderSent: false,
                },
                select: {
                    id: true,
                    title: true,
                    startTime: true,
                    booking: {
                        select: {
                            space: {
                                select: {
                                    address: true,
                                    timezone: true,
                                    city: true,
                                },
                            },
                        },
                    },
                    attendees: {
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

            await tx.event.updateMany({
                where: { id: { in: eventsToSend.map((e) => e.id) } },
                data: { reminderSent: true },
            });

            return eventsToSend;
        });

        const jobs: Array<{
            userId: string;
            type: NotificationType;
            title: string;
            message: string;
            meta?: Record<string, any>;
        }> = [];

        for (const event of events) {
            for (const attendee of event.attendees) {
                const formattedDate = this.tzService.toLocalDisplay(
                    event.startTime!,
                    event?.booking?.space.timezone!,
                    'HH:mm',
                );
                jobs.push({
                    userId: attendee.userId,
                    type: NotificationType.EVENT_REMINDER,
                    title: 'Upcoming Event',
                    message: `You have an upcoming event: ${event.title}. It starts on ${formattedDate}`,
                    meta: {
                        eventId: event.id,
                        startTime: this.tzService.toLocalDisplay(
                            event.startTime!,
                            event?.booking?.space.timezone!,
                        ),
                    },
                });

                this.emailsService
                    .sendEventReminderEmail(
                        {
                            id: attendee.userId,
                            fullName: attendee.user.fullName,
                            email: attendee.user.email,
                            language: attendee.user.language,
                        },
                        {
                            id: event.id,
                            title: event.title,
                            startTime: this.tzService.toLocalDisplay(
                                event.startTime!,
                                event?.booking?.space.timezone!,
                            ),
                            location: event.booking!.space.address ?? 'TBD',
                        },
                    )
                    .catch((err) =>
                        this.logger.error(
                            `Event reminder email failed for user ${attendee.userId}`,
                            err,
                        ),
                    );
            }
        }

        if (jobs.length > 0) {
            await this.notificationsService.queueBulkNotifications(jobs);
            this.logger.log(`Queued ${jobs.length} reminder notifications`);
        }
    }

    @Cron(CronExpression.EVERY_10_MINUTES)
    async completeEventsAfterEndTime() {
        await this.db.event.updateMany({
            where: {
                status: EventStatus.PUBLISHED,
                endTime: { lt: new Date() },
            },
            data: {
                status: EventStatus.COMPLETED,
            },
        });
    }

    async triggerSendEventReminders() {
        await this.sendEventReminders();
    }
}
