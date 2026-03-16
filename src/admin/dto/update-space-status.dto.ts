import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SpaceStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateSpaceStatusDto {
    @ApiProperty({
        enum: SpaceStatus,
        example: 'APPROVED',
        description: 'Space status',
    })
    @IsEnum(SpaceStatus, {
        message: 'Invalid status, must be APPROVED, REJECTED, or SUSPENDED',
    })
    status: SpaceStatus;

    @ApiPropertyOptional({
        description:
            'Reason for status change in case of rejection or suspension',
    })
    @IsOptional()
    @IsString({ message: 'Reason must be a string' })
    reason?: string;
}
