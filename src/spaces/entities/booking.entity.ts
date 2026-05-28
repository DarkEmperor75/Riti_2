import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { BookingStatus, Prisma } from '@prisma/client';
import dayjs from 'dayjs';

type CreateBookingSpacePayloadType = Prisma.SpaceGetPayload<{
    include: {
        vendor: true;
        bookings: true;
        daysBlocked: true;
    };
}>;

export class BookingEntity {
    static validateBookingToBeCreated(
        space: CreateBookingSpacePayloadType,
        startDateTime: Date,
        durationHours: number,
        renterId: string,
    ): void {
        if (space.vendor.vendorStatus === 'SUSPENDED') {
            throw new BadRequestException('Vendor suspended');
        }
        if (space.bookings) {
            const pendingBookings = space.bookings.filter(
                (b) => b.status === 'PENDING' && b.renterId === renterId,
            );

            if (pendingBookings.some((b) => true)) {
                throw new BadRequestException(
                    'Cannot book - pending booking already exists',
                );
            }
        }

        if (
            space.status !== 'ACTIVE' ||
            space.isSuspended ||
            space.vendor.vendorStatus !== 'APPROVED'
        ) {
            throw new BadRequestException('Space unavailable for booking');
        }

        if (!space.multiDayBookingAllowed && durationHours > 24) {
            throw new BadRequestException('Multi day booking not allowed');
        }

        if (
            space.minBookingDurationHours &&
            durationHours < space.minBookingDurationHours
        ) {
            throw new BadRequestException(
                `Minimum ${space.minBookingDurationHours}h booking required`,
            );
        }

        const leadTimeMin = space.minLeadTimeHours != null ? space.minLeadTimeHours * 60 : 30;
        const advanceTimeMin = (startDateTime.getTime() - Date.now()) / (1000 * 60);
        if (advanceTimeMin < leadTimeMin) {
            throw new BadRequestException(
                space.minLeadTimeHours != null
                    ? `Minimum ${space.minLeadTimeHours}h advance notice required`
                    : `This slot is unavailable due to lead time restriction`,
            );
        }

        if (space.daysBlocked?.length) {
            const bookingStart = dayjs(startDateTime).startOf('day');
            const bookingEnd = dayjs(startDateTime)
                .add(durationHours, 'hour')
                .endOf('day');

            const isBlocked = space.daysBlocked.some(
                (d) =>
                    dayjs(d.startingDate).isBefore(bookingEnd) &&
                    dayjs(d.endingDate).isAfter(bookingStart),
            );

            if (isBlocked) {
                throw new BadRequestException(
                    'Selected dates are blocked by the vendor',
                );
            }
        }
    }

    static validateBookingToBeUpdated(
        bookingSpaceVendorUserId: string,
        vendorUserId: string,
        bookingStatus: BookingStatus,
        bookingExpiryTime?: Date,
    ): void {
        if (bookingSpaceVendorUserId !== vendorUserId)
            throw new ForbiddenException('Not your booking');
        if (bookingStatus !== BookingStatus.PENDING)
            throw new BadRequestException('Can only update PENDING bookings');
        if (bookingExpiryTime && bookingExpiryTime < new Date())
            throw new BadRequestException('Booking has expired');
    }
}
