import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class AdminSpaceStatusResponseDto {
    @ApiProperty({ example: 'space_789' }) @Expose() spaceId: string;
    @ApiProperty({ example: 'UNDER_REVIEW' }) @Expose() status: string;
}
