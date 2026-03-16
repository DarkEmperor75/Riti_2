import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
    IsOptional,
    IsString,
    IsObject,
    MinLength,
    MaxLength,
    Matches,
    IsBoolean,
} from 'class-validator';

export class UpdateAttendeeProfileDto {
    @ApiPropertyOptional({
        example: 'Frontend dev, coffee lover, conference addict ☕️',
    })
    @IsOptional()
    @IsString()
    @MinLength(5, { message: 'Bio must be at least 5 characters long' })
    @MaxLength(200, { message: 'Bio must be at most 200 characters long' })
    @Transform(({ value }) => value?.trim())
    bio?: string;

    @ApiPropertyOptional({ example: 'true' })
    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => value === Boolean(value))
    isStudent?: boolean;

    @ApiPropertyOptional({
        description: 'Arbitrary attendee preferences stored as JSON',
        example: {
            interestedTopics: ['clubs', 'music', 'lectures'],
            mode: 'online',
        },
    })
    @IsOptional()
    @IsObject()
    preferences?: Record<string, any>;

    @ApiPropertyOptional({ example: '+47 8912 1221' })
    @IsOptional()
    @IsString({ message: 'Phone number should be proper' })
    @MinLength(3, { message: 'Phone number must be at least 3 characters' })
    @MaxLength(15, { message: 'Phone number cannot exceed 12 characters' })
    @Matches(/^\+?(45|46|47)\s?\d{6,10}$/)
    @Transform(({ value }) => value.trim())
    phoneNumber?: string;
}
