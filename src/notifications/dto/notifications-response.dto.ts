import { ApiProperty } from '@nestjs/swagger';
import { NotificationType } from '@prisma/client';
import { Expose } from 'class-transformer';

export class NotificationResponseDto {
    @ApiProperty({ example: '123e4567-e89b-12d3-a456-426655440000' })
    @Expose()
    id: string;

    @ApiProperty({
        enum: NotificationType,
        example: NotificationType.EVENT_REMINDER,
    })
    @Expose()
    type: NotificationType;

    @ApiProperty({ example: 'Event Reminder' })
    @Expose()
    title: string;

    @ApiProperty({ example: 'Your event is about to start' })
    @Expose()
    message: string;

    @ApiProperty({ example: false })
    @Expose()
    read: boolean;

    @ApiProperty({ type: 'object', additionalProperties: true, nullable: true })
    @Expose()
    meta?: Record<string, any>;

    @ApiProperty()
    @Expose()
    createdAt: Date;

    @ApiProperty()
    @Expose()
    updatedAt: Date;
}

export class NotificationsListResponseDto {
    @ApiProperty({ type: [NotificationResponseDto] })
    @Expose()
    notifications: NotificationResponseDto[];

    @ApiProperty()
    @Expose()
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
