import { ApiPropertyOptional } from '@nestjs/swagger';
import { AllowedCountries, Language } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
    IsEmail,
    IsOptional,
    IsString,
    MinLength,
    MaxLength,
    IsEnum,
} from 'class-validator';

export class UpdateUserProfileDto {
    @ApiPropertyOptional({ example: 'John Doe' })
    @IsOptional()
    @IsString()
    @MinLength(2)
    @MaxLength(100)
    @Transform(({ value }) => value?.trim())
    fullName?: string;

    @ApiPropertyOptional({
        description: 'Current password (required if changing password)',
        example: 'oldPassword123',
    })
    @IsOptional()
    @IsString()
    @MinLength(8)
    password?: string;

    @ApiPropertyOptional({
        description: 'New password',
        example: 'newPassword123',
    })
    @IsOptional()
    @IsString()
    @MinLength(8)
    newPassword?: string;

    @ApiPropertyOptional({ enum: AllowedCountries, example: 'NO' })
    @IsOptional()
    @IsEnum(AllowedCountries)
    @Transform(({ value }) => value?.trim())
    country?: AllowedCountries;

    @ApiPropertyOptional({ enum: Language, example: 'EN' })
    @IsOptional()
    @IsEnum(Language)
    @Transform(({ value }) => value?.trim())
    language?: Language;

    @ApiPropertyOptional({ example: 'New York' })
    @IsOptional()
    @IsString()
    @Transform(({ value }) => value?.trim())
    city?: string;
}
