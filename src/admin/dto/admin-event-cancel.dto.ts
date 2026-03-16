import { ApiProperty } from '@nestjs/swagger';
import { EventStatus } from '@prisma/client';
import { Expose } from 'class-transformer';
import { IsBoolean, IsString, MaxLength, MinLength } from 'class-validator';

export class AdminEventCancelDto {
    @ApiProperty({
        description: 'Reason for cancellation of the event',
        example: 'Safety concern reported',
        required: true,
        minLength: 3,
        maxLength: 300,
        type: String,
    })
    @IsString({ message: 'Reason must be a string' })
    @MinLength(3, { message: 'Reason must be at least 3 characters' })
    @MaxLength(300, { message: 'Reason cannot exceed 300 characters' })
    reason: string;
}

export class AdminEventCancelResponseDto {
    @ApiProperty({
        description: 'Event ID',
        example: 'clblock123',
        required: true,
        type: String,
    })
    @Expose()
    eventId: string;

    @ApiProperty({
        description: 'Event status',
        example: 'CANCELLED',
        required: true,
        enum: EventStatus,
    })
    @Expose()
    status: EventStatus;
}
