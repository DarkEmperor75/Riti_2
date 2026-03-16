import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class AdminCommissionOverviewResponseDto {
    @ApiProperty({
        type: Number,
        description: 'Lifetime commission in NOK',
    })
    @Expose()
    lifetimeCommission: number;

    @ApiProperty({
        type: Number,
        description: 'Today commission in NOK',
    })
    @Expose()
    todayCommission: number;

    @ApiProperty({
        type: Number,
        description: 'Month commission in NOK',
    })
    @Expose()
    monthCommission: number;

    @ApiProperty({
        type: Number,
        description: 'Refunded commission in NOK',
    })
    @Expose()
    refundedCommission: number;
}