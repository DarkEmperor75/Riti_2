import { Module } from '@nestjs/common';
import {
    TicketsInventoryService,
    TicketPricingService,
    TicketsService,
} from './services';
import { TicketsController } from './controllers';
import { UsersModule } from 'src/users';
import { PaymentsModule } from 'src/payments';
import { BullModule } from '@nestjs/bullmq';
import { RefundProcessor } from './processors';
import { FinancialsModule } from 'src/financials';

@Module({
    imports: [
        BullModule.registerQueue({
            name: 'refunds',
        }),
        UsersModule,
        PaymentsModule,
        FinancialsModule,
    ],
    controllers: [TicketsController],
    providers: [
        TicketsService,
        TicketPricingService,
        RefundProcessor,
        TicketsInventoryService,
    ],
    exports: [TicketsInventoryService],
})
export class TicketsModule {}
