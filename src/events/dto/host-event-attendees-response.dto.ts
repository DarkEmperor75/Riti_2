import { ApiProperty } from '@nestjs/swagger';
import { HostEventAttendeeDto } from './host-event-attendee.dto';
import { Expose } from 'class-transformer';

export class HostEventAttendeesResponseDto {
    @ApiProperty({ type: [HostEventAttendeeDto] })
    @Expose()
    items: HostEventAttendeeDto[];

    @ApiProperty({ description: 'Number of tickets sold', example: '100' })
    @Expose()
    totalSold: number;

    @ApiProperty({ description: 'Net Revenue for the event', example: '612612' })
    @Expose()
    totalRevenue: number;
}
