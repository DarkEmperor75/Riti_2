import { Global, Module } from '@nestjs/common';
import { EmailsService, SendGridEmailService } from './services';
import { EmailProcessor } from './processors';
import { BullModule } from '@nestjs/bullmq';
import Redis from 'ioredis';

@Global()
@Module({
    imports: [
        BullModule.registerQueue({
            name: 'emails',
            defaultJobOptions: {
                removeOnComplete: { count: 1000 }, 
                removeOnFail: { count: 5000 }, 
            },
        }),
    ],
    providers: [
        EmailsService,
        EmailProcessor,
        SendGridEmailService,
        {
            provide: 'REDIS_CLIENT',
            useFactory: () =>
                new Redis({
                    host: process.env.REDIS_HOST || 'localhost',
                    port: parseInt(process.env.REDIS_PORT || '6379'),
                }),
        },
    ],
    exports: [EmailsService],
})
export class EmailsModule {}
