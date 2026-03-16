import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BookingStatus } from '@prisma/client';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class SpaceBookingCronService {
    private readonly logger = new Logger(SpaceBookingCronService.name);

    constructor(private db: DatabaseService) {}

    @Cron(CronExpression.EVERY_HOUR) 
    async expirePendingBookings() {
        const expiredCount = await this.db.booking.updateMany({
            where: {
                status: 'PENDING',
                expiryTime: { lt: new Date() }, 
            },
            data: { status: 'EXPIRED' },
        });

        this.logger.log(`Expired ${expiredCount.count} pending bookings`);
    }

    @Cron(CronExpression.EVERY_10_MINUTES)
    async completeBookingsAtEndtime() {
        const completedCount = await this.db.booking.updateMany({
            where: {
                status: BookingStatus.PAID,
                endTime: { lt: new Date() }, 
            },
            data: { status: 'COMPLETED' },
        });

        this.logger.log(`Completed ${completedCount.count} pending bookings`);
    }

    async triggerExpiry() {
        return this.expirePendingBookings();
    }

    async triggerBookingsCompletion() {
        return this.completeBookingsAtEndtime();
    }
}
