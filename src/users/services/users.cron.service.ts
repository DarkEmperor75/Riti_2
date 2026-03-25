import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InitialIntent, UserType } from '@prisma/client';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class UsersCronService {
    private readonly logger = new Logger();
    constructor(private db: DatabaseService) {}

    @Cron(CronExpression.EVERY_5_MINUTES)
    async createUserInitialIntent() {
        const users = await this.db.user.findMany({
            where: {
                initialIntent: null,
            },
            select: {
                id: true,
                userType: true,
            },
        });

        for (const user of users) {
            try {
                const mapUserTypeToIntent = {
                    [UserType.ATTENDEE]: InitialIntent.ATTEND,
                    [UserType.HOST]: InitialIntent.HOST,
                    [UserType.VENDOR]: InitialIntent.LIST_SPACE,
                };

                await this.db.user.update({
                    where: { id: user.id },
                    data: { initialIntent: mapUserTypeToIntent[user.userType] },
                    select: { id: true },
                });
            } catch (error) {
                this.logger.error(
                    `Failed to update user's intent, due to ${error.message}`,
                    error,
                );
            }
        }
    }
}
