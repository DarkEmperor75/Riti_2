import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BookingStatus, SpaceStatus } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';

export class CalendarQueryDto {
    @ApiProperty({ example: '2026-03-01T00:00:00Z' })
    @Transform(({ value }) => new Date(value))
    startDate: Date;

    @ApiProperty({ example: '2026-03-31T23:59:59Z' })
    @Transform(({ value }) => new Date(value))
    endDate: Date;

    @ApiPropertyOptional({
        type: [String],
        example: 'clabc123,cldef456',
        description: 'Filter specific spaces (comma-separated)',
    })
    @IsOptional()
    @IsString({ each: true })
    spaceIds?: string[];
}

export class BookingCalendarEventDto {
    @ApiProperty({ example: 'clbooking123' })
    id: string;

    @ApiProperty({ example: 'Yoga Workshop' })
    title: string;

    @ApiProperty({ enum: BookingStatus })
    status: BookingStatus;

    @ApiProperty({ example: 1600 })
    totalPrice: number;

    @ApiProperty({
        example: { fullName: 'John Doe', email: 'john@email.com' },
    })
    renter: { fullName: string; email: string };

    @ApiProperty({ example: '2026-03-15T18:00:00Z' })
    startTime: Date;

    @ApiProperty({ example: '2026-03-15T22:00:00Z' })
    endTime: Date;
}

export class BlockedSlotDto {
    @ApiProperty({ example: 'clblock123' })
    id: string;

    @ApiProperty({ example: 'Maintenance' })
    reason: string;

    @ApiProperty({ example: '2026-03-20T09:00:00Z' })
    startTime: Date;

    @ApiProperty({ example: '2026-03-20T17:00:00Z' })
    endTime: Date;
}

export class SpaceCalendarDto {
    @ApiProperty({ example: 'clabc123' })
    id: string;

    @ApiProperty({ example: 'Yoga Studio' })
    name: string;

    @ApiProperty({ enum: SpaceStatus })
    status: SpaceStatus;

    @ApiProperty({
        type: [BookingCalendarEventDto],
        description: 'Confirmed + pending bookings',
    })
    bookings: BookingCalendarEventDto[];

    @ApiProperty({
        type: [BlockedSlotDto],
        description: 'Manually blocked time slots',
    })
    blockedSlots: BlockedSlotDto[];

    @ApiProperty({
        example: true,
        description: 'Space available for new bookings now?',
    })
    isAvailableNow: boolean;
}

export class SpaceCalendarResponseDto {
    @ApiProperty({ type: [SpaceCalendarDto] })
    spaces: SpaceCalendarDto[];

    @ApiProperty({ example: { busySlots: 12, availableSlots: 45 } })
    summary: {
        busySlots: number;
        availableSlots: number;
        upcomingBookings: number;
    };
}
