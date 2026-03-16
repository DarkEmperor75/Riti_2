import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EventStatus, TicketStatus, TicketType } from '@prisma/client';
import { Exclude, Expose } from 'class-transformer';

export class TicketResponseDto {
    @ApiProperty({
        description: 'Ticket ID',
        example: '123e4567-e89b-12d3-a456-426655440000',
    })
    @Expose()
    id: string;

    @ApiProperty({
        description: 'Attendee ID',
        example: '123e4567-e89b-12d3-a456-426655440000',
    })
    @Expose()
    attendeeId: string;

    @ApiProperty({
        description: 'Event ID',
        example: '123e4567-e89b-12d3-a456-426655440000',
    })
    @Expose()
    eventId: string;

    @ApiProperty({
        description: 'Event name',
        example: 'Event Name',
    })
    @Expose()
    eventName: string;

    @ApiProperty({
        description: 'Event start time',
        example: new Date(),
    })
    @Expose()
    eventStartTime: Date;

    @ApiProperty({
        description: 'Event address',
        example: '123 Main St, Anytown, USA',
    })
    @Expose()
    eventAddress: string;

    @ApiProperty({
        description: 'Event location',
        example: 'New York, USA',
    })
    @Expose()
    eventLocation: string;

    @ApiProperty({
        description: 'Event status',
        example: EventStatus.PUBLISHED,
        enumName: 'EventStatus',
        enum: EventStatus,
    })
    @Expose()
    eventStatus: EventStatus;

    @ApiProperty({
        description: 'Ticket type ID',
        example: TicketType.REGULAR,
        enumName: 'TicketType',
        enum: TicketType,
    })
    @Expose()
    ticketType: TicketType;

    @ApiProperty({
        description: 'Ticket status',
        example: TicketStatus.PURCHASED,
        enumName: 'TicketStatus',
        enum: TicketStatus,
    })
    @Expose()
    status: TicketStatus;

    @ApiProperty({
        description: 'Ticket price paid',
        example: 100,
    })
    @Expose()
    pricePaid: number;

    @ApiPropertyOptional({
        description: 'Stripe payment ID',
        example: '123e4567-e89b-12d3-a456-426655440000',
    })
    @Exclude()
    attendeeStripePaymentId: string | null;

    @ApiPropertyOptional({
        description: 'Ticket Refund Flag',
        example: true,
    })
    @Expose()
    isRefunded: boolean | null;

    @ApiPropertyOptional({
        description: 'Ticket cancellation date',
        example: new Date(),
    })
    @Expose()
    cancelledAt: Date | null;

    @ApiProperty({
        description: 'Ticket cover image',
        example: 'https://example.com/cover.jpg',
    })
    @Expose()
    coverImg: string | null;
}

export class FreeTicketRes {
    @Expose()
    @ApiProperty({
        description: 'Success flag',
        example: true,
    })
    success: boolean;

    @Expose()
    @ApiProperty({
        description: 'Message for user',
        example: 'Ticket Purchased Successfully',
    })
    message: string;
}

export class PaidTicketRes {
    @Expose()
    @ApiProperty({
        description: 'Payment URL To Redirect Attendee to Stripe Checkout',
        example:
            'https://checkout.stripe.com/checkout/123e4567-e89b-12d3-a456-426655440000',
    })
    checkoutUrl: string;

    @Expose()
    @ApiProperty({
        description: 'Status of Ticket',
        example: TicketStatus.PURCHASED,
        enumName: 'TicketStatus',
        enum: TicketStatus,
    })
    status: TicketStatus;

    @Expose()
    @ApiProperty({
        description: 'Message on status',
        example: 'Ticket Purchased Successfully',
    })
    message: string;
}
