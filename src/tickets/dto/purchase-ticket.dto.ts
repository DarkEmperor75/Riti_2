import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class PurchaseTicketDto {
    @ApiProperty({
        description: 'Event ID',
        required: true,
        example: '123e4567-e89b-12d3-a456-426655440000',
    })
    @IsString({ message: 'Event ID is required' })
    eventId: string;
}
