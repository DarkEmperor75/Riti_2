import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { AllowedCountries, Language, UserStatus, UserType } from '@prisma/client';

export class UserResponseDto {
    @ApiProperty({ example: '123e4567-e89b-12d3-a456-426655440000' })
    @Expose()
    id: string;

    @ApiProperty({ example: 'john@example.com' })
    @Expose()
    email: string;

    @ApiProperty({ example: 'John Doe' })
    @Expose()
    fullName: string;

    @ApiProperty({ enum: UserType })
    @Expose()
    userType: UserType;

    @ApiProperty({ enum: UserStatus })
    @Expose()
    status: UserStatus;

    @ApiProperty({ example: 'Oslo' })
    @Expose()
    city?: string | null;

    @ApiProperty({ example: 'https://www.example.com' })
    @Expose()
    profilePicture?: string | null;

    @ApiProperty({ enum: Language })
    @Expose()
    language?: string | null;

    @ApiProperty({ enum: AllowedCountries })
    @Expose()
    country: AllowedCountries;
}

export class AuthResponseDto {
    @ApiProperty()
    @Expose()
    accessToken: string;

    @ApiProperty()
    @Expose()
    refreshToken: string;

    @ApiProperty({ type: UserResponseDto })
    @Expose()
    user: UserResponseDto;
}
