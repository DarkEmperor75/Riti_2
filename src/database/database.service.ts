import {
    Injectable,
    Logger,
    OnModuleDestroy,
    OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class DatabaseService
    extends PrismaClient
    implements OnModuleInit, OnModuleDestroy
{
    private readonly logger = new Logger(DatabaseService.name);
    constructor() {
        super({
            log: [ 'error'],
        });
    }

    async onModuleInit() {
        try {
            await this.$connect();
        } catch (error) {
            this.logger.error('Database connection failed', error);
            throw error;
        }
    }

    async onModuleDestroy() {
        try {
            await this.$disconnect();
        } catch (error) {
            this.logger.error('Failed to disconnect with the database', error);
            throw error;
        }
    }
}
