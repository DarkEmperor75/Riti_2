import { Module } from '@nestjs/common';
import { TicketPricingService, TicketsService } from './services';
import { TicketsController } from './controllers';
import { UsersModule } from 'src/users';
import { PaymentsModule } from 'src/payments';
import { BullModule } from '@nestjs/bullmq';
import { RefundProcessor } from './processors';

@Module({
    imports: [
        BullModule.registerQueue({
            name: 'refunds',
        }),
        UsersModule,
        PaymentsModule,
    ],
    controllers: [TicketsController],
    providers: [TicketsService, TicketPricingService, RefundProcessor],
})
export class TicketsModule {}
