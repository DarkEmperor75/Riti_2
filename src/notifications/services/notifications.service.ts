import {
    HttpException,
    Injectable,
    InternalServerErrorException,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { DatabaseService } from 'src/database/database.service';
import { NotificationResponseDto, NotificationsListQueryDto } from '../dto';
import { plainToInstance } from 'class-transformer';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class NotificationsService {
    private readonly logger = new Logger(NotificationsService.name);
    constructor(
        private db: DatabaseService,
        @InjectQueue('notifications') private notificationsQueue: Queue,
    ) {}

    async queueNotification(data: {
        userId: string;
        type: NotificationType;
        title: string;
        message: string;
        meta?: Record<string, any>;
    }) {
        await this.notificationsQueue.add('create-notification', data, {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 2000,
            },
            removeOnComplete: true,
            removeOnFail: false,
        });
    }

    async queueBulkNotifications(
        jobs: Array<{
            userId: string;
            type: NotificationType;
            title: string;
            message: string;
            meta?: Record<string, any>;
        }>,
    ): Promise<void> {
        try {
            await this.notificationsQueue.addBulk(
                jobs.map((job) => ({
                    name: 'create-notification',
                    data: job,
                    opts: {
                        attempts: 3,
                        backoff: {
                            type: 'exponential',
                            delay: 2000,
                        },
                        removeOnComplete: true,
                    },
                })),
            );
        } catch (error) {
            this.logger.error('Error queueing notifications', error);
        }
    }

    async create(
        userId: string,
        type: NotificationType,
        title: string,
        message: string,
        meta?: Record<string, any>,
    ): Promise<NotificationResponseDto> {
        try {
            const notification = await this.db.notification.create({
                data: {
                    userId,
                    type,
                    title,
                    message,
                    ...(meta !== undefined && { meta }),
                },
                select: {
                    id: true,
                    type: true,
                    title: true,
                    message: true,
                    read: true,
                    meta: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });

            return plainToInstance(NotificationResponseDto, notification, {
                excludeExtraneousValues: true,
            });
        } catch (error) {
            this.logger.error('Error creating notification', error);
            if (error instanceof HttpException)
                throw new Error(
                    'Error creating notification: ' + error.message,
                );
            throw new InternalServerErrorException(
                'Error creating notification',
            );
        }
    }

    async findByUser(
        userId: string,
        query: NotificationsListQueryDto,
    ): Promise<{ notifications: NotificationResponseDto[]; total: number }> {
        const { type, read, limit = 20, page = 1 } = query;
        const skip = (page - 1) * limit;

        const where: any = { userId };
        if (type) where.type = type;
        if (read !== undefined) where.read = read;

        const [notifications, total] = await Promise.all([
            this.db.notification.findMany({
                where,
                take: limit,
                skip,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    type: true,
                    title: true,
                    message: true,
                    read: true,
                    meta: true,
                    createdAt: true,
                    updatedAt: true,
                },
            }),
            this.db.notification.count({ where }),
        ]);

        return {
            notifications: plainToInstance(
                NotificationResponseDto,
                notifications,
                { excludeExtraneousValues: true },
            ),
            total,
        };
    }

    async getUnreadCount(userId: string): Promise<number> {
        return this.db.notification.count({
            where: { userId, read: false },
        });
    }

    async markAsRead(
        id: string,
        userId: string,
    ): Promise<{ id: string; read: true }> {
        const notification = await this.db.notification.updateMany({
            where: { id, userId },
            data: { read: true },
        });

        if (notification.count === 0) {
            throw new NotFoundException('Notification not found or not yours');
        }

        return { id, read: true };
    }
}
