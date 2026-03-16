import { ApiProperty } from '@nestjs/swagger';
import { BookingStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateBookingStatusDto {
    @ApiProperty({ enum: ['APPROVED', 'REJECTED'], example: 'APPROVED' })
    @IsEnum(['APPROVED', 'REJECTED'], { message: 'Invalid status, must be APPROVED or REJECTED' })
    status: 'APPROVED' | 'REJECTED';

    @ApiProperty()
    @IsOptional()
    @IsString({ message: 'Reason must be a string' })
    @MinLength(3, { message: 'Reason must be at least 3 characters' })
    @MaxLength(500, { message: 'Reason cannot exceed 500 characters' })
    reason?: string;
}

export class BookingStatusResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty({ enum: BookingStatus })
    status: BookingStatus;

    @ApiProperty()
    updatedAt: Date;
}
