import { Module } from '@nestjs/common';
import { AdminService } from './services';
import { AdminController } from './controllers';
import { FinancialsModule } from 'src/financials';
import { TicketsModule } from 'src/tickets';
import { TicketPricingService } from 'src/tickets/services';
import { BullModule } from '@nestjs/bullmq';
import { StripeServiece } from 'src/payments/services';

@Module({
    imports: [
        FinancialsModule,
        TicketsModule,
        BullModule.registerQueue({
            name: 'refunds',
        }),
    ],
    controllers: [AdminController],
    providers: [AdminService, TicketPricingService, StripeServiece],
})
export class AdminModule {}
