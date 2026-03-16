import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EventCategory, EventType } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
    IsDate,
    IsDateString,
    IsEnum,
    IsInt,
    IsOptional,
    IsString,
    Max,
    MaxLength,
    Min,
    MinLength,
} from 'class-validator';

export class CreateEventDto {
    @ApiProperty({
        example: 'My Event',
        description: 'Event title',
        required: true,
    })
    @IsString({ message: 'Title is required' })
    @MinLength(3, { message: 'Title must be at least 3 characters' })
    @MaxLength(100, { message: 'Title cannot exceed 100 characters' })
    @Transform(({ value }) => value.trim())
    title: string;

    @ApiProperty({
        example: 'This is my event',
        description: 'Event description',
        required: true,
    })
    @IsString({ message: 'Description is required' })
    @MinLength(3, { message: 'Description must be at least 3 characters' })
    @MaxLength(1000, { message: 'Description cannot exceed 1000 characters' })
    @Transform(({ value }) => value.trim())
    description: string;

    @ApiProperty({
        enum: EventCategory,
        examples: [
            { value: EventCategory.ART },
            { value: EventCategory.MUSIC },
            { value: EventCategory.BUSINESS },
            { value: EventCategory.FOOD },
            { value: EventCategory.WORKSHOP },
            { value: EventCategory.OTHER },
        ],
        description: 'Event category',
        required: true,
    })
    @IsEnum(EventCategory)
    category: EventCategory;

    @ApiPropertyOptional({
        example: '2026-09-01 18:36:00',
        description: 'Event date',
    })
    @IsOptional()
    @IsDate({ message: 'Date input is invalid' })
    @Transform(({ value }) => new Date(value))
    startTime?: Date;

    @ApiPropertyOptional({
        example: '2026-09-01 23:36:00',
        description: 'Event date',
    })
    @IsOptional()
    @IsDate({ message: 'Date input is invalid' })
    @Transform(({ value }) => new Date(value))
    endTime?: Date;

    @ApiPropertyOptional({
        description: 'Capacity of the event',
        example: '100',
    })
    @IsOptional()
    @IsInt({ message: 'Capacity must be a number' })
    @Transform(({ value }) => parseInt(value))
    capacity?: number;

    @ApiPropertyOptional({
        description: 'Booking ID of the space that the host has booked',
        example: '123e4567-e89b-12d3-a456-426655440000',
    })
    @IsOptional()
    @IsString({ message: 'Booking ID input is invalid' })
    @Transform(({ value }) => value.trim())
    bookingId?: string;

    @ApiPropertyOptional({
        enum: EventType,
        description: 'Event type',
    })
    @IsOptional()
    @IsEnum(EventType)
    eventType?: EventType;

    @ApiPropertyOptional({
        description: 'Price of the event ticket',
        example: '100',
    })
    @IsOptional()
    @IsInt({ message: 'Price must be a number' })
    @Transform(({ value }) => parseInt(value))
    price?: number;

    @ApiPropertyOptional({
        description: 'Price of the event ticket',
        example: '100',
    })
    @IsOptional()
    @IsInt({ message: 'Price must be a number' })
    @Transform(({ value }) => parseInt(value))
    @Max(100, { message: 'Discount cannot exceed 100%' })
    @Min(0, { message: 'Discount cannot be negative' })
    studentDiscount?: number;

    @ApiPropertyOptional({
        description: 'Cover Image for the event',
        type: 'file',
    })
    @IsOptional()
    coverImg?: Express.Multer.File;
}
