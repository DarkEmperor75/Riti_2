import { ApiProperty } from '@nestjs/swagger';
import { HostStatus } from '@prisma/client';
import { Expose } from 'class-transformer';

export class HostProfileResponseDto {
    @ApiProperty({ example: '123e4567-e89b-12d3-a456-426655440000' })
    @Expose()
    id: string;

    @ApiProperty({ enum: HostStatus })
    @Expose()
    status: HostStatus;

    @ApiProperty({ example: 'Ola Nordmann' })
    @Expose()
    fullName: string;

    @ApiProperty({ example: 'Hello, I am Ola Nordmann' })
    @Expose()
    bio: string;

    @ApiProperty({ example: '+47 8912 1221' })
    @Expose()
    phoneNumber: string;

    @ApiProperty({ example: 'Oslo' })
    @Expose()
    city: string;

    @ApiProperty({ example: 'https://www.example.com' })
    @Expose()
    profilePicture?: string;

    @ApiProperty({ example: 'https://www.example.com' })
    @Expose()
    website?: string;

    @ApiProperty({ example: 'https://instagram.com/johndoe' })
    @Expose()
    instagramUrl?: string;

    @ApiProperty({ example: 'https://tiktok.com/johndoe' })
    @Expose()
    tikTokUrl?: string;

    @ApiProperty({ example: 'https://x.com/johndoe' })
    @Expose()
    twitterUrl?: string;

    @ApiProperty({ example: 'https://xyz.com/johndoe' })
    @Expose()
    otherSocialLinks?: string;
}
