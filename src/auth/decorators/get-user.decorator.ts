import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserForTokenDto } from '../interfaces';

export const GetUser = createParamDecorator(
    (data: string | undefined, ctx: ExecutionContext): UserForTokenDto => {
        const request = ctx.switchToHttp().getRequest();
        const user = request.user;
        return data ? user?.[data] : user;
    },
);
