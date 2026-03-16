import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { Profile } from 'passport';
import { GoogleProfile } from '../interfaces';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
    constructor(private readonly config: ConfigService) {
        const clientID = config.get<string>('GOOGLE_CLIENT_ID');
        const clientSecret = config.get<string>('GOOGLE_CLIENT_SECRET');
        const callbackURL = config.get<string>('GOOGLE_CALLBACK_URL');

        if (!clientID || !clientSecret || !callbackURL)
            throw new InternalServerErrorException(
                'GOOGLE_CLIENT_ID is not defined',
            );

        super({
            clientID,
            clientSecret,
            callbackURL,
            scope: ['email', 'profile'],
        });
    }

    async validate(
        _accessToken: string,
        _refreshToken: string,
        profile: Profile,
    ): Promise<GoogleProfile> {
        const { id, emails, displayName, photos } = profile;

        const email = emails?.[0]?.value;
        if (!email) {
            throw new InternalServerErrorException('No email from Google');
        }

        return {
            googleId: id,
            email: email.toLocaleLowerCase(),
            fullName: displayName,
            profilePhoto: photos?.[0]?.value,
            emailVerified: true,
        };
    }
}
