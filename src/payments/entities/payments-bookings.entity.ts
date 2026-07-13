import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { BookingStatus, Prisma } from '@prisma/client';

type SpacePaymentBooking = Prisma.BookingGetPayload<{
    select: {
        id: true;
        renterId: true;
        status: true;
        expiryTime: true;
        stripePaymentIntentId: true;
        totalPrice: true;
        space: {
            select: {
                name: true;
                vendor: {
                    select: {
                        id: true;
                        stripeAccountId: true;
                        stripePayoutsEnabled: true;
                        stripeChargesEnabled: true;
                    };
                };
            };
        };
    };
}>;

export class PaymentsBookingsEntity {
    static validateSpaceBookingPayment(
        booking: SpacePaymentBooking,
        userId: string,
    ) {
        if (booking.renterId !== userId) {
            throw new ForbiddenException('Not your booking');
        }

        if (booking.status !== BookingStatus.APPROVED) {
            throw new BadRequestException('Booking is not payable');
        }

        if (booking.stripePaymentIntentId) {
            throw new BadRequestException('Booking already paid');
        }

        const vendor = booking.space.vendor;

        if (
            !vendor.stripeAccountId ||
            !vendor.stripeChargesEnabled ||
            !vendor.stripePayoutsEnabled
        ) {
            throw new BadRequestException(
                'Vendor is not ready to receive payments',
            );
        }
    }

    static extractSpaceBookingPaymentCalculation(
        booking: SpacePaymentBooking,
    ): {
        totalAmountOre: number;
        applicationFeeAmount: number;
        vendorPayoutAmount: number;
    } {
        const totalAmountOre = Math.round(Number(booking.totalPrice) * 100);

        const applicationFeeAmount = Math.round(totalAmountOre * 0.1);
        const vendorPayoutAmount = totalAmountOre - applicationFeeAmount;

        return {
            totalAmountOre,
            applicationFeeAmount,
            vendorPayoutAmount,
        };
    }
}
