import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class HostEventStatsDto {
    @ApiProperty({ example: '123312' })
    @Expose()
    totalSold: number;

    @ApiProperty({ example: '3213' })
    @Expose()
    regularSold: number;

    @ApiProperty({ example: '323' })
    @Expose()
    studentSold: number;

    @ApiProperty({ example: '123213' })
    @Expose()
    totalRevenue: number;

    @ApiProperty({ example: '22' })
    @Expose()
    totalCancelled: number;

    @ApiProperty({ example: '233' })
    @Expose()
    capacity: number | null;

    @ApiProperty({ example: true })
    @Expose()
    isSoldOut: boolean;
}
