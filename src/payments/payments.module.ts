import { Module } from '@nestjs/common';
import {
    PaymentsCronService,
    PaymentsService,
    StripeServiece,
} from './services';
import { PaymentsController } from './controllers';
import { UsersModule } from 'src/users';
import { FinancialsModule } from 'src/financials';

@Module({
    imports: [UsersModule, FinancialsModule],
    controllers: [PaymentsController],
    providers: [PaymentsService, StripeServiece, PaymentsCronService],
    exports: [PaymentsService, StripeServiece, PaymentsCronService],
})
export class PaymentsModule {}
