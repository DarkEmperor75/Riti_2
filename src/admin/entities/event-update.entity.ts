import { ForbiddenException } from '@nestjs/common';
import { EventStatus } from '@prisma/client';

export class AdminEventUpdateEntity {
    static validateEventToBeCancelled(eventStatus: EventStatus) {
        if (eventStatus === EventStatus.CANCELLED)
            throw new ForbiddenException('Event is already cancelled');
        if (eventStatus === EventStatus.COMPLETED)
            throw new ForbiddenException('Cannot cancel completed events');
    }
}
