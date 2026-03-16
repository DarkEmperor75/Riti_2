import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpException,
    HttpStatus,
    InternalServerErrorException,
    Logger,
    Param,
    Patch,
    Post,
    Put,
    UseGuards,
    UploadedFile,
    UseInterceptors,
    Delete,
    BadRequestException,
} from '@nestjs/common';
import {
    ApiAcceptedResponse,
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiCreatedResponse,
    ApiInternalServerErrorResponse,
    ApiOkResponse,
    ApiParam,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';

import { UserType } from '@prisma/client';

import { GetUser } from 'src/auth/decorators';
import { type UserForTokenDto } from 'src/auth/interfaces';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

import { UsersService } from '../services';
import {
    AttendeeResponseDto,
    CreateHostProfileDto,
    CreateVendorProfileDto,
    HostProfileResponseDto,
    UpdateAttendeeProfileDto,
    UpdateHosProfiletDto,
    UpdateUserProfileDto,
    UpdateVendorProfiletDto,
    UserProfileResponseDto,
    VendorProfileResponseDto,
} from '../dto';
import {
    AttendeeProfileGuard,
    HostProfileGuard,
    VendorProfileGuard,
} from '../guards';
import { PfpDeleteResponse, PfpUploadResponse } from '../interfaces';

@Controller('users')
@ApiTags('Users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class UsersController {
    private readonly logger = new Logger(UsersController.name);
    constructor(private readonly usersService: UsersService) {}

    @Put('profile')
    @HttpCode(HttpStatus.CREATED)
    @ApiCreatedResponse({
        description: 'User created',
        example: {
            success: true,
            message: 'Profile updated successfully',
        },
    })
    @ApiBadRequestResponse({
        description: 'Invalid User Update Datax',
        example: {
            statusCode: 400,
            timestamp: '2026-02-06T12:26:56.293Z',
            path: '/api/users/profile',
            message: {
                message: [
                    'language must be one of the following values: EN, NO',
                ],
                error: 'Bad Request',
                statusCode: 400,
            },
        },
    })
    @ApiInternalServerErrorResponse({
        description: 'Error creating user',
        example: {
            success: false,
            message: 'Error creating user',
        },
    })
    async createUser(
        @GetUser() user: UserForTokenDto,
        @Body() dto: UpdateUserProfileDto,
    ): Promise<{ success: boolean; message: string }> {
        return this.usersService.updateUserProfile(user.id, dto);
    }

    @Get('profile')
    @HttpCode(HttpStatus.OK)
    @ApiOkResponse({
        description: 'User profile',
        example: {
            id: 'cmkzwivmb00000w7we900lgzt',
            email: 'newman@gmail.com',
            fullName: 'Dhanraj Vijay',
            country: 'DK',
            language: 'NO',
            city: 'Oslo',
            userType: 'VENDOR',
            status: 'ACTIVE',
            isAdmin: false,
            hasAttendeeProfile: false,
            hasHostProfile: true,
            hasVendorProfile: true,
            createdAt: '2026-01-29T20:23:21.492Z',
            updatedAt: '2026-02-06T12:32:22.512Z',
        },
    })
    @ApiUnauthorizedResponse({
        description: 'User is not authorized',
        example: {
            statusCode: 401,
            timestamp: '2026-02-06T10:08:43.420Z',
            path: '/api/users/profile',
            message: 'Unauthorized',
        },
    })
    @ApiInternalServerErrorResponse({
        description: 'Error getting user profile',
        example: {
            success: false,
            message: 'Error getting user profile',
        },
    })
    async getUserProfile(
        @GetUser() user: UserForTokenDto,
    ): Promise<UserProfileResponseDto> {
        try {
            this.logger.debug('Getting user profile for user: ', user.id);
            return this.usersService.getUserProfile(user.id);
        } catch (error) {
            this.logger.error('Error getting user profile', error);
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException(
                'Error getting user profile',
            );
        }
    }

    @Post('pfp')
    @HttpCode(HttpStatus.CREATED)
    @UseInterceptors(FileInterceptor('file'))
    @ApiCreatedResponse({
        description: 'Profile picture uploaded',
        example: {
            success: true,
            message: 'Image uploaded successfully',
            profilePicture: 'https://example.com/profile-picture.jpg',
        },
    })
    @ApiBadRequestResponse({
        description: 'Wrong File Type',
        example: {
            statusCode: 400,
            timestamp: '2026-02-06T10:08:43.420Z',
            path: '/api/users/pfp',
            message: {
                message: 'Unexpected field - file',
                error: 'Bad Request',
                statusCode: 400,
            },
        },
    })
    @ApiInternalServerErrorResponse({
        description: 'Error uploading image',
        example: {
            success: false,
            message: 'Error uploading image',
        },
    })
    async uploadPfp(
        @GetUser() user: UserForTokenDto,
        @UploadedFile() file: Express.Multer.File,
    ): Promise<PfpUploadResponse> {
        this.logger.debug('Uploading profile picture for user: ', user.id);
        return this.usersService.uploadUserPfp(file, user.id);
    }

    @Delete('pfp')
    @HttpCode(HttpStatus.OK)
    @ApiOkResponse({
        description: 'Profile picture deleted',
        example: {
            success: true,
            message: 'Image deleted successfully',
        },
    })
    @ApiBadRequestResponse({
        description: 'Failed to delete image',
        example: {
            statusCode: 400,
            timestamp: '2026-02-06T10:05:48.855Z',
            path: '/api/users/pfp',
            message: {
                message: 'User does not have a profile picture',
                error: 'Bad Request',
                statusCode: 400,
            },
        },
    })
    @ApiInternalServerErrorResponse({
        description: 'Error deleting image',
        example: {
            success: false,
            message: 'Error deleting image',
        },
    })
    async deletePfp(
        @GetUser() user: UserForTokenDto,
    ): Promise<PfpDeleteResponse> {
        try {
            this.logger.debug('Deleting profile picture for user: ', user.id);
            return this.usersService.deleteUserPfp(user.id);
        } catch (error) {
            this.logger.error('Error deleting image', error);
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('Error deleting image');
        }
    }

    @Get('attendee')
    @HttpCode(HttpStatus.OK)
    @UseGuards(AttendeeProfileGuard)
    @ApiOkResponse({
        description: 'Attendee profile retrieved',
        example: {
            id: 'cmkzwivmb00000w7we900lgzt',
            email: 'newman@gmail.com',
            fullName: 'Dhanraj Vijay',
            bio: 'Okay, So I am Yash the attendee',
            preferences: {
                notifications: false,
            },
            profilePicture:
                'https://xouczrsenrzrjpskelxa.supabase.co/storage/v1/object/public/profiles/cmkzwivmb00000w7we900lgzt/69fe8e8f-e02f-45a8-9549-e7d5d19c18a7.jpg',
            city: 'Oslo',
            userType: 'ATTENDEE',
        },
    })
    @ApiBadRequestResponse({
        description: 'Wrong Mode',
        example: {
            statusCode: 403,
            timestamp: '2026-02-06T13:36:21.314Z',
            path: '/api/users/attendee',
            message: {
                message: 'Switch to Attendee Mode to access this endpoint',
                error: 'Forbidden',
                statusCode: 403,
            },
        },
    })
    @ApiInternalServerErrorResponse({
        description: 'Error getting attendee profile',
        example: {
            statusCode: 500,
            timestamp: '2026-02-06T13:36:21.314Z',
            path: '/api/users/attendee',
            message: {
                message: 'Error getting attendee profile',
                error: 'Internal Server Error',
                statusCode: 500,
            },
        },
    })
    async getAttendeeProfile(
        @GetUser() user: UserForTokenDto,
    ): Promise<AttendeeResponseDto> {
        try {
            this.logger.debug('Getting attendee profile for user: ', user.id);
            return this.usersService.getOrCreateAttendeeProfile(user.id);
        } catch (error) {
            this.logger.error('Error getting attendee profile', error);
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException(
                'Error getting attendee profile',
            );
        }
    }

    @Put('attendee')
    @UseGuards(AttendeeProfileGuard)
    @HttpCode(HttpStatus.ACCEPTED)
    @ApiAcceptedResponse({
        description: 'Attendee profile updated',
        example: {
            id: 'cmkzwivmb00000w7we900lgzt',
            email: 'newman@gmail.com',
            fullName: 'Dhanraj Vijay',
            bio: 'Okay, So I am Yash the attendee',
            preferences: {
                notifications: false,
            },
            profilePicture:
                'https://xouczrsenrzrjpskelxa.supabase.co/storage/v1/object/public/profiles/cmkzwivmb00000w7we900lgzt/69fe8e8f-e02f-45a8-9549-e7d5d19c18a7.jpg',
            city: 'Oslo',
            userType: 'ATTENDEE',
        },
    })
    @ApiBadRequestResponse({
        description: 'Wrong data provided',
        example: {
            statusCode: 400,
            timestamp: '2026-02-06T13:43:10.113Z',
            path: '/api/users/attendee',
            message: {
                message: 'No data provided',
                error: 'Bad Request',
                statusCode: 400,
            },
        },
    })
    async updateAttendeeProfile(
        @GetUser() user: UserForTokenDto,
        @Body() dto: UpdateAttendeeProfileDto,
    ): Promise<AttendeeResponseDto> {
        try {
            this.logger.debug('Updating attendee profile for user: ', user.id);
            return this.usersService.updateAttendeeProfile(user.id, dto);
        } catch (error) {
            this.logger.error('Error updating attendee profile', error);
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException(
                'Error updating attendee profile',
            );
        }
    }

    @Post('host')
    @HttpCode(HttpStatus.CREATED)
    @UseInterceptors(FileInterceptor('profilePicture'))
    @ApiCreatedResponse({
        description: 'Host profile created',
        type: HostProfileResponseDto,
        example: {
            id: 'cmkzwivmb00000w7we900lgzt',
            status: 'ACTIVE',
            displayName: 'Shashwat Singh',
            bio: 'Knock Knock',
            phoneNumber: '+46 7518741899',
            city: 'Osaka',
            profilePicture:
                'https://media.licdn.com/dms/image/v2/D5603AQEeX4_uGXl4jA/profile-displayphoto-crop_800_800/B56ZsUP6lRJAAM-/0/1765571275614?e=1772064000&v=beta&t=uwXGFNQNAYpzVi0k8JpcipSky8y894iaDTnw0-nOqgY',
            website: 'https://shashwatsingh.vercel.app/',
            instagramUrl: 'https://www.instagram.com/shhashwat',
            twitterUrl: 'https://x.com/shhhashwat',
        },
    })
    @ApiBadRequestResponse({
        description: 'Bad request',
        example: {
            statusCode: 400,
            timestamp: '2026-02-05T20:15:33.110Z',
            path: '/api/users/host-profile',
            message: {
                message: [
                    'Display name cannot exceed 100 characters',
                    'Display name must be at least 3 characters',
                    'Display name is required',
                    'Bio cannot exceed 1500 characters',
                    'Bio must be at least 3 characters',
                    'Bio is required',
                    'phoneNumber must match /^\\+?(45|46|47)\\s?\\d{6,10}$/ regular expression',
                    'Phone number cannot exceed 12 characters',
                    'Phone number must be at least 3 characters',
                    'Phone number is required',
                    'City cannot exceed 100 characters',
                    'City must be at least 3 characters',
                    'City is required',
                ],
                error: 'Bad Request',
                statusCode: 400,
            },
        },
    })
    @ApiBadRequestResponse({
        description: 'User Already Exists',
        example: {
            statusCode: 400,
            timestamp: '2026-02-05T20:38:25.613Z',
            path: '/api/users/host-profile',
            message: {
                message: 'Host profile already exists',
                error: 'Bad Request',
                statusCode: 400,
            },
        },
    })
    @ApiUnauthorizedResponse({
        description: 'Unauthorized',
        example: {
            statusCode: 401,
            timestamp: '2026-02-05T20:31:46.665Z',
            path: '/api/users/host-profile',
            message: {
                message: 'Unauthorized',
                statusCode: 401,
            },
        },
    })
    @ApiInternalServerErrorResponse({
        description: 'Internal server error',
        example: {
            statusCode: 500,
            timestamp: '2026-02-05T20:24:17.386Z',
            path: '/api/users/host-profile',
            message: {
                message: 'Error creating host profile',
                error: 'Internal Server Error',
                statusCode: 500,
            },
        },
    })
    async createHostProfile(
        @GetUser() user: UserForTokenDto,
        @Body() dto: CreateHostProfileDto,
        @UploadedFile() file?: Express.Multer.File,
    ): Promise<HostProfileResponseDto> {
        this.logger.debug('Creating host profile for user: ', user.id);
        if (file) {
            dto.profilePicture = file;
        }
        return this.usersService.createHostProfile(user.id, dto);
    }

    @Get('host')
    @UseGuards(HostProfileGuard)
    @HttpCode(HttpStatus.OK)
    @ApiOkResponse({
        description: 'Host profile',
        type: HostProfileResponseDto,
        example: {
            id: 'cmkzwivmb00000w7we900lgzt',
            status: 'ACTIVE',
            displayName: 'Shashwat Singh',
            bio: 'Knock Knock',
            phoneNumber: '+46 7518741899',
            city: 'Osaka',
            profilePicture:
                'https://media.licdn.com/dms/image/v2/D5603AQEeX4_uGXl4jA/profile-displayphoto-crop_800_800/B56ZsUP6lRJAAM-/0/1765571275614?e=1772064000&v=beta&t=uwXGFNQNAYpzVi0k8JpcipSky8y894iaDTnw0-nOqgY',
            website: 'https://shashwatsingh.vercel.app/',
            instagramUrl: 'https://www.instagram.com/shhashwat',
            twitterUrl: 'https://x.com/shhhashwat',
        },
    })
    @ApiUnauthorizedResponse({
        description: 'Unauthorized',
        example: {
            statusCode: 401,
            timestamp: '2026-02-05T21:16:13.061Z',
            path: '/api/users/host',
            message: {
                message: 'Unauthorized',
                statusCode: 401,
            },
        },
    })
    @ApiInternalServerErrorResponse({
        description: 'Internal server error',
        example: {
            statusCode: 500,
            timestamp: '2026-02-05T21:16:13.061Z',
            path: '/api/users/host',
            message: {
                message: 'Error getting host profile',
                error: 'Internal Server Error',
                statusCode: 500,
            },
        },
    })
    async getHostProfile(
        @GetUser() user: UserForTokenDto,
    ): Promise<HostProfileResponseDto> {
        try {
            this.logger.debug('Getting host profile for user: ', user.id);
            return this.usersService.getHostProfile(user.id);
        } catch (error) {
            this.logger.error('Error getting host profile', error);
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException(
                'Error getting host profile',
            );
        }
    }

    @Put('host')
    @HttpCode(HttpStatus.OK)
    @UseGuards(HostProfileGuard)
    @UseInterceptors(FileInterceptor('profilePicture'))
    @ApiOkResponse({
        description: 'Host profile updated',
        type: HostProfileResponseDto,
        example: {
            id: 'cmkzwivmb00000w7we900lgzt',
            status: 'ACTIVE',
            displayName: 'Yashraj Sinnah',
            bio: 'Meow man',
            phoneNumber: '+46 7905276591',
            city: 'Pune',
            profilePicture:
                'https://avatars.githubusercontent.com/u/126189199?v=4',
            website: 'https://shashwatsingh.vercel.app/',
            instagramUrl: 'https://www.instagram.com/shhashwat',
            twitterUrl: 'https://x.com/shashwat',
        },
    })
    @ApiBadRequestResponse({
        description: 'Bad Request',
        example: {
            statusCode: 400,
            timestamp: '2026-02-05T21:43:45.489Z',
            path: '/api/users/host',
            message: {
                message: ['property userStatus should not exist'],
                error: 'Bad Request',
                statusCode: 400,
            },
        },
    })
    @ApiUnauthorizedResponse({
        description: 'Unauthorized',
        example: {
            statusCode: 401,
            timestamp: '2026-02-05T21:43:45.489Z',
            path: '/api/users/host',
            message: {
                message: 'Unauthorized',
                statusCode: 401,
            },
        },
    })
    @ApiInternalServerErrorResponse({
        description: 'Internal server error',
        example: {
            statusCode: 500,
            timestamp: '2026-02-05T21:43:45.489Z',
            path: '/api/users/host',
            message: {
                message: 'Error updating host profile',
                error: 'Internal Server Error',
                statusCode: 500,
            },
        },
    })
    async updateHostProfile(
        @GetUser() user: UserForTokenDto,
        @Body() dto: UpdateHosProfiletDto,
        @UploadedFile() file?: Express.Multer.File,
    ): Promise<HostProfileResponseDto> {
        try {
            this.logger.debug('Updating host profile for user: ', user.id);
            if (file) {
                dto.profilePicture = file;
            }
            return this.usersService.updateHostProfile(user.id, dto);
        } catch (error) {
            this.logger.error('Error updating host profile', error);
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException(
                'Error updating host profile',
            );
        }
    }

    @Post('vendor')
    @HttpCode(HttpStatus.CREATED)
    @UseInterceptors(FileInterceptor('businessPfp'))
    @ApiCreatedResponse({
        description: 'Vendor profile created',
        type: VendorProfileResponseDto,
        example: {
            id: 'cmkzwivmb00000w7we900lgzt',
            status: 'APPROVED',
            isOnBoarded: false,
            businessName: 'Shashwat Singh',
            contactEmail: 'newman@gmail.com',
            contactPhone: '+47 31232103',
            city: 'Pune',
            businessPfp:
                'https://avatars.githubusercontent.com/u/126189199?s=400&u=c492e677ab2e77f53777f0e6e2d23429cd6aeb25&v=4',
        },
    })
    @ApiBadRequestResponse({
        description: 'Bad Request',
        example: {
            statusCode: 400,
            timestamp: '2026-02-05T22:40:19.741Z',
            path: '/api/users/vendor',
            message: {
                message: 'Vendor profile already exists',
                error: 'Bad Request',
                statusCode: 400,
            },
        },
    })
    @ApiInternalServerErrorResponse({
        description: 'Internal server error',
        example: {
            statusCode: 500,
            timestamp: '2026-02-05T22:40:19.741Z',
            path: '/api/users/vendor',
            message: {
                message: 'Error creating vendor profile',
                error: 'Internal Server Error',
                statusCode: 500,
            },
        },
    })
    async createVendorProfile(
        @GetUser() user: UserForTokenDto,
        @Body() dto: CreateVendorProfileDto,
        @UploadedFile() file?: Express.Multer.File,
    ): Promise<VendorProfileResponseDto> {
        try {
            this.logger.debug('Creating vendor profile for user: ', user.id);
            if (file) {
                dto.businessPfp = file;
            }
            if(user.hasVendorProfile) throw new BadRequestException('Vendor profile already exists');
            return this.usersService.createVendorProfile(user.id, dto);
        } catch (error) {
            this.logger.error('Error creating vendor profile', error);
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException(
                'Error creating vendor profile',
            );
        }
    }

    @Get('vendor')
    @HttpCode(HttpStatus.OK)
    @UseGuards(VendorProfileGuard)
    @ApiOkResponse({
        description: 'Vendor profile found',
        type: VendorProfileResponseDto,
        example: {
            id: 'cmkzwivmb00000w7we900lgzt',
            status: 'APPROVED',
            isOnBoarded: false,
            businessName: 'Shashwat Singh',
            contactEmail: 'newman@gmail.com',
            contactPhone: '+47 31232103',
            city: 'Pune',
            businessPfp:
                'https://avatars.githubusercontent.com/u/126189199?s=400&u=c492e677ab2e77f53777f0e6e2d23429cd6aeb25&v=4',
        },
    })
    @ApiUnauthorizedResponse({
        description: 'Unauthorized',
        example: {
            statusCode: 403,
            timestamp: '2026-02-05T22:46:18.685Z',
            path: '/api/users/vendor',
            message: {
                message: 'Switch to Vendor Mode to access this endpoint',
                error: 'Forbidden',
                statusCode: 403,
            },
        },
    })
    @ApiInternalServerErrorResponse({
        description: 'Internal server error',
        example: {
            statusCode: 500,
            timestamp: '2026-02-05T22:40:19.741Z',
            path: '/api/users/vendor',
            message: {
                message: 'Error getting vendor profile',
                error: 'Internal Server Error',
                statusCode: 500,
            },
        },
    })
    async getVendorProfile(@GetUser() user: UserForTokenDto) {
        try {
            this.logger.debug('Getting vendor profile for user: ', user.id);
            return this.usersService.getVendorProfile(user.id);
        } catch (error) {
            this.logger.error('Error getting vendor profile', error);
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException(
                'Error getting vendor profile',
            );
        }
    }

    @Put('vendor')
    @HttpCode(HttpStatus.OK)
    @UseGuards(VendorProfileGuard)
    @UseInterceptors(FileInterceptor('businessPfp'))
    @ApiOkResponse({
        description: 'Vendor profile updated',
        type: VendorProfileResponseDto,
        example: {
            id: 'cmkzwivmb00000w7we900lgzt',
            status: 'APPROVED',
            isOnBoarded: false,
            businessName: 'Yashraj Indus',
            contactEmail: 'yash@gmail.com',
            contactPhone: '+47 31232103',
            city: 'Pune',
            businessPfp:
                'https://avatars.githubusercontent.com/u/126189199?s=400&u=c492e677ab2e77f53777f0e6e2d23429cd6aeb25&v=4',
        },
    })
    @ApiBadRequestResponse({
        description: 'Bad request',
        example: {
            statusCode: 400,
            timestamp: '2026-02-05T22:50:11.677Z',
            path: '/api/users/vendor',
            message: {
                message: ['property bussinesName should not exist'],
                error: 'Bad Request',
                statusCode: 400,
            },
        },
    })
    @ApiUnauthorizedResponse({
        description: 'Unauthorized',
        example: {
            statusCode: 403,
            timestamp: '2026-02-05T22:46:18.685Z',
            path: '/api/users/vendor',
            message: {
                message: 'Switch to Vendor Mode to access this endpoint',
                error: 'Forbidden',
                statusCode: 403,
            },
        },
    })
    @ApiInternalServerErrorResponse({
        description: 'Internal server error',
        example: {
            statusCode: 500,
            timestamp: '2026-02-05T22:40:19.741Z',
            path: '/api/users/vendor',
            message: {
                message: 'Error updating vendor profile',
                error: 'Internal Server Error',
                statusCode: 500,
            },
        },
    })
    async updateVendorProfile(
        @GetUser() user: UserForTokenDto,
        @Body() dto: UpdateVendorProfiletDto,
        @UploadedFile() file?: Express.Multer.File,
    ): Promise<VendorProfileResponseDto> {
        try {
            this.logger.debug('Updating vendor profile for user: ', user.id);
            if (file) {
                dto.businessPfp = file;
            }
            return this.usersService.updateVendorProfile(user.id, dto);
        } catch (error) {
            this.logger.error('Error updating vendor profile', error);
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException(
                'Error updating vendor profile',
            );
        }
    }

    @Patch(':type')
    @HttpCode(HttpStatus.OK)
    @ApiParam({
        name: 'type',
        description: 'Change User Type',
        required: true,
        example: UserType,
    })
    @ApiOkResponse({
        description: 'Status updated',
        example: {
            succes: true,
            message: 'Status updated',
        },
    })
    @ApiUnauthorizedResponse({
        description: 'Unauthorized',
        example: {
            statusCode: 401,
            timestamp: '2026-02-05T21:19:16.577Z',
            path: '/api/users/HOST',
            message: {
                message: 'Unauthorized',
                statusCode: 401,
            },
        },
    })
    @ApiInternalServerErrorResponse({ description: 'Internal server error' })
    @ApiBadRequestResponse({
        description: 'Bad request',
        example: {
            succes: false,
            message:
                'Invalid user type, valid types are HOST, ATTENDEE, VENDOR',
        },
    })
    async updateType(
        @GetUser() user: UserForTokenDto,
        @Param('type') type: UserType,
    ): Promise<{ succes: boolean; message: string }> {
        try {
            this.logger.debug('Updating status for user: ', user.id);
            return this.usersService.updateType(user.id, user.userType, type);
        } catch (error) {
            this.logger.error('Error updating status', error);
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('Error updating status');
        }
    }
}
