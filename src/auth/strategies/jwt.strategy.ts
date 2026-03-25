import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../services';
import {
    Injectable,
    InternalServerErrorException,
    Logger,
} from '@nestjs/common';
import { JwtPayload, UserForTokenDto } from '../interfaces';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    private readonly logger = new Logger(JwtStrategy.name);
    constructor(
        private readonly config: ConfigService,
        private readonly authService: AuthService,
    ) {
        const jwtAccessSecret = config.get<string>('JWT_ACCESS_SECRET');
        if (!jwtAccessSecret)
            throw new InternalServerErrorException(
                'JWT_ACCESS_SECRET is not defined',
            );
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: jwtAccessSecret,
            issuer: config.get<string>('JWT_ISSUER'),
            audience: config.get<string>('JWT_AUDIENCE'),
        });
    }

    async validate(payload: JwtPayload): Promise<UserForTokenDto> {
        const user = await this.authService.findUserById(payload.sub);

        if (!user) {
            this.logger.error('User not found');
            throw new InternalServerErrorException('User not found');
        }

        const hasAttendeeProfile: boolean = user.attendeeProfile ? true : false;
        const hasHostProfile: boolean = user.hostProfile ? true : false;
        const hasVendorProfile: boolean = user.vendorProfile ? true : false;

        return {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            userType: user.userType,
            status: user.status,
            ...(user.city !== undefined ? { city: user.city } : {}),
            ...(user.country !== undefined ? { country: user.country } : {}),
            hasAttendeeProfile,
            hasHostProfile,
            hasVendorProfile,
        };
    }
}
