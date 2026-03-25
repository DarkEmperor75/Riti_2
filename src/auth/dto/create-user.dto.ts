import { ApiProperty } from '@nestjs/swagger';
import { AllowedCountries, InitialIntent } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
    IsBoolean,
    IsEmail,
    IsEnum,
    IsString,
    Matches,
    MaxLength,
    MinLength,
} from 'class-validator';

export class CreateUserDto {
    @ApiProperty({ example: 'John Doe', description: 'Full name of the user' })
    @IsString()
    @MinLength(3, { message: 'Full name must be at least 3 characters' })
    @MaxLength(100, { message: 'Full name cannot exceed 100 characters' })
    @Transform(({ value }) => value.trim())
    fullName: string;

    @ApiProperty({ example: 'john@example.com', description: 'Email address' })
    @IsEmail({}, { message: 'Email must be valid' })
    @Transform(({ value }) => value.toLowerCase().trim())
    email: string;

    @ApiProperty({
        example: 'StrongPass123!',
        description: 'Password (min 8 chars)',
    })
    @IsString()
    @MinLength(8, { message: 'Password must be at least 8 characters' })
    @MaxLength(100, { message: 'Password cannot exceed 100 characters' })
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d\s])[^\s]+$/, {
        message:
            'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character',
    })
    password: string;

    @ApiProperty({ example: 'StrongPass123!', description: 'Confirm password' })
    @IsString()
    confirmPassword: string;

    @ApiProperty({
        enumName: 'InitialIntent',
        enum: InitialIntent,
        example: InitialIntent.ATTEND,
    })
    @IsEnum(InitialIntent, {
        message: 'Invalid Initial intent',
    })
    initialIntent: InitialIntent;

    @ApiProperty({
        example: AllowedCountries.NO,
        enum: AllowedCountries,
        description: 'Country code (NO, SE, DK)',
    })
    @IsEnum(AllowedCountries, {
        message: 'Only Norway, Sweden, Finland, Iceland and Denmark allowed',
    })
    country: AllowedCountries;

    @ApiProperty({
        example: true,
        description: 'User must accept terms and conditions',
    })
    @IsBoolean({
        message: 'Terms and conditions must be accepted to register',
    })
    termsAccepted: boolean;
}
