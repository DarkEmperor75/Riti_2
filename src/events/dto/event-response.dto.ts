import { ApiProperty } from '@nestjs/swagger';
import { EventCategory, EventType, PaymentStatus } from '@prisma/client';
import { Expose } from 'class-transformer';

export class EventPreviewResponseDto {
    @ApiProperty({ example: 'cwqw8127eg1287t12921' })
    @Expose()
    id: string;

    @ApiProperty({ example: 'My event' })
    @Expose()
    title: string;

    @ApiProperty({ example: 'Romana Jacobs' })
    @Expose()
    organizer: string;

    @ApiProperty({ example: '16th August 2026' })
    @Expose()
    eventDate: Date;

    @ApiProperty({ example: '17/100' })
    @Expose()
    capacityUsed: string;

    @ApiProperty({ example: 'PUBLISHED' })
    @Expose()
    eventStaus: string;

    @ApiProperty({ example: 'https://www.example.com' })
    @Expose()
    coverImg: string;

    @ApiProperty({
        enumName: 'EventCategory',
        enum: EventCategory,
        example: EventCategory.ART,
    })
    @Expose()
    category: EventCategory;

    @ApiProperty({
        enumName: 'EventType',
        enum: EventType,
        example: EventType.FREE,
    })
    @Expose()
    eventType: EventType;

    @ApiProperty({ example: 'Oslo' })
    @Expose()
    city: string;

    @ApiProperty({ example: '54th Building, Local Street, Oslo' })
    @Expose()
    address: string;

    @ApiProperty({ example: 'Google Maps Location Link' })
    @Expose()
    location: string;
}

export class HostEventResponseDto extends EventPreviewResponseDto {
    @ApiProperty({ example: 'cwqw8127eg1287t12921' })
    @Expose()
    bookingId: string;

    @ApiProperty({ example: 'My event description' })
    @Expose()
    description: string;

    @ApiProperty({ example: '16th August 2026, 16:00' })
    @Expose()
    startTime: Date;

    @ApiProperty({ example: '17th August 2026, 16:21' })
    @Expose()
    endTime: Date;

    @ApiProperty({ example: '100' })
    @Expose()
    price: string;

    @ApiProperty({ example: '80' })
    @Expose()
    studentDiscount: string;

    @ApiProperty({ example: '1120' })
    @Expose()
    capacity: number;

    @ApiProperty({ example: 'NOT_APPLICABLE' })
    @Expose()
    payoutStatus: PaymentStatus;

    @ApiProperty({ description: 'Event Tickets' })
    @Expose()
    tickets: string[];

    @ApiProperty({ description: 'Event Attendees' })
    @Expose()
    attendees: string[];
}

export class PublicEventResponseDto extends EventPreviewResponseDto {
    @ApiProperty({ example: 'My event description' })
    @Expose()
    description: string;

    @ApiProperty({ example: 'cwqw8127eg1287t12921' })
    @Expose()
    hostId: string;

    @ApiProperty({ example: '16th August 2026, 16:00' })
    @Expose()
    startTime: Date;

    @ApiProperty({ example: '17th August 2026, 16:21' })
    @Expose()
    endTime: Date;

    @ApiProperty({ example: '100' })
    @Expose()
    price: string;

    @ApiProperty({ example: '80' })
    @Expose()
    studentDiscount: string;

    @ApiProperty({
        example: '1120',
        description: 'Total Capacity of the event',
    })
    @Expose()
    capacity: number;
}
