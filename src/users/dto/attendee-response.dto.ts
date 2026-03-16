import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserType } from '@prisma/client';
import { Expose } from 'class-transformer';

export class AttendeeResponseDto {
    @ApiProperty({ example: '123e4567-e89b-12d3-a456-426655440000' })
    @Expose()
    id: string;

    @ApiProperty({ example: 'john@example.com' })
    @Expose()
    email: string;

    @ApiProperty({ example: 'John Doe' })
    @Expose()
    fullName: string;

    @ApiProperty({ example: 'Hello, I am Ola Nordmann' })
    @Expose()
    bio?: string;

    @ApiProperty({ example: '+47 8912 1221' })
    @Expose()
    phoneNumber?: String;

    @ApiProperty({ example: '{ "key": "value" }' })
    @Expose()
    preferences?: Record<string, any> | any;

    @ApiPropertyOptional({ example: 'https://www.example.com' })
    @Expose()
    profilePicture: string | null;

    @ApiProperty({ example: 'Oslo' })
    @Expose()
    city: string;

    @ApiProperty({ enum: UserType })
    @Expose()
    userType: UserType;

    @ApiProperty({ example: 'true' })
    @Expose()
    isStudent?: boolean;
}
