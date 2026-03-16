import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
    Logger,
    Scope,
    UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators';
import { UserStatus } from '@prisma/client';

@Injectable({ scope: Scope.REQUEST })
export class SuspentionGuard implements CanActivate {
    private readonly logger = new Logger(SuspentionGuard.name);
    constructor(private readonly reflector: Reflector) {}
    canActivate(context: ExecutionContext): boolean {
        const isPublic = this.reflector.getAllAndOverride<boolean>(
            IS_PUBLIC_KEY,
            [context.getHandler(), context.getClass()],
        );
        if (isPublic) return true;
        const req = context.switchToHttp().getRequest();
        const user = req.user;

        if (!user) {
            this.logger.error('No authenticated user', user);
            throw new UnauthorizedException('No authenticated user');
        }

        if (user.status === UserStatus.SUSPENDED) {
            throw new ForbiddenException('User account is suspended');
        }
        const isSuspended = user.status === UserStatus.SUSPENDED;
        return !isSuspended;
    }
}
