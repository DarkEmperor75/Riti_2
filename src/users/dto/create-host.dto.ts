import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
    IsOptional,
    IsString,
    IsUrl,
    Matches,
    MaxLength,
    MinLength,
} from 'class-validator';

export class CreateHostProfileDto {
    @ApiProperty({ example: 'Hello, I am Ola Nordmann' })
    @IsString({ message: 'Bio is required' })
    @MinLength(3, { message: 'Bio must be at least 3 characters' })
    @MaxLength(1500, { message: 'Bio cannot exceed 1500 characters' })
    @Transform(({ value }) => value.trim())
    bio: string;

    @ApiProperty({ example: '+47 8912 1221' })
    @IsString({ message: 'Phone number is required' })
    @MinLength(3, { message: 'Phone number must be at least 3 characters' })
    @MaxLength(15, { message: 'Phone number cannot exceed 12 characters' })
    @Matches(/^\+?(45|46|47|354|358)\s?\d{6,12}$/)
    @Transform(({ value }) => value.trim())
    phoneNumber: string;

    @ApiProperty({ example: 'Oslo' })
    @IsString({ message: 'City is required' })
    @MinLength(3, { message: 'City must be at least 3 characters' })
    @MaxLength(100, { message: 'City cannot exceed 100 characters' })
    @Transform(({ value }) => value.trim())
    city: string;

    @IsOptional()
    @ApiProperty({ description: 'Profile picture of the host', type: 'file', required: false })
    profilePicture?: Express.Multer.File;

    @IsOptional()
    @ApiProperty({ example: 'https://www.example.com', required: false })
    @IsUrl()
    @Transform(({ value }) => value.trim())
    website?: string;

    @ApiProperty({ example: 'https://instagram.com/johndoe', required: false })
    @IsOptional()
    @IsUrl()
    @Transform(({ value }) => value.trim())
    instagramUrl?: string;

    @ApiProperty({ example: 'https://tiktok.com/johndoe', required: false })
    @IsOptional()
    @IsUrl()
    @Transform(({ value }) => value.trim())
    tikTokUrl?: string;

    @ApiProperty({ example: 'https://x.com/johndoe', required: false })
    @IsOptional()
    @IsUrl()
    @Transform(({ value }) => value.trim())
    twitterUrl?: string;

    @ApiProperty({ example: 'https://xyz.com/johndoe', required: false })
    @IsOptional()
    @IsUrl()
    @Transform(({ value }) => value.trim())
    otherSocialLinks?: string;
}
