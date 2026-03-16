import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { IS_PUBLIC_KEY } from 'src/auth/decorators';
import { UserForTokenDto } from 'src/auth/interfaces';

@Injectable()
export class VendorProfileGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) {}

    canActivate(
        context: ExecutionContext,
    ): boolean | Promise<boolean> | Observable<boolean> {
        const isPublic = this.reflector.getAllAndOverride<boolean>(
            IS_PUBLIC_KEY,
            [context.getHandler(), context.getClass()],
        );

        if (isPublic) return true;

        const request = context.switchToHttp().getRequest();
        const user: UserForTokenDto = request.user;
        if (!user.hasVendorProfile)
            throw new ForbiddenException(
                'Only Vendors have access to access this endpoint',
            );
        const canActivate: boolean = user.userType === 'VENDOR';

        if (!canActivate)
            throw new ForbiddenException(
                'Switch to Vendor Mode to access this endpoint',
            );
        return true;
    }
}
