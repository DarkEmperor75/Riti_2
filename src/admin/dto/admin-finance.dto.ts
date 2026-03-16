import { ApiProperty } from '@nestjs/swagger';

export class BookingFinanceDto {
    @ApiProperty({ example: 12000 })
    gross: number;

    @ApiProperty({ example: 2000 })
    refunded: number;

    @ApiProperty({ example: 9000 })
    transferred: number;

    @ApiProperty({ example: 1000 })
    platformRevenue: number;
}

export class TicketFinanceDto {
    @ApiProperty({ example: 8000 })
    gross: number;

    @ApiProperty({ example: 500 })
    refunded: number;

    @ApiProperty({ example: 7500 })
    transferred: number;
}

export class FinanceSummaryDto {
    @ApiProperty({ example: 20000 })
    totalGross: number;

    @ApiProperty({ example: 2500 })
    totalRefunded: number;

    @ApiProperty({ example: 16500 })
    totalTransferred: number;

    @ApiProperty({ example: 1000 })
    platformNet: number;
}

export class AdminFinanceOverviewDto {
    @ApiProperty({ example: 'NOK' })
    currency: string;

    @ApiProperty({ type: BookingFinanceDto })
    bookings: BookingFinanceDto;

    @ApiProperty({ type: TicketFinanceDto })
    tickets: TicketFinanceDto;

    @ApiProperty({ type: FinanceSummaryDto })
    summary: FinanceSummaryDto;
}
