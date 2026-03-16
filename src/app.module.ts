import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bullmq';

import { DatabaseModule } from './database';
import { AuthModule } from './auth';
import { CommonModule } from './common';
import { UsersModule } from './users';
import { EventsModule } from './events';
import { TicketsModule } from './tickets';
import { SpacesModule } from './spaces/spaces.module';
import { SpaceBookingCronService } from './spaces/services';
import { AdminModule } from './admin';
import { NotificationsModule } from './notifications';
import { EmailsModule } from './emails';
import { FinancialsModule } from './financials';

import { AppController } from './app.controller';
import { EventCronService } from './events/services';
import { PaymentsModule } from './payments/payments.module';
import { PaymentsCronService } from './payments/services';

import * as dotenv from 'dotenv';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
dotenv.config();

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        ScheduleModule.forRoot(),
        BullModule.forRoot({
            connection: {
                host: process.env.REDIS_HOST || 'redis',
                port: Number(process.env.REDIS_PORT) || 6379,
            },
        }),
        ThrottlerModule.forRootAsync({
            useFactory: () => {
                const redis = {
                    host: process.env.REDIS_HOST || 'redis',
                    port: Number(process.env.REDIS_PORT) || 6379,
                };

                return {
                    throttlers: [
                        { name: 'short', ttl: 1000, limit: 100 },
                        { name: 'medium', ttl: 10000, limit: 500 },
                        { name: 'long', ttl: 60000, limit: 2000 },
                    ],
                    storage: new ThrottlerStorageRedisService(redis),
                };
            },
        }),

        DatabaseModule,
        AuthModule,
        CommonModule,
        UsersModule,
        EventsModule,
        TicketsModule,
        SpacesModule,
        AdminModule,
        NotificationsModule,
        PaymentsModule,
        EmailsModule,
        FinancialsModule,
    ],
    controllers: [AppController],
    providers: [
        SpaceBookingCronService,
        EventCronService,
        PaymentsCronService,
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
        },
    ],
})
export class AppModule {}
