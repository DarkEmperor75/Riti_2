import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
    ArrayMinSize,
    IsArray,
    IsDateString,
    IsOptional,
    IsString,
    MaxLength,
    ValidateNested,
} from 'class-validator';

export class BlockDaysItemDto {
    @ApiProperty({ example: '2026-03-10' })
    @IsDateString()
    startingDate: string;

    @ApiProperty({ example: '2026-03-15' })
    @IsDateString()
    endingDate: string;

    @ApiPropertyOptional({ example: 'Maintenance' })
    @IsOptional()
    @IsString()
    @MaxLength(200)
    reason?: string;
}

export class BlockDaysDto {
    @ApiProperty({ type: [BlockDaysItemDto] })
    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => BlockDaysItemDto)
    dates: BlockDaysItemDto[];
}

export class BlockDaysResultItemDto {
    @Expose() success: boolean;
    @Expose() message: string;
}

export class BlockedDaysResponseDto {
    id: string;
    startingDate: string;
    endingDate: string;
    reason?: string;
    createdAt: Date;
}