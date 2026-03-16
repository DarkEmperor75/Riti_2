import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class LoginDto {
    @ApiProperty({ example: 'john@example.com' })
    @IsEmail({}, { message: 'Email must be valid' })
    @Transform(({ value }) => value?.toLowerCase().trim())
    email: string;

    @ApiProperty({ example: 'StrongPass123!' })
    @IsString({ message: 'Password is required' })
    @MinLength(1, { message: 'Password cannot be empty' })
    password: string;

    @ApiProperty({description: 'To store user agent', required: false})
    @IsOptional()
    @IsString()
    userAgent?: string;

    @ApiProperty({description: 'To store ip address', required: false})
    @IsOptional()
    @IsString()
    ipAddress?: string;
}
