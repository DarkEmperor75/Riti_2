import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BookingStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';

export class UserBookingsQueryDto {
    @ApiPropertyOptional({
        enum: ['upcoming', 'history', 'all'],
        example: 'upcoming',
    })
    @IsOptional()
    @IsEnum(['upcoming', 'history', 'all'])
    type: 'upcoming' | 'history' | 'all' = 'all';

    @ApiPropertyOptional({ enum: BookingStatus })
    @IsOptional()
    @IsEnum(BookingStatus)
    status?: BookingStatus;

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
    @Max(50)
    @Type(() => Number)
    limit = 20;
}

export class UserBookingDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    space: {
        id: string;
        name: string;
        images: string[];
    };

    @ApiProperty({ enum: BookingStatus })
    status: BookingStatus;

    @ApiProperty()
    startTime: Date;

    @ApiProperty()
    endTime: Date;

    @ApiProperty()
    totalPrice: number;

    @ApiProperty({ example: 'Oslo' })
    city: string;

    @ApiProperty({ example: '54th Building, Local Street, Oslo' })
    address: string;

    @ApiProperty({ example: 'https://www.google.co.in/maps/place' })
    location: string;

    @ApiPropertyOptional()
    note?: string;

    @ApiProperty({ example: '2h ago' })
    relativeTime: string;

    @ApiProperty()
    rejectedReason?: string;
}

export class UserBookingsListDto {
    @ApiProperty({ type: [UserBookingDto] })
    bookings: UserBookingDto[];

    @ApiProperty()
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
