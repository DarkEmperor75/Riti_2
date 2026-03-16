import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TicketStatus, TicketType } from '@prisma/client';
import { Expose, Transform, Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class AdminTicketListItemDto {
    @ApiProperty({ example: 'ciqwl27t12-21213t0e-wiqeyuwqye' })
    @Expose()
    ticketId: string;

    @ApiProperty({ example: 'ciqwl27t12-21213t0e-wiqeyuwqye' })
    @Expose()
    eventId: string;

    @ApiProperty({ example: 'ciqwl27t12-21213t0e-wiqeyuwqye' })
    @Expose()
    attendeeId: string;

    @ApiProperty({ example: 'My event title' })
    @Expose()
    eventTitle: string;

    @ApiProperty({ example: 'Romana Jacobs' })
    @Expose()
    attendeeName: string;

    @ApiProperty({
        enumName: 'TicketStatus',
        enum: TicketStatus,
        example: TicketStatus.PURCHASED,
    })
    @Expose()
    status: TicketStatus;

    @ApiProperty({ example: 100 })
    @Transform(({ value }) => Number(value))
    @Type(() => Number)
    @Expose()
    pricePaid: number;

    @ApiProperty({
        enumName: 'TicketType',
        enum: TicketType,
        example: TicketType.REGULAR,
    })
    @Expose()
    ticketType: TicketType;

    @ApiProperty({ example: '2023-01-01T00:00:00.000Z' })
    @Expose()
    cancelledAt: Date | null;
}

export class AdminTicketsListResponseDto {
    tickets: AdminTicketListItemDto[];
    meta: { page: number; limit: number; total: number; totalPages: number };
}

export class AdminTicketsQueryDto {
    @ApiPropertyOptional({ enum: TicketStatus, example: 'PURCHASED' })
    @IsOptional()
    @IsEnum(TicketStatus)
    status?: TicketStatus;

    @ApiPropertyOptional({ example: 'ciqwl27t12-21213t0e-wiqeyuwqye' })
    @IsOptional()
    @IsString()
    eventId?: string;

    @ApiPropertyOptional({ example: 'ciqwl27t12-21213t0e-wiqeyuwqye' })
    @IsOptional()
    @IsString()
    attendeeId?: string;

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
}
