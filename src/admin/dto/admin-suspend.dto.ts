import { ApiProperty } from '@nestjs/swagger';
import { UserStatus } from '@prisma/client';
import { Expose } from 'class-transformer';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class AdminSuspendUserDto {
    @ApiProperty({ example: 'Policy violation - multiple cancellations' })
    @IsString({ message: 'Reason is required to suspend user' })
    @MinLength(3, { message: 'Reason must be at least 3 characters' })
    @MaxLength(500, { message: 'Reason cannot exceed 500 characters' })
    reason: string;
}

export class AdminSuspendUserResponseDto {
    @Expose() userId: string;
    @Expose() status: UserStatus;
    @Expose() suspendedAt: Date;
}
