import { ApiPropertyOptional } from "@nestjs/swagger";
import { SpaceType } from "@prisma/client";
import { Type } from "class-transformer";
import { IsOptional, IsString, IsEnum, IsDateString, IsNumber, IsInt, Min, Max } from "class-validator";

export class DiscoverSpacesQueryDto {
    @ApiPropertyOptional({ example: 'Oslo' })
    @IsOptional()
    @IsString()
    city?: string;

    @ApiPropertyOptional({ enum: SpaceType })
    @IsOptional()
    @IsEnum(SpaceType)
    spaceType?: SpaceType;

    @ApiPropertyOptional({ example: 10, minimum: 1 })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Type(() => Number)
    capacityMin?: number;

    @ApiPropertyOptional({ example: 300, minimum: 0 })
    @IsOptional()
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    priceHourlyMax?: number;

    @ApiPropertyOptional({ example: '2026-03-15' })
    @IsOptional()
    @IsDateString()
    date?: string;

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

    @ApiPropertyOptional({ enum: ['pricePerHour', 'capacity', 'createdAt'] })
    @IsOptional()
    @IsEnum(['pricePerHour', 'capacity', 'createdAt'])
    sortBy?: 'pricePerHour' | 'capacity' | 'createdAt';

    @ApiPropertyOptional({ enum: ['asc', 'desc'] })
    @IsOptional()
    @IsEnum(['asc', 'desc'])
    order?: 'asc' | 'desc';
}
