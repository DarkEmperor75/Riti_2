import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsEmail, IsString, Matches, MaxLength, MinLength } from "class-validator";

export class ResetPasswordDto {
    @ApiProperty({ example: 'johndoe@example' })
    @IsEmail({}, { message: 'Email must be valid' })
    @Transform(({ value }) => value.toLowerCase().trim())
    email: string
    
    @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
    @IsString({ message: 'Token is required' })
    @MinLength(1, { message: 'Token cannot be empty' })
    token: string;

    @ApiProperty({
        example: 'StrongPass123!',
        description: 'Password (min 8 chars)',
    })
    @IsString()
    @MinLength(8, { message: 'Password must be at least 8 characters' })
    @MaxLength(100, { message: 'Password cannot exceed 100 characters' })
    @Matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
        {
            message:
                'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character',
        },
    )
    password: string;
}