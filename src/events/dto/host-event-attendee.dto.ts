import { ApiProperty } from '@nestjs/swagger';
import { TicketStatus, TicketType } from '@prisma/client';
import { Expose } from 'class-transformer';

export class HostEventAttendeeDto {
    @ApiProperty({ example: 'ciqwl27t12-21213t0e-wiqeyuwqye' })
    @Expose()
    ticketId: string;

    @ApiProperty({ example: 'ciqwl27t12-21213t0e-wiqeyuwqye' })
    @Expose()
    attendeeId: string;

    @ApiProperty({ example: 'Romana Jacobs' })
    @Expose()
    attendeeName: string;

    @ApiProperty({ example: 'romana@email.com' })
    @Expose()
    attendeeEmail: string;

    @ApiProperty({
        description: 'Ticket type for the event, either REGULAR or STUDENT',
        enum: TicketType,
        example: TicketType.REGULAR,
    })
    @Expose()
    ticketType: TicketType;

    @ApiProperty({
        description: 'Ticket status for the event',
        enum: TicketStatus,
        example: TicketStatus.PURCHASED,
    })
    @Expose()
    status: TicketStatus;

    @ApiProperty({ example: '100' })
    @Expose()
    pricePaid: number;

    @ApiProperty({ example: '2027-01-01' })
    @Expose()
    purchasedAt: Date;
}
