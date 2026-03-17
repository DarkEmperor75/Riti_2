import {
    BadRequestException,
    HttpException,
    Injectable,
    InternalServerErrorException,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
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
    Attendee,
    Host,
    Prisma,
    User,
    UserStatus,
    UserType,
    Vendor,
    VendorStatus,
} from '@prisma/client';
import { StorageService } from 'src/common/services';
import { PfpUploadResponse, PfpDeleteResponse } from '../interfaces';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
    private readonly logger = new Logger(UsersService.name);

    constructor(
        private prisma: DatabaseService,
        private storageService: StorageService,
    ) {}

    async uploadUserPfp(
        file: Express.Multer.File,
        userId: string,
    ): Promise<PfpUploadResponse> {
        const existingUser = this.findUserById(userId);
        if (!existingUser) throw new NotFoundException('User not found');

        try {
            const profilePicture = await this.uploadProfilePicture(
                file,
                userId,
            );
            if (!profilePicture)
                return { success: false, message: 'Failed to upload image' };

            await this.prisma.user.update({
                where: { id: userId },
                data: { profilePicture },
            });

            return {
                success: true,
                message: 'Image uploaded successfully',
                profilePicture,
            };
        } catch (error) {
            this.logger.error('Error uploading image', error);
            return { success: false, message: 'Error uploading image' };
        }
    }

    async deleteUserPfp(userId: string): Promise<PfpDeleteResponse> {
        const existingUser = await this.findUserById(userId);
        if (!existingUser) throw new NotFoundException('User not found');
        if (!existingUser.profilePicture)
            throw new BadRequestException(
                'User does not have a profile picture',
            );
        const fileName = existingUser.profilePicture?.split('/').pop();
        if (!fileName)
            throw new BadRequestException(
                'User does not have a profile picture',
            );

        try {
            await this.deleteProfilePicture(fileName);
            await this.prisma.user.update({
                where: { id: userId },
                data: { profilePicture: null },
            });

            return { success: true, message: 'Image deleted successfully' };
        } catch (error) {
            this.logger.error('Error deleting image', error);
            return { success: false, message: 'Error deleting image' };
        }
    }

    async updateType(
        userId: string,
        currentType: UserType,
        type: UserType,
    ): Promise<{ succes: boolean; message: string }> {
        this.logger.debug('Updating status for user: ', userId);
        if (!Object.values(UserType).includes(type))
            return {
                succes: false,
                message: 'Invalid user type, valid types are HOST and ATTENDEE',
            };

        if (type === UserType.ADMIN)
            return { succes: false, message: 'Forbidden Request to be admin' };

        if (currentType === UserType.ADMIN)
            return { succes: false, message: 'Admins cannot switch modes' };

        if (currentType === UserType.VENDOR)
            return {
                succes: false,
                message: 'Once you opt for vendor mode you cannot switch back',
            };

        if (currentType === type)
            return {
                succes: false,
                message: `You are already in ${type} mode!`,
            };

        try {
            await this.prisma.user.update({
                where: { id: userId },
                data: { userType: type },
            });
        } catch (error) {
            this.logger.error('Error updating status', error);
            return { succes: false, message: 'Error updating status' };
        }

        return { succes: true, message: 'User mode updated successfully' };
    }

    async updateUserProfile(
        userId: string,
        dto: UpdateUserProfileDto,
    ): Promise<{ success: boolean; message: string }> {
        const existingUser = await this.findUserById(userId);
        if (!existingUser) throw new NotFoundException('User not found');

        const passwordHash: string | null = await this.createOrUpdatePassword(
            existingUser.hashedPassword,
            dto.password,
            dto.newPassword,
        );

        const updateUserProfile: Prisma.UserUpdateInput = {
            ...(dto.fullName !== undefined && {
                fullName: dto.fullName,
            }),
            ...(dto.city !== undefined && {
                city: dto.city,
            }),
            ...(dto.country !== undefined && {
                country: dto.country,
            }),
            ...(dto.language !== undefined && {
                language: dto.language,
            }),
            ...(passwordHash !== null && {
                hashedPassword: passwordHash,
            }),
        };

        try {
            await this.prisma.user.update({
                where: { id: userId },
                data: updateUserProfile,
            });

            return { success: true, message: 'Profile updated successfully' };
        } catch (error) {
            this.logger.error('Error updating profile', error);
            return { success: false, message: 'Error updating profile' };
        }
    }

    async getUserProfile(userId: string): Promise<UserProfileResponseDto> {
        try {
            this.logger.debug('Getting user profile for user: ', userId);
            const user = await this.findUserById(userId);
            return this.buildUserResponse(
                user,
                user.attendeeProfile ?? undefined,
                user.hostProfile ?? undefined,
                user.vendorProfile ?? undefined,
            );
        } catch (error) {
            this.logger.error('Error getting user profile', error);
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException(
                'Error getting user profile',
            );
        }
    }

    async getOrCreateAttendeeProfile(
        userId: string,
    ): Promise<AttendeeResponseDto> {
        try {
            this.logger.debug('Getting attendee profile for user', userId);
            const user = await this.findUserById(userId);
            if (!user) throw new NotFoundException('User not found');

            let attendee: Attendee;

            if (user.attendeeProfile) {
                attendee = user.attendeeProfile;
            } else {
                try {
                    attendee = await this.prisma.attendee.create({
                        data: {
                            userId: user.id,
                        },
                    });
                } catch (error) {
                    this.logger.error('Error creating attendee profile', error);
                    if (error instanceof HttpException) throw error;
                    throw new InternalServerErrorException(
                        'Error creating attendee profile',
                    );
                }
            }

            return this.buildAttendeeResponse(user, attendee);
        } catch (error) {
            this.logger.error('Error getting attendee profile', error);
            throw new InternalServerErrorException(
                'Could not get attendee profile',
            );
        }
    }

    async updateAttendeeProfile(
        userId: string,
        dto: UpdateAttendeeProfileDto,
    ): Promise<AttendeeResponseDto> {
        try {
            this.logger.debug(`Data in service: ${JSON.stringify(dto)}`);
            if (!dto) throw new BadRequestException('No data provided');
            this.logger.debug('Updating attendee profile for user', userId);
            const user = await this.findUserById(userId);
            if (!user) throw new NotFoundException('User not found');

            const attendee = await this.prisma.attendee.update({
                where: { userId },
                data: {
                    ...(dto.bio ? { bio: dto.bio } : {}),
                    ...(dto.preferences
                        ? { preferences: dto.preferences }
                        : {}),
                    ...(dto.isStudent !== undefined
                        ? { isStudent: dto.isStudent }
                        : {}),
                    ...(dto.phoneNumber
                        ? { phoneNumber: dto.phoneNumber }
                        : {}),
                },
            });

            return this.buildAttendeeResponse(user, attendee);
        } catch (error) {
            this.logger.error('Error updating attendee profile', error);
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException(
                'Could not update attendee profile',
            );
        }
    }

    async createHostProfile(
        userId: string,
        dto: CreateHostProfileDto,
    ): Promise<HostProfileResponseDto> {
        const existingHost = await this.findUserById(userId);
        if (existingHost.hostProfile)
            throw new BadRequestException('Host profile already exists');

        let profilePicture: string | undefined;
        if (dto.profilePicture) {
            profilePicture = await this.uploadProfilePicture(
                dto.profilePicture,
                userId,
            );
        } else {
            profilePicture = undefined;
        }

        try {
            this.logger.debug('Creating host profile for user: ', userId);
            const hostProfile = await this.prisma.user.update({
                where: { id: userId },
                data: {
                    profilePicture: profilePicture ? profilePicture : null,
                    city: dto.city ? dto.city : null,
                    userType: UserType.HOST,
                    hostProfile: {
                        create: {
                            bio: dto.bio,
                            phoneNumber: dto.phoneNumber,
                            website: dto.website ? dto.website : null,
                            instagramUrl: dto.instagramUrl
                                ? dto.instagramUrl
                                : null,
                            tikTokUrl: dto.tikTokUrl ? dto.tikTokUrl : null,
                            twitterUrl: dto.twitterUrl ? dto.twitterUrl : null,
                            otherSocialLinks: dto.otherSocialLinks
                                ? dto.otherSocialLinks
                                : null,
                        },
                    },
                },
                include: { hostProfile: true },
            });
            if (!hostProfile) throw new Error('Host profile not created');
            if (!hostProfile.hostProfile)
                throw new Error('Host profile not created');

            return this.buildHostUserResponse(
                hostProfile,
                hostProfile.hostProfile,
            );
        } catch (error) {
            this.logger.error('Error creating host profile', error);
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException(
                'Error creating host profile',
            );
        }
    }

    async getHostProfile(userId: string): Promise<HostProfileResponseDto> {
        try {
            this.logger.debug('Getting host profile for user: ', userId);
            const user = await this.findUserById(userId);
            if (!user.hostProfile)
                throw new NotFoundException('Host profile not found');
            return this.buildHostUserResponse(user, user.hostProfile);
        } catch (error) {
            this.logger.error('Error getting host profile', error);
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException(
                'Error getting host profile',
            );
        }
    }

    async updateHostProfile(
        userId: string,
        dto: UpdateHosProfiletDto,
    ): Promise<HostProfileResponseDto> {
        const existingHost = await this.findUserById(userId);
        if (!existingHost.hostProfile)
            throw new BadRequestException('Host profile does not exist');

        let profilePicture: string | undefined;
        if (dto.profilePicture) {
            profilePicture = await this.uploadProfilePicture(
                dto.profilePicture,
                userId,
            );
        } else {
            profilePicture = undefined;
        }

        try {
            this.logger.debug('Updating host profile for user: ', userId);
            const userUpdateData: Prisma.UserUpdateInput = {
                ...(dto.profilePicture !== undefined && {
                    profilePicture,
                }),
                ...(dto.city !== undefined && {
                    city: dto.city,
                }),
                hostProfile: {
                    update: {
                        ...(dto.bio !== undefined && {
                            bio: dto.bio,
                        }),
                        ...(dto.phoneNumber !== undefined && {
                            phoneNumber: dto.phoneNumber,
                        }),
                        ...(dto.website !== undefined && {
                            website: dto.website,
                        }),
                        ...(dto.instagramUrl !== undefined && {
                            instagramUrl: dto.instagramUrl,
                        }),
                        ...(dto.tikTokUrl !== undefined && {
                            tikTokUrl: dto.tikTokUrl,
                        }),
                        ...(dto.twitterUrl !== undefined && {
                            twitterUrl: dto.twitterUrl,
                        }),
                        ...(dto.otherSocialLinks !== undefined && {
                            otherSocialLinks: dto.otherSocialLinks,
                        }),
                    },
                },
                attendeeProfile: {
                    update: {
                        ...(dto.bio !== undefined && {
                            bio: dto.bio,
                        }),
                        ...(dto.phoneNumber !== undefined && {
                            phoneNumber: dto.phoneNumber,
                        }),
                    },
                },
            };

            const hostProfile = await this.prisma.user.update({
                where: { id: userId },
                data: userUpdateData,
                include: { hostProfile: true },
            });

            if (!hostProfile) throw new Error('Host profile not updated');
            if (!hostProfile.hostProfile)
                throw new Error('Host profile not updated');

            return this.buildHostUserResponse(
                hostProfile,
                hostProfile.hostProfile,
            );
        } catch (error) {
            this.logger.error('Error updating host profile', error);
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException(
                'Error updating host profile',
            );
        }
    }

    async createVendorProfile(
        userId: string,
        dto: CreateVendorProfileDto,
    ): Promise<VendorProfileResponseDto> {
        const existingVendor = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                fullName: true,
                email: true,
            },
        });

        if (!existingVendor)
            throw new BadRequestException('User does not exist');

        let businessPfp: string | undefined;
        if (dto.businessPfp) {
            businessPfp = await this.uploadProfilePicture(
                dto.businessPfp,
                userId,
            );
        } else {
            businessPfp = undefined;
        }

        try {
            this.logger.debug('Creating vendor profile for user: ', userId);
            const vendorProfile = await this.prisma.user.update({
                where: { id: userId },
                data: {
                    city: dto.city,
                    userType: UserType.VENDOR,
                    vendorProfile: {
                        create: {
                            businessName: dto.businessName
                                ? dto.businessName
                                : existingVendor.fullName,
                            contactEmail: dto.contactEmail
                                ? dto.contactEmail
                                : existingVendor.email,
                            contactPhone: dto.contactPhone,
                            ...(dto.description !== undefined && {
                                description: dto.description,
                            }),
                            businessPfp: businessPfp ? businessPfp : null,
                            isOnBoarded: true,
                        },
                    },
                },
                include: { vendorProfile: true },
            });
            if (!vendorProfile) throw new Error('Vendor profile not created');
            if (!vendorProfile.vendorProfile)
                throw new Error('Vendor profile not created');

            return this.buildVendorUserResponse(
                vendorProfile,
                vendorProfile.vendorProfile,
            );
        } catch (error) {
            this.logger.error('Error creating vendor profile', error);
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException(
                'Error creating vendor profile',
            );
        }
    }

    async getVendorProfile(userId: string): Promise<VendorProfileResponseDto> {
        try {
            this.logger.debug('Getting vendor profile for user: ', userId);
            const user = await this.findUserById(userId);
            if (!user.vendorProfile)
                throw new Error('Vendor profile not found');
            return this.buildVendorUserResponse(user, user.vendorProfile);
        } catch (error) {
            this.logger.error('Error getting vendor profile', error);
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException(
                'Error getting vendor profile',
            );
        }
    }

    async updateVendorProfile(
        userId: string,
        dto: UpdateVendorProfiletDto,
    ): Promise<VendorProfileResponseDto> {
        const existingVendor = await this.findUserById(userId);
        if (!existingVendor.vendorProfile)
            throw new BadRequestException('Vendor profile does not exist');

        let businessPfp: string | undefined;
        if (dto.businessPfp) {
            businessPfp = await this.uploadProfilePicture(
                dto.businessPfp,
                userId,
            );
        } else {
            businessPfp = undefined;
        }

        try {
            this.logger.debug('Updating vendor profile for user: ', userId);
            const userUpdateData: Prisma.UserUpdateInput = {
                ...(dto.businessPfp !== undefined && {
                    profilePicture: businessPfp,
                }),
                ...(dto.city !== undefined && {
                    city: dto.city,
                }),
                vendorProfile: {
                    update: {
                        ...(dto.businessName !== undefined && {
                            businessName: dto.businessName,
                        }),
                        ...(dto.contactEmail !== undefined && {
                            contactEmail: dto.contactEmail,
                        }),
                        ...(dto.contactPhone !== undefined && {
                            contactPhone: dto.contactPhone,
                        }),
                        ...(dto.businessPfp !== undefined && {
                            businessPfp,
                        }),
                    },
                },
            };

            const vendorProfile = await this.prisma.user.update({
                where: { id: userId },
                data: userUpdateData,
                include: { vendorProfile: true },
            });

            if (!vendorProfile) throw new Error('Vendor profile not updated');
            if (!vendorProfile.vendorProfile)
                throw new Error('Vendor profile not updated');

            return this.buildVendorUserResponse(
                vendorProfile,
                vendorProfile.vendorProfile,
            );
        } catch (error) {
            this.logger.error('Error updating vendor profile', error);
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException(
                'Error updating vendor profile',
            );
        }
    }

    private async uploadProfilePicture(
        file: Express.Multer.File,
        userId: string,
    ): Promise<string | undefined> {
        try {
            const { url } = await this.storageService.uploadImage(
                file,
                'profiles',
                userId,
            );
            return url;
        } catch (error) {
            this.logger.error('Error uploading image', error);
            return undefined;
        }
    }

    private async deleteProfilePicture(fileName: string): Promise<void> {
        try {
            this.logger.debug('Deleting profile picture', fileName);
            await this.storageService.deleteFile(fileName, 'profiles');
        } catch (error) {
            this.logger.error('Error deleting image', error);
        }
    }

    private async createOrUpdatePassword(
        existingPassword: string | null,
        oldPassword?: string,
        newPassword?: string,
    ): Promise<string | null> {
        if (!oldPassword && !newPassword) return null;
        let passWordHash: string | null;

        if (oldPassword && newPassword && !existingPassword) {
            throw new BadRequestException(
                'If no password is set, provide only the password field',
            );
        }

        if (oldPassword && newPassword && existingPassword) {
            const isPasswordValid = await bcrypt.compare(
                oldPassword,
                existingPassword,
            );

            if (!isPasswordValid)
                throw new BadRequestException('Invalid password');

            passWordHash = await bcrypt.hash(newPassword, 12);
        } else if (oldPassword && !newPassword && !existingPassword) {
            passWordHash = await bcrypt.hash(oldPassword, 12);
        } else if (oldPassword && !newPassword && existingPassword) {
            throw new BadRequestException(
                'You need to provide a new password to update your current password',
            );
        } else if (!oldPassword && newPassword) {
            throw new BadRequestException(
                'You need to provide your current password to update your password',
            );
        } else {
            passWordHash = null;
        }

        return passWordHash;
    }

    async findUserById(id: string) {
        try {
            const user = await this.prisma.user.findUnique({
                where: { id },
                include: {
                    hostProfile: true,
                    vendorProfile: true,
                    attendeeProfile: true,
                },
            });
            if (!user) throw new Error('User not found');
            return user;
        } catch (error) {
            this.logger.error('Error finding user', error);
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('Error finding user');
        }
    }

    private buildUserResponse(
        user: User,
        attendeeProfile?: Attendee,
        hostProfile?: Host,
        vendorProfile?: Vendor,
    ): UserProfileResponseDto {
        try {
            this.logger.debug('Building user profile response', user.id);

            return {
                id: user.id,
                email: user.email,
                fullName: user.fullName,

                profilePicture: user.profilePicture ?? undefined,
                country: user.country,
                language: user.language,
                city: user.city ?? undefined,

                userType: user.userType,
                status: user.status,
                isAdmin: user.isAdmin,

                hasAttendeeProfile: !!attendeeProfile,
                hasHostProfile: !!hostProfile,
                hasVendorProfile: !!vendorProfile,

                suspended: user.status === UserStatus.SUSPENDED,
                suspendedReason: user.suspensionReason ?? undefined,

                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            };
        } catch (error) {
            this.logger.error('Error building user profile response', error);
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException(
                'Error building user profile response',
            );
        }
    }

    private buildAttendeeResponse(
        user: User,
        attendee: Attendee,
    ): AttendeeResponseDto {
        try {
            return {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                ...(attendee.bio ? { bio: attendee.bio } : {}),
                ...(attendee.phoneNumber
                    ? { phoneNumber: attendee.phoneNumber }
                    : {}),
                ...(attendee.preferences
                    ? { preferences: attendee.preferences }
                    : {}),
                isStudent: attendee.isStudent,
                profilePicture: user.profilePicture,
                city: user.city!,
                userType: user.userType,
            };
        } catch (error) {
            this.logger.error('Error building attendee response', error);
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException(
                'Error building attendee response',
            );
        }
    }

    private buildHostUserResponse(
        user: User,
        host: Host,
    ): HostProfileResponseDto {
        try {
            this.logger.debug('Building host user response', host);
            return {
                id: user.id,
                status: host.hostingStatus,
                fullName: user.fullName,
                bio: host.bio,
                phoneNumber: host.phoneNumber,
                city: user.city!,
                profilePicture: user.profilePicture
                    ? user.profilePicture
                    : undefined,
                website: host.website ? host.website : undefined,
                instagramUrl: host.instagramUrl ? host.instagramUrl : undefined,
                tikTokUrl: host.tikTokUrl ? host.tikTokUrl : undefined,
                twitterUrl: host.twitterUrl ? host.twitterUrl : undefined,
                otherSocialLinks: host.otherSocialLinks
                    ? host.otherSocialLinks
                    : undefined,
            };
        } catch (error) {
            this.logger.error('Error building host user response', error);
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException(
                'Error building host user response',
            );
        }
    }

    private buildVendorUserResponse(
        user: User,
        vendor: Vendor,
    ): VendorProfileResponseDto {
        try {
            this.logger.debug('Building vendor user response', user);
            return {
                id: user.id,
                status: vendor.vendorStatus,
                isOnBoarded: vendor.isOnBoarded,
                businessName: vendor.businessName,
                contactEmail: vendor.contactEmail,
                contactPhone: vendor.contactPhone,
                ...(vendor.description
                    ? { description: vendor.description }
                    : undefined),
                city: user.city!,
            };
        } catch (error) {
            this.logger.error('Error building vendor user response', error);
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException(
                'Error building vendor user response',
            );
        }
    }
}
