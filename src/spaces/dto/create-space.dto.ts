import {
    IsString,
    IsNumber,
    IsInt,
    Min,
    IsOptional,
    IsEnum,
    IsArray,
    ArrayMinSize,
    ArrayMaxSize,
    IsPositive,
    Length,
    MaxLength,
    MinLength,
    IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SpaceAmenities, SpaceStatus, SpaceType } from '@prisma/client';
import { Transform, Type } from 'class-transformer';

export class CreateSpaceDto {
    @ApiProperty({
        description: 'Space name',
        example: 'Cozy Yoga Studio in Oslo',
        minLength: 3,
        maxLength: 100,
    })
    @IsString({ message: 'Name must be a string' })
    @Length(3, 100, {
        message: 'Name must be between 3 and 100 characters',
    })
    name: string;

    @ApiPropertyOptional({
        description: 'Detailed description of the space',
        example:
            'Perfect for yoga classes, workshops, and small gatherings. Natural light, wooden floors, sound system included.',
        maxLength: 2000,
    })
    @IsString({ message: 'Description must be a string' })
    @MinLength(5, {
        message: 'Description must be at least 5 characters',
    })
    @MaxLength(2000, {
        message: 'Description cannot exceed 2000 characters',
    })
    description: string;

    @ApiProperty({
        description: 'Maximum number of people the space can hold',
        example: 20,
        minimum: 1,
    })
    @IsInt({ message: 'Capacity must be an integer' })
    @Min(1, { message: 'Capacity must be at least 1' })
    @Type(() => Number)
    capacity: number;

    @ApiProperty({
        description: 'Full address with map pin coordinates if available',
        example: 'Storgata 1, 0155 Oslo, Norway',
    })
    @IsString({ message: 'Address must be a string' })
    @Length(5, 600, {
        message: 'Address must be between 5 and 600 characters',
    })
    address: string;

    @ApiProperty({
        description: 'Location of the space',
        example: 'Oslo, Norway',
    })
    @IsString({ message: 'Location must be a string' })
    @Length(5, 700, {
        message: 'Location must be between 5 and 700 characters',
    })
    location: string;

    @ApiProperty({
        description: 'Type of space',
        enum: SpaceType,
        example: SpaceType.YOGA_STUDIO,
    })
    @IsEnum(SpaceType, {
        message:
            'Invalid space type. Must be one of: ' +
            Object.keys(SpaceType).join(', '),
    })
    spaceType: SpaceType;

    @ApiPropertyOptional({
        description: 'House rules (max 10)',
        type: [String],
        example: ['No smoking', 'No food/drink', 'Clean before leaving'],
    })
    @IsOptional()
    @Transform(({ value }) => {
        if (typeof value === 'string') {
            return value
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean);
        }
        return value;
    })
    @IsArray({ message: 'Rules must be an array' })
    @IsString({ each: true })
    @ArrayMinSize(1)
    @ArrayMaxSize(10)
    rules?: string[];

    @ApiProperty({
        description: 'Amenities of the space',
        enum: SpaceAmenities,
        enumName: 'SpaceAmenities',
        type: [SpaceAmenities],
        example: [SpaceAmenities.WIFI, SpaceAmenities.PARKING],
    })
    @Transform(({ value }) => {
        if (typeof value === 'string') {
            return value
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean);
        }
        return value;
    })
    @IsArray({ message: 'Amenities must be an array' })
    @ArrayMinSize(1)
    @IsEnum(SpaceAmenities, {
        each: true,
        message:
            'Invalid amenity. Must be one of: ' +
            Object.keys(SpaceAmenities).join(', '),
    })
    amenities: SpaceAmenities[];

    @ApiProperty({
        description: 'Price per hour in EUR',
        example: 250.0,
        minimum: 0.1,
    })
    @Type(() => Number)
    @IsNumber({}, { message: 'Price must be a number' })
    @IsPositive({ message: 'Price must be greater than 0' })
    pricePerHour: number;

    @ApiPropertyOptional({
        description: 'Minimum booking duration in hours',
        example: 2,
        minimum: 1,
    })
    @Type(() => Number)
    @IsInt({ message: 'Must be an integer' })
    @Min(1, { message: 'Minimum booking duration must be at least 1 hour' })
    @IsOptional()
    minBookingDurationHours?: number;

    @ApiPropertyOptional({
        description: 'Minimum lead time required before booking start (hours)',
        example: 24,
        minimum: 0,
    })
    @Type(() => Number)
    @IsInt({ message: 'Must be an integer' })
    @Min(0, { message: 'Lead time cannot be negative' })
    @IsOptional()
    minLeadTimeHours?: number;

    @ApiPropertyOptional({
        description: 'Allow bookings spanning multiple days',
        example: true,
    })
    @IsBoolean({ message: 'Must be a boolean' })
    @IsOptional()
    multiDayBookingAllowed?: boolean;

    @ApiProperty({
        description: 'Type of space',
        enum: SpaceStatus,
        example: 'ACTIVE',
    })
    @IsOptional()
    @IsEnum(SpaceStatus, {
        message: 'Invalid space status',
    })
    status?: SpaceStatus;
}
