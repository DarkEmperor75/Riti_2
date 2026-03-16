import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateSpaceDto } from './create-space.dto';
import { IsBoolean, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateSpaceDto extends PartialType(CreateSpaceDto) {
    @ApiProperty({ required: false, description: 'Resend for review from admin for rejection' })
    @IsOptional()
    @IsBoolean({ message: 'resendForReview must be a boolean' })
    resendForReview?: boolean;
}
