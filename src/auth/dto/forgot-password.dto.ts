import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsEmail } from "class-validator";

export class ForgotPasswordDto {
    @ApiProperty({ example: 'john@example.com' })
    @IsEmail({}, { message: 'Email must be valid' })
    @Transform(({ value }) => value.toLowerCase().trim())
    email: string;
}