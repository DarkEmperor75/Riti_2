import {
    BadRequestException,
    HttpException,
    Injectable,
    InternalServerErrorException,
    Logger,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import {
    GoogleProfile,
    JwtPayload,
    JwtRefreshPayload,
    UserWithProfiles,
} from '../interfaces';
import { InitialIntent, UserStatus, UserType } from '@prisma/client';
import {
    AuthResponseDto,
    CreateUserDto,
    LoginDto,
    ResetPasswordDto,
    UserResponseDto,
} from '../dto';
import { User } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { EmailsService } from 'src/emails/services';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        private readonly config: ConfigService,
        private readonly jwtService: JwtService,
        private readonly db: DatabaseService,
        private readonly emailsService: EmailsService,
    ) {}

    async getMe(userId: string): Promise<UserResponseDto> {
        try {
            const user = await this.findUserById(userId);
            if (!user) throw new NotFoundException('User not found');
            return this.buildUserResponse(user);
        } catch (error) {
            this.logger.error('Error getting user', error);
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('Error getting user');
        }
    }

    async createUser(dto: CreateUserDto): Promise<AuthResponseDto> {
        try {
            const existingUser = await this.findUserByEmail(dto.email);
            if (existingUser)
                throw new BadRequestException('User already exists');

            if (dto.password !== dto.confirmPassword)
                throw new BadRequestException('Passwords do not match');
            if (dto.termsAccepted !== true)
                throw new BadRequestException(
                    'You must accept the terms and conditions',
                );

            const hashedPassword: string = await bcrypt
                .hash(dto.password, 12)
                .catch((error) => {
                    this.logger.error('Error hashing password', error);
                    throw new InternalServerErrorException(
                        'Error hashing password',
                    );
                });

            let userType: UserType;

            if (dto.initialIntent === InitialIntent.ATTEND) {
                userType = UserType.ATTENDEE;
            } else if (dto.initialIntent === InitialIntent.HOST) {
                userType = UserType.HOST;
            } else {
                userType = UserType.VENDOR;
            }

            const user = await this.db.user
                .create({
                    data: {
                        email: dto.email,
                        fullName: dto.fullName,
                        termsAccepted: dto.termsAccepted,
                        status: UserStatus.ACTIVE,
                        country: dto.country,
                        userType,
                        initialIntent: dto.initialIntent,
                        hashedPassword,
                    },
                })
                .catch((error) => {
                    this.logger.error('Error creating user', error);
                    throw new InternalServerErrorException(
                        'Error creating user',
                    );
                });

            const generateTokens = await this.generateTokens(user);

            this.emailsService
                .sendWelcomeEmail({
                    id: user.id,
                    fullName: user.fullName,
                    email: user.email,
                    language: user.language,
                })
                .catch((err) =>
                    this.logger.error('Error sending welcome email', err),
                );

            return this.buildAuthResponse(
                generateTokens.accessToken,
                generateTokens.refreshToken,
                user,
            );
        } catch (error) {
            this.logger.error('Error creating user', error);
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('Error creating user');
        }
    }

    async forgotPassword(email: string): Promise<{ message: string }> {
        const user = await this.findUserByEmail(email);
        if (!user) throw new NotFoundException('User not found');
        if (user.status === UserStatus.SUSPENDED)
            throw new BadRequestException('User account is suspended');
        return this.db.$transaction(async (tx) => {
            const updatedUser = await tx.user.update({
                where: { id: user.id },
                data: {
                    passwordResetToken: await bcrypt.hash(user.email, 12),
                    passwordResetExpiresAt: new Date(
                        Date.now() + 2 * 60 * 60 * 1000,
                    ),
                },
                select: {
                    passwordResetToken: true,
                },
            });

            if (!updatedUser.passwordResetToken) {
                throw new InternalServerErrorException(
                    'Error generating password reset token',
                );
            }

            await this.emailsService
                .sendForgotPasswordEmail(
                    {
                        id: user.id,
                        fullName: user.fullName,
                        email: user.email,
                        language: user.language,
                    },
                    updatedUser.passwordResetToken,
                )
                .catch((err) =>
                    this.logger.error(
                        'Error sending forgot password email',
                        err,
                    ),
                );

            return {
                message: 'Password reset email sent, it is valid for 2 hours!',
            };
        });
    }

    async resetPassword(
        dto: ResetPasswordDto,
    ): Promise<{ success: boolean; message: string }> {
        const user = await this.findUserByEmail(dto.email);

        if (!user) return { success: false, message: 'User not found' };
        if (user.status === UserStatus.SUSPENDED)
            return {
                success: false,
                message: 'User account is suspended',
            };
        if (!user.passwordResetExpiresAt)
            return {
                success: false,
                message: 'Password reset token is invalid',
            };
        if (user.passwordResetExpiresAt < new Date())
            return {
                success: false,
                message: 'Password reset token has expired',
            };
        if (!user.passwordResetToken)
            return {
                success: false,
                message: 'Password reset token is invalid',
            };
        if (user.passwordResetToken !== dto.token)
            return {
                success: false,
                message: 'Password reset token is invalid',
            };

        const hashedPassword: string = await bcrypt
            .hash(dto.password, 12)
            .catch((error) => {
                this.logger.error('Error hashing password', error);
                throw new InternalServerErrorException(
                    'Error hashing password',
                );
            });

        await this.db.user
            .update({
                where: { id: user.id },
                data: {
                    hashedPassword,
                    passwordResetToken: null,
                    passwordResetExpiresAt: null,
                },
                select: { id: true },
            })
            .catch((error) => {
                this.logger.error('Error resetting password', error);
                throw new InternalServerErrorException(
                    'Error resetting password',
                );
            });

        return {
            success: true,
            message: 'Password reset successfully',
        };
    }

    async login(dto: LoginDto): Promise<AuthResponseDto> {
        const user = await this.findUserByEmail(dto.email);
        if (!user) throw new NotFoundException('User not found');
        if (!dto.password)
            throw new BadRequestException('Password is required');
        if (!user.hashedPassword)
            throw new BadRequestException(
                'User has no password, set one first',
            );

        const isPasswordValid = await bcrypt.compare(
            dto.password,
            user.hashedPassword,
        );

        if (!isPasswordValid) throw new BadRequestException('Invalid password');

        const generateTokens = await this.generateTokens(user);

        await this.createSession(
            user.id,
            generateTokens.accessToken,
            dto.userAgent,
            dto.ipAddress,
        );

        return this.buildAuthResponse(
            generateTokens.accessToken,
            generateTokens.refreshToken,
            user,
        );
    }

    async logout(
        userId: string,
        accessToken: string,
    ): Promise<{ message: string }> {
        try {
            await this.db.session.updateMany({
                where: {
                    userId,
                    token: accessToken,
                    isRevoked: false,
                },
                data: {
                    isRevoked: true,
                },
            });

            return { message: 'Logged out successfully' };
        } catch (error) {
            this.logger.error('Error logging out', error);
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('Error logging out');
        }
    }

    async logoutAll(userId: string): Promise<{ message: string }> {
        try {
            await this.db.refreshToken.updateMany({
                where: {
                    userId,
                    isRevoked: false,
                },
                data: {
                    isRevoked: true,
                },
            });

            return { message: 'Logged out successfully' };
        } catch (error) {
            this.logger.error('Error logging out', error);
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('Error logging out');
        }
    }

    async findUserById(id: string): Promise<UserWithProfiles> {
        try {
            const user = await this.db.user.findUnique({
                where: {
                    id,
                },
                include: {
                    attendeeProfile: true,
                    hostProfile: true,
                    vendorProfile: true,
                },
            });

            if (!user) throw new NotFoundException('User not found');

            return user;
        } catch (error) {
            this.logger.error('Error finding user', error);
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('Error finding user');
        }
    }

    async refreshTokens(
        userId: string,
        refreshToken: string,
    ): Promise<AuthResponseDto> {
        try {
            const storedToken = await this.db.refreshToken.findFirst({
                where: {
                    userId,
                    token: refreshToken,
                    isRevoked: false,
                    expiresAt: { gt: new Date() },
                },
                include: { user: true },
            });

            if (!storedToken) {
                throw new UnauthorizedException(
                    'Invalid or expired refresh token',
                );
            }

            const newAccessToken = await this.generateAccessToken(
                storedToken.user,
            );
            const newRefreshToken = await this.generateRefreshToken(
                storedToken.user,
            );

            await this.db.$transaction([
                this.db.refreshToken.delete({
                    where: { id: storedToken.id },
                }),
                this.db.refreshToken.create({
                    data: {
                        userId: storedToken.user.id,
                        token: newRefreshToken,
                        expiresAt: this.calculateRefreshTokenExpiry(),
                    },
                }),
            ]);

            this.logger.log(`Tokens refreshed for user ${userId}`);

            return this.buildAuthResponse(
                newAccessToken,
                newRefreshToken,
                storedToken.user,
            );
        } catch (error) {
            this.logger.error('Error refreshing tokens', error);
            if (error instanceof HttpException) throw error;
            throw new UnauthorizedException('Invalid refresh token');
        }
    }

    private async generateAccessToken(user: User): Promise<string> {
        const accessPayload = {
            sub: user.id,
            email: user.email,
        };

        return await this.jwtService.signAsync(accessPayload, {
            secret: this.config.get('JWT_ACCESS_SECRET'),
            expiresIn: this.config.get('JWT_ACCESS_EXPIRES_IN'),
            issuer: this.config.get('JWT_ISSUER'),
            audience: this.config.get('JWT_AUDIENCE'),
        });
    }

    private async generateRefreshToken(user: User): Promise<string> {
        const refreshPayload = {
            sub: user.id,
            type: 'refresh',
        };

        return await this.jwtService.signAsync(refreshPayload, {
            secret: this.config.get('JWT_REFRESH_SECRET'),
            expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN'),
            issuer: this.config.get('JWT_ISSUER'),
            audience: this.config.get('JWT_AUDIENCE'),
        });
    }

    private calculateRefreshTokenExpiry(): Date {
        const expiresIn = this.config.get('JWT_REFRESH_EXPIRES_IN') || '7d';
        const expiresAt = new Date();

        if (expiresIn.includes('d')) {
            const days = parseInt(expiresIn.replace('d', ''));
            expiresAt.setDate(expiresAt.getDate() + days);
        } else if (expiresIn.includes('h')) {
            const hours = parseInt(expiresIn.replace('h', ''));
            expiresAt.setHours(expiresAt.getHours() + hours);
        }

        return expiresAt;
    }

    async findOrCreateGoogleUser(googleProfile: GoogleProfile): Promise<{
        accessToken: string;
        refreshToken: string;
    }> {
        try {
            this.logger.debug(
                'Finding or creating user with google',
                googleProfile,
            );

            let user = await this.db.user
                .findUnique({
                    where: {
                        email: googleProfile.email,
                    },
                })
                .catch((error) => {
                    this.logger.error('Error finding user', error);
                    throw new InternalServerErrorException(
                        'Error finding user',
                    );
                });

            if (!user) {
                this.logger.debug('User not found, creating new user');
                user = await this.db.user
                    .create({
                        data: {
                            googleId: googleProfile.googleId,
                            email: googleProfile.email,
                            fullName: googleProfile.fullName,
                            termsAccepted: true,
                            userType: UserType.ATTENDEE,
                            hashedPassword: null,
                        },
                    })
                    .catch((error) => {
                        this.logger.error(
                            'Error creating user with google',
                            error,
                        );
                        throw new InternalServerErrorException(
                            'Error creating user',
                        );
                    });

                this.logger.debug('User created');

                this.logger.debug('User updating user with google');

                user = await this.db.user.update({
                    where: { id: user.id },
                    data: {
                        googleId: googleProfile.googleId,
                    },
                });

                this.logger.debug('User updated', user.googleId);
            }

            const tokens = await this.generateTokens(user);

            this.logger.debug('Tokens generated', tokens);

            return {
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
            };
        } catch (error) {
            this.logger.error(
                'Error doing user operations with Google OAuth',
                error,
            );
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException(
                'Failed to do user operations with Google OAuth',
            );
        }
    }

    private async generateTokens(
        user: User,
    ): Promise<{ accessToken: string; refreshToken: string }> {
        const issuer = this.config.get<string>('JWT_ISSUER');
        const audience = this.config.get<string>('JWT_AUDIENCE');
        if (!issuer || !audience)
            throw new NotFoundException('Issuer or audience not found');

        const accessPayload: Omit<JwtPayload, 'iss' | 'aud' | 'iat' | 'exp'> = {
            sub: user.id,
            email: user.email,
        };

        const refreshPayload: Omit<
            JwtRefreshPayload,
            'iss' | 'aud' | 'iat' | 'exp'
        > = {
            sub: user.id,
            type: 'refresh',
        };

        const accessToken = await this.jwtService
            .signAsync(accessPayload, {
                secret: this.config.get<string>('JWT_ACCESS_SECRET'),
                expiresIn: this.config.get('JWT_ACCESS_EXPIRES_IN'),
                issuer: this.config.get('JWT_ISSUER'),
                audience: this.config.get('JWT_AUDIENCE'),
            })
            .catch((error) => {
                this.logger.error('Failed to sign access token', error);
                if (error instanceof HttpException) throw error;
                throw new InternalServerErrorException(
                    'Failed to sign access token',
                );
            });

        const refreshToken = await this.jwtService
            .signAsync(refreshPayload, {
                secret: this.config.get<string>('JWT_REFRESH_SECRET'),
                expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN'),
                issuer: this.config.get('JWT_ISSUER'),
                audience: this.config.get('JWT_AUDIENCE'),
            })
            .catch((error) => {
                this.logger.error('Failed to sign refresh token', error);
                if (error instanceof HttpException) throw error;
                throw new InternalServerErrorException(
                    'Failed to sign refresh token',
                );
            });

        await this.storeRefreshToken(user.id, refreshToken).catch((error) => {
            this.logger.error('Failed to store refresh token', error);
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException(
                'Failed to store refresh token',
            );
        });

        return { accessToken, refreshToken };
    }

    private async storeRefreshToken(
        userId: string,
        token: string,
    ): Promise<void> {
        try {
            const expiresIn = this.config.get('JWT_REFRESH_EXPIRES_IN');
            if (!expiresIn)
                throw new NotFoundException('expiresIn is not defined');
            const expiresAt = new Date();

            const days = parseInt(expiresIn.replace('d', ''));
            expiresAt.setDate(expiresAt.getDate() + days);

            await this.db.refreshToken
                .create({
                    data: {
                        userId,
                        token,
                        expiresAt,
                    },
                })
                .catch((error) => {
                    this.logger.error(
                        'Failed prisma operation to store tokens',
                        error,
                    );
                    throw new InternalServerErrorException(
                        'Error storing refresh token',
                    );
                });
        } catch (error) {
            this.logger.error('Failed to store refresh tokens', error);
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException(
                'Failed to store refresh tokens',
            );
        }
    }

    private async findUserByEmail(email: string): Promise<User | null> {
        try {
            return await this.db.user
                .findUnique({
                    where: {
                        email,
                    },
                })
                .catch((error) => {
                    this.logger.error('Error finding user', error);
                    throw new NotFoundException('User not found');
                });
        } catch (error) {
            this.logger.error('Error finding user', error);
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('Error finding user');
        }
    }

    private buildAuthResponse(
        accessToken: string,
        refreshToken: string,
        user: User,
    ): AuthResponseDto {
        try {
            if (
                !user ||
                refreshToken === undefined ||
                accessToken === undefined
            ) {
                this.logger.error('User not passed in buildAuthResponse');
                throw new BadRequestException('User not found');
            }

            const userResponse: UserResponseDto = this.buildUserResponse(user);

            return {
                accessToken,
                refreshToken,
                user: userResponse,
            };
        } catch (error) {
            this.logger.error('Error building auth response', error);
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException(
                'Error building auth response',
            );
        }
    }

    private buildUserResponse(user: User): UserResponseDto {
        try {
            return {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                userType: user.userType,
                status: user.status,
                country: user.country,
                ...(user.city !== undefined ? { city: user.city } : {}),
                ...(user.profilePicture !== undefined
                    ? { profilePicture: user.profilePicture }
                    : {}),
                ...(user.language !== undefined
                    ? { language: user.language }
                    : {}),
            };
        } catch (error) {
            this.logger.error('Error building user response', error);
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException(
                'Error building user response',
            );
        }
    }

    private async createSession(
        userId: string,
        accessToken: string,
        userAgent?: string,
        ipAddress?: string,
    ): Promise<void> {
        try {
            const expiresIn = this.config.get('JWT_ACCESS_EXPIRES_IN') || '30m';
            const expiresAt = new Date();

            if (expiresIn.includes('m')) {
                const minutes = parseInt(expiresIn.replace('m', ''));
                expiresAt.setMinutes(expiresAt.getMinutes() + minutes);
            } else if (expiresIn.includes('h')) {
                const hours = parseInt(expiresIn.replace('h', ''));
                expiresAt.setHours(expiresAt.getHours() + hours);
            } else if (expiresIn.includes('d')) {
                const days = parseInt(expiresIn.replace('d', ''));
                expiresAt.setDate(expiresAt.getDate() + days);
            }

            await this.db.session.create({
                data: {
                    userId,
                    token: accessToken,
                    userAgent: userAgent || 'Unknown',
                    ipAddress: ipAddress || 'Unknown',
                    expiresAt,
                },
            });

            this.logger.log(`Session created for user ${userId}`);
        } catch (error) {
            this.logger.error('Error creating session', error);
        }
    }
}
