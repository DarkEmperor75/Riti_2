import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SpaceAmenities, SpaceStatus, SpaceType } from '@prisma/client';
import { Expose, Transform, Type } from 'class-transformer';

export class SpaceResponseDto {
    @ApiProperty({
        example: 'clabc123xyz',
        description: 'Unique space ID',
    })
    @Expose()
    id: string;

    @ApiProperty({
        example: 'Cozy Yoga Studio in Oslo',
        description: 'Space name',
    })
    @Expose()
    name: string;

    @ApiProperty({
        example: 'Perfect for yoga classes and small workshops...',
        description: 'Detailed description',
    })
    @Expose()
    description: string;

    @ApiProperty({
        description: 'Amenities of the space',
        enum: SpaceAmenities,
        enumName: 'SpaceAmenities',
        type: [SpaceAmenities],
        example: [SpaceAmenities.WIFI, SpaceAmenities.PARKING],
    })
    @Expose()
    amenities: SpaceAmenities[];

    @ApiProperty({
        example: 20,
        description: 'Maximum capacity',
    })
    @Expose()
    capacity: number;

    @ApiProperty({
        example: 'Storgata 1, 0155 Oslo, Norway',
        description: 'Full address',
    })
    @Expose()
    address: string;

    @ApiProperty({
        example: 'YOGA_STUDIO',
        enum: SpaceType,
        description: 'Space type',
    })
    @Expose()
    spaceType: SpaceType;

    @ApiPropertyOptional({
        example: ['No smoking', 'Clean before leaving'],
        description: 'House rules',
    })
    @Expose()
    rules?: string[];

    @ApiProperty({
        example: 250.0,
        description: 'Price per hour (NOK)',
    })
    @Expose()
    @Transform(({ value }) => value?.toNumber?.() ?? value ?? 0)
    @Type(() => Number)
    pricePerHour: number;

    @ApiPropertyOptional({
        example: 2,
        description: 'Minimum booking duration (hours)',
    })
    @Expose()
    minBookingDurationHours?: number;

    @ApiPropertyOptional({
        example: 24,
        description: 'Minimum lead time (hours)',
    })
    @Expose()
    minLeadTimeHours?: number;

    @ApiPropertyOptional({
        example: true,
        description: 'Allow multi-day bookings',
    })
    @Expose()
    multiDayBookingAllowed?: boolean;

    @ApiPropertyOptional({
        example: 'Oslo',
        description: 'City for search/filtering',
    })
    @Expose()
    city?: string;

    @ApiProperty({
        example: 'Google maps location',
        description: 'Location for finding',
    })
    @Expose()
    location: string;

    @ApiProperty({
        example: 'UNDER_REVIEW',
        enum: SpaceStatus,
        description: 'Current status of the space listing',
    })
    @Expose()
    status: SpaceStatus;

    @ApiProperty({
        example: false,
        description: 'Admin suspension flag',
    })
    @Expose()
    isSuspended: boolean;

    @ApiProperty({
        example: ['https://storage.../img1.jpg', 'https://storage.../img2.jpg'],
        description: 'Array of image URLs',
    })
    @Expose()
    imageUrls: string[];

    @ApiPropertyOptional({
        example: ['https://storage.../rules.pdf'],
        description: 'Instruction PDFs',
    })
    @Expose()
    instructionsPdfsUrls?: string[];

    @ApiProperty({
        example: 'clvendor123',
        description: 'Vendor ID (owner)',
    })
    @Expose()
    vendorId: string;

    @ApiPropertyOptional({
        description: 'Admin review comments',
        example: 'Suspended due to fraudulent activity.',
    })
    @Expose()
    adminReason?: string;

    @ApiProperty({
        example: '2026-02-15T14:00:00Z',
        description: 'Created timestamp',
    })
    @Expose()
    createdAt: Date;

    @ApiProperty({
        example: '2026-02-15T14:00:00Z',
        description: 'Last updated timestamp',
    })
    @Expose()
    updatedAt: Date;
}

export class SpaceListResponseItemDto {
    @ApiProperty({
        example: 'clabc123xyz',
        description: 'Unique space ID',
    })
    @Expose()
    id: string;

    @ApiProperty({
        example: 'clabc123xyz',
        description: 'Unique vendor ID',
    })
    @Expose()
    vendorId: string;

    @ApiProperty({
        example: 'Cozy Yoga Studio in Oslo',
        description: 'Space name',
    })
    @Expose()
    name: string;

    @ApiProperty({
        example: 'Perfect for yoga classes and small workshops...',
        description: 'Detailed description',
    })
    @Expose()
    description: string;

    @ApiProperty({
        example: ['https://storage.../img1.jpg', 'https://storage.../img2.jpg'],
        description: 'Array of image URLs',
    })
    @Expose()
    images: string[];

    @ApiProperty({
        description: 'Amenities of the space',
        enum: SpaceAmenities,
        enumName: 'SpaceAmenities',
        type: [SpaceAmenities],
        example: [SpaceAmenities.WIFI, SpaceAmenities.PARKING],
    })
    @Expose()
    amenities: SpaceAmenities[];

    @ApiProperty({
        example: 250.0,
        description: 'Price per hour (NOK)',
    })
    @Expose()
    @Transform(({ value }) => value?.toNumber?.() ?? value ?? 0)
    @Type(() => Number)
    pricePerHour: number;

    @ApiProperty({
        example: 'YOGA_STUDIO',
        enum: SpaceType,
        description: 'Space type',
    })
    @Expose()
    spaceType: SpaceType;

    @ApiProperty({
        example: 'UNDER_REVIEW',
        enum: SpaceStatus,
        description: 'Current status of the space listing',
    })
    @Expose()
    status: SpaceStatus;

    @ApiProperty({
        example: 'Oslo',
        description: 'City for search/filtering',
    })
    @Expose()
    city: string;

    @ApiProperty({
        example: 'Oslo, Osloveien 1',
        description: 'Address for search/filtering',
    })
    @Expose()
    address: string;

    @ApiProperty({
        example: 'Google maps location',
        description: 'Location for finding',
    })
    @Expose()
    location: string;
}

export class SpaceListResponseDto {
    spaces: SpaceListResponseItemDto[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
