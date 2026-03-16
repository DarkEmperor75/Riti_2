import { Global, Module } from '@nestjs/common';
import { NotificationsService } from './services';
import { NotificationsController } from './controllers';
import { BullModule } from '@nestjs/bullmq';
import { NotificationsProcessor } from './processors';
import Redis from 'ioredis';

@Global()
@Module({
    imports: [
        BullModule.registerQueue({
            name: 'notifications',
            defaultJobOptions: {
                removeOnComplete: { count: 500 },
                removeOnFail: { count: 2000 },
            },
        }),
    ],
    controllers: [NotificationsController],
    providers: [
        NotificationsService,
        NotificationsProcessor,
        {
            provide: 'REDIS_CLIENT',
            useFactory: () =>
                new Redis({
                    host: process.env.REDIS_HOST || 'localhost',
                    port: parseInt(process.env.REDIS_PORT || '6379'),
                }),
        },
    ],
    exports: [NotificationsService],
})
export class NotificationsModule {}
