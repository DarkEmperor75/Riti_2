import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { BookingStatus } from "@prisma/client";
import { Type } from "class-transformer";
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from "class-validator";

export class VendorBookingsQueryDto {
    @ApiPropertyOptional({ enum: BookingStatus })
    @IsOptional()
    @IsEnum(BookingStatus)
    status?: BookingStatus;

    @ApiPropertyOptional({ example: 'clabc123' })
    @IsOptional()
    @IsString()
    spaceId?: string;

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

export class VendorBookingDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    space: {
        id: string;
        name: string;
        coverImage: string;
    };

    @ApiProperty()
    renter: {
        fullName: string;
        email: string;
    };

    @ApiProperty({ enum: BookingStatus })
    status: BookingStatus;

    @ApiProperty()
    startTime: Date;

    @ApiProperty()
    endTime: Date;

    @ApiProperty()
    totalPrice: number;

    @ApiPropertyOptional()
    note?: string;

    @ApiProperty({ example: '2h ago' })
    relativeTime: string; // "2h ago", "Just now"
}

export class VendorBookingsListDto {
    @ApiProperty({ type: [VendorBookingDto] })
    bookings: VendorBookingDto[];

    @ApiProperty()
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
