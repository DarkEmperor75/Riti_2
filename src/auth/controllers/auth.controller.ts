import {
    Controller,
    Post,
    Body,
    Get,
    UseGuards,
    Res,
    Req,
    HttpStatus,
    HttpCode,
    ValidationPipe,
    Logger,
    InternalServerErrorException,
    HttpException,
    BadRequestException,
    ForbiddenException,
    UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '../services';
import {
    AuthResponseDto,
    CreateUserDto,
    ForgotPasswordDto,
    LoginDto,
    RefreshTokenDto,
    ResetPasswordDto,
    UserResponseDto,
} from '../dto';
import {
    ApiBearerAuth,
    ApiExcludeEndpoint,
    ApiOperation,
    ApiResponse,
    ApiTags,
    ApiBody,
} from '@nestjs/swagger';
import { GetUser, Public } from '../decorators';
import { AuthGuard } from '@nestjs/passport';
import { GoogleProfile, type UserForTokenDto } from '../interfaces';
import { type Request, type Response } from 'express';
import {
    AUTH_SIGNUP_DESCRIPTION,
    AUTH_SIGNUP_400_RESPONSE,
    AUTH_LOGIN_DESCRIPTION,
    AUTH_LOGIN_401_RESPONSE,
    AUTH_LOGOUT_DESCRIPTION,
    AUTH_LOGOUT_ALL_DESCRIPTION,
    AUTH_REFRESH_DESCRIPTION,
    AUTH_REFRESH_401_RESPONSE,
    AUTH_GOOGLE_DESCRIPTION,
    AUTH_GOOGLE_CALLBACK_DESCRIPTION,
    AUTH_GOOGLE_CALLBACK_RESPONSE,
} from 'src/common/constants';
import { JwtAuthGuard, JwtRefreshGuard, SuspentionGuard } from '../guards';
import { UserStatus } from '@prisma/client';
import { Throttle } from '@nestjs/throttler';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
    private readonly logger = new Logger(AuthController.name);

    constructor(private readonly authService: AuthService) {}

    @Public()
    @Throttle({ short: { limit: 5, ttl: 60000 } }) // 5 requests per minute
    @Post('signup')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({
        summary: 'Register new user with email and password',
        description: AUTH_SIGNUP_DESCRIPTION,
    })
    @ApiBody({ type: CreateUserDto })
    @ApiResponse({
        status: 201,
        description:
            'User created successfully. Returns JWT tokens and user profile.',
        type: AuthResponseDto,
    })
    @ApiResponse({
        status: 400,
        description: AUTH_SIGNUP_400_RESPONSE,
    })
    @ApiResponse({
        status: 500,
        description: 'Internal server error during user creation',
    })
    async signup(
        @Body(ValidationPipe) createUserDto: CreateUserDto,
    ): Promise<AuthResponseDto> {
        try {
            return await this.authService.createUser(createUserDto);
        } catch (error) {
            this.logger.error('Error creating user', error);
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('Error creating user');
        }
    }

    @Public()
    @Throttle({ short: { limit: 3, ttl: 60000 } })
    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Login with email and password',
        description: AUTH_LOGIN_DESCRIPTION,
    })
    @ApiBody({ type: LoginDto })
    @ApiResponse({
        status: 200,
        description: 'Login successful. Returns JWT tokens and user profile.',
        type: AuthResponseDto,
    })
    @ApiResponse({
        status: 401,
        description: AUTH_LOGIN_401_RESPONSE,
    })
    @ApiResponse({
        status: 500,
        description: 'Internal server error during login',
    })
    async login(
        @Body(ValidationPipe) loginDto: LoginDto,
    ): Promise<AuthResponseDto> {
        try {
            return await this.authService.login(loginDto);
        } catch (error) {
            this.logger.error('Error logging in user', error);
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('Error logging in user');
        }
    }

    @Post('forgot-password')
    @Throttle({ short: { limit: 3, ttl: 60000 } })
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Initiate password reset process',
        description:
            'Initiates the password reset process for a user with the provided email.',
    })
    @ApiBody({
        type: ForgotPasswordDto,
        required: true,
        description: 'User email',
        examples: {
            'john@example.com': {
                value: {
                    email: 'john@example.com',
                },
                summary: 'User email',
            },
        },
    })
    @ApiResponse({
        status: 200,
        description: 'Password reset initiated successfully.',
        type: Object,
        examples: {
            'Password reset email sent, it is valid for 2 hours!': {
                value: {
                    message:
                        'Password reset email sent, it is valid for 2 hours!',
                },
                summary: 'Password reset email sent, it is valid for 2 hours!',
            },
        },
    })
    async forgotPassword(@Body() dto: ForgotPasswordDto) {
        this.logger.log(`Forgot password for email: ${dto.email}`);
        return this.authService.forgotPassword(dto.email);
    }

    @Post('reset-password')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Reset user password',
        description:
            'Resets the password for a user with the provided reset token.',
    })
    @ApiBody({
        type: ResetPasswordDto,
        required: true,
        description: 'Reset password data',
    })
    @ApiResponse({
        status: 200,
        description: 'Password reset operations',
        type: Object,
        examples: {
            'Password reset failed': {
                value: {
                    success: false,
                    message: 'Password reset token is invalid',
                },
                summary: 'Password reset failed',
            },
            'Password reset successful': {
                value: {
                    success: true,
                    message: 'Password reset successful',
                },
                summary: 'Password reset successful',
            },
        },
    })
    async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
        return this.authService.resetPassword(resetPasswordDto);
    }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Get current authenticated user',
        description:
            'Returns the profile of the currently authenticated user based on the provided access token.',
    })
    @ApiResponse({
        status: 200,
        description: 'User profile retrieved successfully.',
        type: UserResponseDto,
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized - Invalid or missing access token',
        example: {
            statusCode: 401,
            timestamp: '2026-02-05T20:11:02.883Z',
            path: '/api/auth/me',
            message: {
                message: 'Unauthorized',
                statusCode: 401,
            },
        },
    })
    @ApiResponse({
        status: 500,
        description: 'Internal server error while fetching user profile',
        example: {
            statusCode: 500,
            timestamp: '2026-02-05T20:11:02.883Z',
            path: '/api/auth/me',
            message: 'Internal server error',
        },
    })
    async getMe(@GetUser() user: UserForTokenDto): Promise<UserResponseDto> {
        try {
            if (user.status === UserStatus.SUSPENDED)
                throw new ForbiddenException(
                    'Suspended User cannot access the application',
                );

            return this.authService.getMe(user.id);
        } catch (error) {
            this.logger.error('Error getting user', error);
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('Error getting user');
        }
    }

    @Post('logout')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Logout from current session',
        description: AUTH_LOGOUT_DESCRIPTION,
    })
    @ApiResponse({
        status: 200,
        description: 'Logout successful. Current session revoked.',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: 'Logged out successfully' },
            },
        },
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized - Invalid or missing access token',
    })
    async logout(
        @GetUser() user: UserForTokenDto,
        @Req() req: Request,
    ): Promise<{ message: string }> {
        try {
            if (!user) throw new BadRequestException('User not found');
            if (user.status === UserStatus.SUSPENDED)
                throw new ForbiddenException(
                    'Suspended User cannot access the application',
                );

            const accessToken = req.headers.authorization?.replace(
                'Bearer ',
                '',
            );
            if (!accessToken)
                throw new BadRequestException('Access token not found');

            return await this.authService.logout(user.id, accessToken);
        } catch (error) {
            this.logger.error('Error logging out user', error);
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('Error logging out user');
        }
    }

    @Post('logout-all')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Logout from all devices and sessions',
        description: AUTH_LOGOUT_ALL_DESCRIPTION,
    })
    @ApiResponse({
        status: 200,
        description: 'All sessions and refresh tokens revoked successfully.',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: 'Logged out successfully' },
            },
        },
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized - Invalid or missing access token',
    })
    async logoutAll(
        @GetUser() user: UserForTokenDto,
    ): Promise<{ message: string }> {
        try {
            if (!user) throw new BadRequestException('User not found');
            if (user.status === UserStatus.SUSPENDED)
                throw new ForbiddenException(
                    'Suspended User cannot access the application',
                );
            return await this.authService.logoutAll(user.id);
        } catch (error) {
            this.logger.error('Error logging out user from all devices', error);
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('Error logging out user');
        }
    }

    @Post('refresh-token')
    @UseGuards(JwtRefreshGuard)
    @HttpCode(HttpStatus.OK)
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Refresh access token using refresh token',
        description: AUTH_REFRESH_DESCRIPTION,
    })
    @ApiBody({ type: RefreshTokenDto })
    @ApiResponse({
        status: 200,
        description:
            'Tokens refreshed successfully. Old refresh token revoked.',
        type: AuthResponseDto,
    })
    @ApiResponse({
        status: 401,
        description: AUTH_REFRESH_401_RESPONSE,
    })
    @ApiResponse({
        status: 500,
        description: 'Internal server error during token refresh',
    })
    async refreshToken(
        @Body(ValidationPipe) refreshTokenDto: RefreshTokenDto,
        @GetUser() user: UserForTokenDto,
    ): Promise<AuthResponseDto> {
        try {
            return await this.authService.refreshTokens(
                user.id,
                refreshTokenDto.refreshToken,
            );
        } catch (error) {
            this.logger.error('Error refreshing token', error);
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('Error refreshing token');
        }
    }

    @Public()
    @Throttle({ short: { limit: 3, ttl: 60000 } })
    @Get('google')
    @UseGuards(AuthGuard('google'))
    @ApiOperation({
        summary: 'Initiate Google OAuth 2.0 login',
        description: AUTH_GOOGLE_DESCRIPTION,
    })
    @ApiResponse({
        status: HttpStatus.FOUND,
        description: 'Redirects to Google OAuth consent screen',
    })
    @ApiResponse({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        description: 'Google OAuth credentials not configured',
    })
    async googleAuth() {
        // ! Passport GoogleStrategy handles the redirect automatically
    }

    @Public()
    @Throttle({ short: { limit: 3, ttl: 60000 } })
    @Get('google/callback')
    @UseGuards(AuthGuard('google'))
    @ApiOperation({
        summary: 'Google OAuth callback endpoint',
        description: AUTH_GOOGLE_CALLBACK_DESCRIPTION,
    })
    @ApiResponse({
        status: HttpStatus.FOUND,
        description: AUTH_GOOGLE_CALLBACK_RESPONSE,
    })
    @ApiResponse({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        description: 'Failed to process Google OAuth callback',
    })
    @ApiExcludeEndpoint(false)
    async googleAuthCallback(@Req() req: Request, @Res() res: Response) {
        const googleProfile = req.user as GoogleProfile;

        if (!googleProfile)
            throw new UnauthorizedException(
                'Failed to process Google OAuth callback',
            );

        this.logger.debug(
            'Got the google profile, trying to log in the user',
            googleProfile,
        );

        const authResponse =
            await this.authService.findOrCreateGoogleUser(googleProfile);

        const frontendUrl = process.env.FRONTEND_URL;

        if (!frontendUrl)
            throw new InternalServerErrorException(
                'Failed to process Google OAuth callback',
            );

        this.logger.debug('Got the frontend url', frontendUrl);

        const redirectUrl = `${frontendUrl}/auth/callback?accessToken=${authResponse.accessToken}&refreshToken=${authResponse.refreshToken}`;

        this.logger.debug('Redirecting to frontend', redirectUrl);

        return res.redirect(redirectUrl);
    }
}
