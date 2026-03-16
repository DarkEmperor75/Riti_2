import { Module } from '@nestjs/common';
import { UsersController } from './controllers';
import { UsersService } from './services';
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
    ],
    exports: [
        UsersService,
        AttendeeProfileGuard,
        HostProfileGuard,
        VendorProfileGuard,
        AdminProfileGuard
    ],
})
export class UsersModule {}
