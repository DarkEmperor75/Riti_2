import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SpaceStatus, VendorStatus, SpaceType } from '@prisma/client';
import { IsOptional, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Expose, Transform, Type } from 'class-transformer';

export class AdminSpaceListItemDto {
    @ApiProperty({ example: 'space_789' })
    @Expose()
    id: string;

    @ApiProperty({ example: 'Downtown Studio' })
    @Expose()
    name: string;

    @ApiProperty({ example: 'vendor_123' })
    @Expose()
    vendorId: string;

    @ApiProperty({ example: 'Ola Nordmann' })
    @Expose()
    vendorName: string;

    @ApiProperty({ example: 'UNDER_REVIEW', enum: SpaceStatus })
    @Expose()
    status: SpaceStatus;

    @ApiProperty({ example: 'APPROVED', enum: VendorStatus })
    @Expose()
    vendorStatus: VendorStatus;

    @ApiProperty({ example: 'STUDIO', enum: SpaceType })
    @Expose()
    spaceType: SpaceType;

    @ApiProperty({ example: 50 })
    @Expose()
    capacity: number;

    @ApiProperty({ example: 250.0 })
    @Expose()
    @Transform(({ value }) => Number(value))
    @Type(() => Number)
    pricePerHour: number;

    @ApiProperty({ example: 'Oslo' })
    @Expose()
    city: string;

    @ApiProperty({ example: 'lokhanwala, 411026' })
    @Expose()
    address: string;

    @ApiProperty({ example: 'Google Maps Link to the location' })
    @Expose()
    location: string;

    @ApiProperty({
        description: 'Images of the space',
        example: 'https://storage.../img1.jpg',
    })
    @Expose()
    images: Record<string, any>;

    @ApiProperty({
        description: 'Images of the space',
        example: 'https://storage.../img1.jpg',
    })
    @Expose()
    instructionalPdfs: Record<string, any>;

    @ApiPropertyOptional({ example: 'Needs more photos' })
    @Expose()
    adminReason?: string;

    @ApiProperty({ example: '2026-02-15T14:00:00Z' })
    @Expose()
    createdAt: Date;

    @ApiProperty({ example: 'vendor-business-123' })
    @Expose()
    vendorBusinessName: string;
}

export class AdminSpaceListResponseDto {
    @Expose()
    spaces: AdminSpaceListItemDto[];

    @Expose()
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export class AdminListSpacesQueryDto {
    @ApiPropertyOptional({ enum: SpaceStatus, example: 'UNDER_REVIEW' })
    @IsOptional()
    @IsEnum(SpaceStatus)
    status?: SpaceStatus;

    @ApiPropertyOptional({ enum: VendorStatus })
    @IsOptional()
    @IsEnum(VendorStatus)
    vendorStatus?: VendorStatus;

    @ApiPropertyOptional({ example: 1 })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Type(() => Number)
    page = 1;

    @ApiPropertyOptional({ example: 20 })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(100)
    @Type(() => Number)
    limit = 20;

    @ApiPropertyOptional({ enum: ['createdAt', 'name', 'updatedAt'] })
    @IsOptional()
    @IsEnum(['createdAt', 'name', 'updatedAt'])
    sortBy?: 'createdAt' | 'name' | 'updatedAt';

    @ApiPropertyOptional({ enum: ['asc', 'desc'] })
    @IsOptional()
    @IsEnum(['asc', 'desc'])
    order?: 'asc' | 'desc';
}
