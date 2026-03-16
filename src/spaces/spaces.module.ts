import { Module } from '@nestjs/common';
import {
    SpacesService,
    SpaceBookingsService,
    SpaceBookingCronService,
} from './services';
import { SpacesController, SpaceBookingsController } from './controllers';
import { UsersModule } from 'src/users';
import { PaymentsModule } from 'src/payments';
import { FinancialsModule } from 'src/financials';

@Module({
    imports: [UsersModule, PaymentsModule, FinancialsModule],
    controllers: [SpacesController, SpaceBookingsController],
    providers: [SpacesService, SpaceBookingsService, SpaceBookingCronService],
})
export class SpacesModule {}
