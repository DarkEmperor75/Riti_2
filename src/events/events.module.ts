import { Module } from '@nestjs/common';
import { EventsService } from './services';
import { EventsController } from './controllers';
import { UsersModule } from 'src/users';
import { EventCronService } from './services/event.cron.service';
import { TicketsModule } from 'src/tickets';
import { TicketPricingService } from 'src/tickets/services';
import { StripeServiece } from 'src/payments/services';
import { BullModule } from '@nestjs/bullmq';

@Module({
    imports: [
        UsersModule,
        TicketsModule,
        BullModule.registerQueue({
            name: 'refunds',
        }),
    ],
    controllers: [EventsController],
    providers: [
        EventsService,
        EventCronService,
        TicketPricingService,
        StripeServiece,
    ],
    exports: [EventCronService],
})
export class EventsModule {}
