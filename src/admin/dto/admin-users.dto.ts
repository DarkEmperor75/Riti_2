import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    AllowedCountries,
    HostStatus,
    InitialIntent,
    Language,
    UserStatus,
    UserType,
    VendorStatus,
} from '@prisma/client';
import { Expose, Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class AdminUserListItemDto {
    @ApiProperty({ example: 'cqwi2819ubheqwy012' })
    @Expose()
    id: string;

    @ApiProperty({ example: 'yash@gmail.com' })
    @Expose()
    email: string;

    @ApiProperty({ example: 'Yash Singh' })
    @Expose()
    fullName: string;

    @ApiProperty({
        enumName: 'UserType',
        enum: UserType,
        example: UserType.HOST,
    })
    @Expose()
    userType: UserType;

    @ApiProperty({ example: UserStatus.ACTIVE, enum: UserStatus })
    @Expose()
    status: UserStatus;

    @ApiProperty({ example: false })
    @Expose()
    isAdmin: boolean;

    @ApiProperty({ default: new Date() })
    @Expose()
    createdAt: Date;

    @ApiProperty({ example: VendorStatus.APPROVED, enum: VendorStatus })
    @Expose()
    vendorStatus?: VendorStatus;

    @ApiProperty({ example: HostStatus.ACTIVE, enum: HostStatus })
    @Expose()
    hostingStatus?: HostStatus;

    @ApiProperty({ example: 12 })
    @Expose()
    spacesCount: number;

    @ApiProperty({ example: 21 })
    @Expose()
    eventsCount: number;

    @ApiProperty({ example: 12 })
    @Expose()
    bookingsCount: number;

    @ApiProperty({ example: 21 })
    @Expose()
    ticketsCount: number;

    @ApiProperty({ example: 'Oslo' })
    @Expose()
    city: string;
}

export class AdminUsersListResponseDto {
    users: AdminUserListItemDto[];
    meta: { page: number; limit: number; total: number; totalPages: number };
}

export class AdminUsersQueryDto {
    @ApiPropertyOptional({ example: UserType.VENDOR, enum: UserType })
    @IsOptional()
    @IsEnum(UserType)
    userType?: UserType;

    @ApiPropertyOptional({ example: UserStatus.ACTIVE, enum: UserStatus })
    @IsOptional()
    @IsEnum(UserStatus)
    status?: UserStatus;

    @ApiPropertyOptional({ example: 'yash@gmail.com' })
    @IsOptional()
    @IsString()
    email?: string;

    @ApiPropertyOptional({ example: 1 })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Type(() => Number)
    page = 1;

    @ApiPropertyOptional({ example: 20 })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(100)
    @Type(() => Number)
    limit = 50;
}

export class AdminUserDetailResponseDto {
    @Expose() id: string;
    @Expose() email: string;
    @Expose() fullName: string;
    @Expose() profilePicture?: string;
    @Expose() country: AllowedCountries;
    @Expose() language: Language;
    @Expose() city?: string;
    @Expose() termsAccepted: boolean;
    @Expose() initialIntent: InitialIntent;
    @Expose() userType: UserType;
    @Expose() status: UserStatus;
    @Expose() isAdmin: boolean;
    @Expose() createdAt: Date;
    @Expose() updatedAt: Date;

    @Expose() attendee?: {
        bio?: string;
        phoneNumber?: string;
        isStudent: boolean;
        stripeAccountId?: string;
        stripeOnboarded: boolean;
        stripeVerified: boolean;
    };

    @Expose() host?: {
        bio: string;
        phoneNumber: string;
        website?: string;
        instagramUrl?: string;
        tikTokUrl?: string;
        twitterUrl?: string;
        otherSocialLinks?: string;
        stripeAccountId?: string;
        stripeOnboarded: boolean;
        stripeVerified: boolean;
        hostingStatus: HostStatus;
        suspendedAt?: Date;
        suspensionReason?: string;
    };

    @Expose() vendor?: {
        isOnBoarded: boolean;
        vendorStatus: VendorStatus;
        businessName: string;
        contactPhone: string;
        contactEmail: string;
        businessPfp?: string;
        stripeAccountId?: string;
        stripeOnboarded: boolean;
        stripeVerified: boolean;
        approvedAt?: Date;
        approvedBy?: string;
        rejectionReason?: string;
        suspendedAt?: Date;
        suspensionReason?: string;
    };

    @Expose() spacesCount: number;
    @Expose() eventsCount: number;
    @Expose() bookingsCount: number;
    @Expose() ticketsCount: number;
    @Expose() sessionsCount: number;
}
