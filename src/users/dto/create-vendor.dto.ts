import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
    IsEmail,
    IsOptional,
    IsString,
    IsUrl,
    Matches,
    MaxLength,
    MinLength,
} from 'class-validator';

export class CreateVendorProfileDto {
    @ApiProperty({ example: 'Equinor', required: false })
    @IsOptional()
    @IsString({ message: 'Display name is required' })
    @MinLength(3, { message: 'Display name must be at least 3 characters' })
    @MaxLength(100, { message: 'Display name cannot exceed 100 characters' })
    @Transform(({ value }) => value.trim())
    businessName?: string;

    @ApiProperty({ example: '+47 8912 1221' })
    @IsString({ message: 'Phone number is required' })
    @MinLength(3, { message: 'Phone number must be at least 3 characters' })
    @MaxLength(15, { message: 'Phone number cannot exceed 12 characters' })
    @Matches(/^\+?(45|46|47)\s?\d{6,10}$/)
    @Transform(({ value }) => value.trim())
    contactPhone: string;

    @ApiProperty({ example: 'johndoe@example', required: false })
    @IsOptional()
    @IsEmail({}, { message: 'Email must be valid' })
    @Transform(({ value }) => value.toLowerCase().trim())
    contactEmail?: string;

    @ApiProperty({ example: 'This is a description', required: false })
    @IsOptional()
    @IsString({ message: 'Description is required' })
    @MinLength(3, { message: 'Description must be at least 3 characters' })
    @MaxLength(1000, { message: 'Description cannot exceed 1000 characters' })
    @Transform(({ value }) => value.trim())
    description?: string;

    @ApiProperty({ example: 'Oslo' })
    @IsString({ message: 'City is required' })
    @MinLength(3, { message: 'City must be at least 3 characters' })
    @MaxLength(100, { message: 'City cannot exceed 100 characters' })
    @Transform(({ value }) => value.trim())
    city: string;

    @IsOptional()
    @ApiProperty({ description: 'Business profile picture of the vendor', type: 'file', required: false })
    businessPfp?: Express.Multer.File;
}
