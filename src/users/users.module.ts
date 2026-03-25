import { Module } from '@nestjs/common';
import { UsersController } from './controllers';
import { UsersCronService, UsersService } from './services';
import {
    AdminProfileGuard,
    AttendeeProfileGuard,
    HostProfileGuard,
    VendorProfileGuard,
} from './guards';

@Module({
    controllers: [UsersController],
    providers: [
        UsersService,
        AttendeeProfileGuard,
        HostProfileGuard,
        VendorProfileGuard,
        AdminProfileGuard,
        UsersCronService,
    ],
    exports: [
        UsersService,
        AttendeeProfileGuard,
        HostProfileGuard,
        VendorProfileGuard,
        AdminProfileGuard,
    ],
})
export class UsersModule {}
