import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { FinancialType, FinancialStatus, FinancialActor } from '@prisma/client';

@Injectable()
export class FinancialsService {
    constructor(private db: DatabaseService) {}

    async recordLedgerEntry(params: {
        reference: string;
        description: string;
        type: FinancialType;
        status?: FinancialStatus;
        amount: number;
        actorType?: FinancialActor;
        actorId?: string;
        bookingId?: string;
        ticketId?: string;
    }) {
        return this.db.financialLedger.create({
            data: {
                reference: params.reference,
                description: params.description,
                type: params.type,
                status: params.status ?? FinancialStatus.COMPLETED,
                amount: params.amount,
                actorType: params.actorType,
                actorId: params.actorId,
                bookingId: params.bookingId,
                ticketId: params.ticketId,
            },
        });
    }

    async getMonthlyPlatformRevenue(months: number = 6) {
        const result = await this.db.$queryRaw<
            { month: Date; revenue: number }[]
        >`
            SELECT
            DATE_TRUNC('month', "createdAt") AS month,
            SUM(amount)::float AS revenue
            FROM financial_ledger
            WHERE type = 'PLATFORM_FEE'
            GROUP BY month
            ORDER BY month ASC
            LIMIT ${months};
        `;

        return result.map((r) => ({
            month: r.month.toISOString().slice(0, 7),
            revenue: r.revenue,
        }));
    }

    async getActorPayouts(actorType: 'VENDOR' | 'HOST', actorId: string) {
        return this.db.payout.findMany({
            where: {
                actorType,
                actorId,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }

    async getAllPayouts(limit: number = 50) {
        if (!limit) limit = 50;
        return this.db.payout.findMany({
            orderBy: {
                createdAt: 'desc',
            },
            take: limit,
        });
    }
}
