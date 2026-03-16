import { Global, Module } from '@nestjs/common';
import { AuthService } from './services';
import { AuthController } from './controllers';
import { ConfigService } from '@nestjs/config';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import * as jwt from 'jsonwebtoken';
import { PassportModule } from '@nestjs/passport';
import { GoogleStrategy, JwtRefreshStrategy, JwtStrategy } from './strategies';
import { JwtAuthGuard, JwtRefreshGuard, SuspentionGuard } from './guards';

function getJwtConfig(configService: ConfigService): JwtModuleOptions {
    return {
        secret: configService.get<string>('JWT_ACCESS_SECRET'),
        signOptions: {
            expiresIn: configService.get(
                'JWT_ACCESS_EXPIRES_IN',
            ) as jwt.SignOptions['expiresIn'],
            issuer: configService.get('JWT_ISSUER'),
            audience: configService.get('JWT_AUDIENCE'),
        },
    };
}

@Global()
@Module({
    imports: [
        PassportModule,
        JwtModule.registerAsync({
            useFactory: getJwtConfig,
            inject: [ConfigService],
        }),
    ],
    controllers: [AuthController],
    providers: [
        AuthService,
        JwtStrategy,
        JwtRefreshStrategy,
        GoogleStrategy,
        JwtAuthGuard,
        JwtRefreshGuard,
        SuspentionGuard,
    ],
    exports: [AuthService, JwtAuthGuard, SuspentionGuard],
})
export class AuthModule {}
