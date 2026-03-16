import { IsOptional, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationType } from '@prisma/client';

export class NotificationsListQueryDto {
    @ApiPropertyOptional({ enum: NotificationType })
    @IsOptional()
    @IsEnum(NotificationType)
    type?: NotificationType;

    @ApiPropertyOptional()
    @IsOptional()
    read?: boolean;

    @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    limit = 20;

    @ApiPropertyOptional({ default: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page = 1;
}

export class MarkReadDto {} 