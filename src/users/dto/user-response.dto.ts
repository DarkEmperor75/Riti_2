import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    UserType,
    UserStatus,
    AllowedCountries,
    Language,
} from '@prisma/client';
import { Expose } from 'class-transformer';

export class UserProfileResponseDto {
    @ApiProperty({ example: '123e4567-e89b-12d3-a456-426655440000' })
    @Expose()
    id: string;

    @ApiProperty({ example: 'john@example.com' })
    @Expose()
    email: string;

    @ApiProperty({ example: 'John Doe' })
    @Expose()
    fullName: string;

    @ApiPropertyOptional({
        example: 'https://cdn.example.com/avatar.png',
    })
    @Expose()
    profilePicture?: string;

    @ApiProperty({
        enum: AllowedCountries,
        example: AllowedCountries.NO,
    })
    @Expose()
    country?: AllowedCountries;

    @ApiProperty({
        enum: Language,
        example: Language.EN,
    })
    @Expose()
    language: Language;

    @ApiPropertyOptional({ example: 'Oslo' })
    @Expose()
    city?: string;

    @ApiProperty({
        enum: UserType,
        example: UserType.ATTENDEE,
    })
    @Expose()
    userType: UserType;

    @ApiProperty({
        enum: UserStatus,
        example: UserStatus.ACTIVE,
    })
    @Expose()
    status: UserStatus;

    @ApiProperty({ example: false })
    @Expose()
    isAdmin: boolean;

    @ApiProperty({ example: false })
    @Expose()
    suspended: boolean;

    @ApiProperty({ example: 'Reason for suspension' })
    @Expose()
    suspendedReason?: string;

    @ApiProperty({ example: true })
    @Expose()
    hasAttendeeProfile: boolean;

    @ApiProperty({ example: false })
    @Expose()
    hasHostProfile: boolean;

    @ApiProperty({ example: false })
    @Expose()
    hasVendorProfile: boolean;

    @ApiProperty({ example: '2024-01-01T12:00:00.000Z' })
    @Expose()
    createdAt: Date;

    @ApiProperty({ example: '2024-01-10T15:30:00.000Z' })
    @Expose()
    updatedAt: Date;
}
