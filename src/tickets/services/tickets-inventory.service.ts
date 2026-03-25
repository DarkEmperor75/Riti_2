import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class TicketsInventoryService {
    private readonly logger = new Logger();
    constructor(private db: DatabaseService) {}

    async decrement(eventId: string, tx?: Prisma.TransactionClient) {
        const client = tx || this.db;

        const result = await client.event.updateMany({
            where: {
                id: eventId,
                ticketsSold: { gt: 0 },
            },
            data: {
                ticketsSold: { decrement: 1 },
            },
        });

        if (result.count === 0) {
            this.logger.error(`Failed to decrease the value of tickets sold`);
        }
    }

    async increment(eventId: string, tx?: Prisma.TransactionClient) {
        const client = tx || this.db;

        await client.event.update({
            where: { id: eventId },
            data: {
                ticketsSold: { increment: 1 },
            },
        });
    }
}
