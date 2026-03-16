import {
    Injectable,
    InternalServerErrorException,
    UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../services';
import { Request } from 'express';
import { JwtRefreshPayload, RefreshTokenValidationResult } from '../interfaces';
import { UserStatus } from '@prisma/client';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
    Strategy,
    'jwt-refresh',
) {
    constructor(
        private readonly config: ConfigService,
        private readonly authService: AuthService,
    ) {
        const jwtRefreshSecret = config.get<string>('JWT_REFRESH_SECRET');
        if (!jwtRefreshSecret)
            throw new InternalServerErrorException(
                'JWT_REFRESH_SECRET is not defined',
            );
        super({
            jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
            ignoreExpiration: false,
            secretOrKey: jwtRefreshSecret,
            issuer: config.get<string>('JWT_ISSUER'),
            audience: config.get<string>('JWT_AUDIENCE'),
            passReqToCallback: true,
        });
    }

    async validate(
        req: Request,
        payload: JwtRefreshPayload,
    ): Promise<RefreshTokenValidationResult> {
        if (payload.type !== 'refresh')
            throw new UnauthorizedException('Invalid token type!');

        if (payload.iss !== this.config.get<string>('JWT_ISSUER'))
            throw new UnauthorizedException('Invalid issuer');
        if (payload.aud !== this.config.get<string>('JWT_AUDIENCE'))
            throw new UnauthorizedException('Invalid audience');

        const refreshToken = req.body.refreshToken;

        if (!refreshToken)
            throw new UnauthorizedException('Refresh token not provided');

        const user = await this.authService.findUserById(payload.sub);
        if (!user) throw new UnauthorizedException('User not found');
        return {
            id: user.id,
            refreshToken,
        };
    }
}
