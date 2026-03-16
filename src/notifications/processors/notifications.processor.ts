import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { NotificationsService } from '../services/notifications.service';
import { Logger } from '@nestjs/common';

@Processor('notifications')
export class NotificationsProcessor extends WorkerHost {
    private readonly logger = new Logger(NotificationsProcessor.name);

    constructor(private readonly notificationsService: NotificationsService) {
        super();
    }

    async process(job: Job<any>): Promise<any> {
        switch (job.name) {
            case 'create-notification':
                return this.handleCreateNotification(job);
            default:
                this.logger.warn(`Unknown job name: ${job.name}`);
        }
    }

    private async handleCreateNotification(job: Job) {
        const { userId, type, title, message, meta } = job.data;

        this.logger.debug(`Processing notification job for user ${userId}`);

        return this.notificationsService.create(
            userId,
            type,
            title,
            message,
            meta,
        );
    }
}
