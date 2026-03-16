import { IsOptional, IsEnum, IsInt, Min, Max, IsString } from 'class-validator';
import { Expose, Transform, Type } from 'class-transformer';
import { BookingStatus } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class AdminBookingListItemDto {
    @ApiProperty({ example: 'wqggwweqwye-ewq772-213312' })
    @Expose()
    bookingId: string;

    @ApiProperty({ example: 'wqggwweqwye-ewq772-213312' })
    @Expose()
    spaceId: string;

    @ApiProperty({ example: 'wqggwweqwye-ewq772-213312' })
    @Expose()
    renterId: string;

    @ApiProperty({ example: 'Space Name 123' })
    @Expose()
    spaceName: string;

    @ApiProperty({ example: 'Gonchung Ola Nordmann' })
    @Expose()
    renterName: string;

    @ApiProperty({ example: BookingStatus.APPROVED, enum: BookingStatus })
    @Expose()
    status: BookingStatus;

    @ApiProperty({ example: '2027-12-23' })
    @Expose()
    startTime: Date;

    @ApiProperty({ example: '2027-12-23' })
    @Expose()
    endTime: Date;

    @ApiProperty({ example: 100 })
    @Expose()
    totalPrice: number;
}

export class AdminBookingsListResponseDto {
    bookings: AdminBookingListItemDto[];
    meta: { page: number; limit: number; total: number; totalPages: number };
}

export class AdminBookingsQueryDto {
    @IsOptional() @IsEnum(BookingStatus) status?: BookingStatus;

    @IsOptional() @IsString() spaceId?: string;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Transform(({ value }) => Number(value))
    @Type(() => Number)
    page = 1;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(100)
    @Transform(({ value }) => Number(value))
    @Type(() => Number)
    limit = 20;

    @IsOptional() @IsEnum(['createdAt', 'startTime']) sortBy?: string;
    @IsOptional() @IsEnum(['asc', 'desc']) order?: 'asc' | 'desc';
}
