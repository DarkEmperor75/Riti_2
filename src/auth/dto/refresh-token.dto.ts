import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class RefreshTokenDto {
    @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
    @IsString({ message: 'Refresh token is required' })
    @MinLength(1, { message: 'Refresh token cannot be empty' })
    refreshToken: string;
}
