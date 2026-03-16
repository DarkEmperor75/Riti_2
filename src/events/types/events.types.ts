import { ApiResponse, Paginated } from 'src/common/types';
import { EventApiErrorCode } from '../constants';
import { EventCategory, EventStatus, EventType } from '@prisma/client';
import { EventPreviewResponseDto } from '../dto';

export type EventApiErrorCode =
    (typeof EventApiErrorCode)[keyof typeof EventApiErrorCode];

export type EventMetaData = {
    eventId?: string;
    hostId?: string;
    requestId?: string;
};

export type EventResponseData = {
    event: {
        id: string;
        status: EventStatus;
        title: string;
        description: string;
        category: EventCategory;
        eventType?: EventType;
        startTime?: Date;
        endTime?: Date;
        bookingId?: string;
        coverImg?: string;
    };
    canPublish: boolean;
    missingForPublish: Array<
        | 'times'
        | 'capacity'
        | 'booking'
        | 'eventType'
        | 'coverImg'
        | 'stripeConnected'
    >;
};

export type EventResponse = ApiResponse<
    EventResponseData,
    EventMetaData,
    EventApiErrorCode
>;


export type HostEventsList = Paginated<EventPreviewResponseDto>;
export type PublicEventsList = Paginated<EventPreviewResponseDto>;
