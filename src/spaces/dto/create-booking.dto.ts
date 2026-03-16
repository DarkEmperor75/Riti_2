import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, MaxLength, Min } from "class-validator";

export class CreateBookingDto {
    @ApiProperty({ example: 'clabc123' })
    @IsString()
    spaceId: string;

    @ApiProperty({ example: '2026-03-15' })
    @IsString()
    startDate: string;

    @ApiProperty({ example: '10:00' })
    @IsString()
    startTime: string;

    @ApiProperty({ example: 4 })
    @IsInt()
    @Min(1)
    @Type(() => Number)
    durationHours: number;

    @ApiPropertyOptional({ example: 'Yoga workshop setup' })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    note?: string;
}
