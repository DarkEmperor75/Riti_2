import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
} from '@nestjs/common';
import { Prisma, SpaceStatus } from '@prisma/client';
import { CreateSpaceDto, UpdateSpaceDto } from '../dto';

type PauseSpacePayloadType = Prisma.SpaceGetPayload<{
    include: {
        bookings: {
            where: {
                status: {
                    in: ['APPROVED', 'PAID'];
                };
            };
            select: { id: true };
        };
        vendor: { select: { userId: true } };
    };
}>;

type UpdateSpacePayloadType = Prisma.SpaceGetPayload<{
    include: {
        vendor: { select: { userId: true } };
        bookings: {
            where: { status: { in: ['APPROVED', 'PAID'] } };
            select: { startTime: true; endTime: true };
        };
    };
}>;

export class SpaceEntity {
    static validateImages(images?: Express.Multer.File[]) {
        if (!images) return;

        if (!Array.isArray(images)) {
            throw new BadRequestException('Images must be an array');
        }

        if (images.length > 5) {
            throw new BadRequestException('Maximum 5 images allowed');
        }

        if (images.length < 3) {
            throw new BadRequestException('Minimum 3 images required');
        }
    }

    static validatePdfs(pdfs?: Express.Multer.File[]) {
        if (!pdfs) return;

        if (!Array.isArray(pdfs)) {
            throw new BadRequestException('Pdf must be an array');
        }

        if (pdfs.length > 2) {
            throw new BadRequestException('Maximum 2 pdfs allowed');
        }
    }

    static validateSpaceToBeUpdated(
        space: UpdateSpacePayloadType,
        dto: UpdateSpaceDto,
        userId: string,
    ) {
        if (space.vendor.userId !== userId)
            throw new ForbiddenException('Not space owner');

        if (
            space.status === SpaceStatus.SUSPENDED ||
            space.status === SpaceStatus.UNDER_REVIEW ||
            space.status === SpaceStatus.ACTIVE
        ) {
            throw new ForbiddenException('Cannot update spaces which are active, suspended or under review');
        }

        if (
            (dto.capacity && dto.capacity < space.capacity) ||
            (dto.pricePerHour &&
                Number(dto.pricePerHour) !== Number(space.pricePerHour)) ||
            (dto.spaceType && dto.spaceType !== space.spaceType)
        ) {
            const futureBookings = space.bookings.filter(
                (b) => new Date(b.startTime) > new Date(),
            );
            if (futureBookings.length > 0) {
                throw new ConflictException(
                    'Cannot alter capacity, price or type for existing confirmed bookings',
                );
            }
        }

        if (dto.status) {
            if (
                dto.status !== SpaceStatus.REJECTED &&
                dto.status !== SpaceStatus.DRAFT && 
                dto.status !== SpaceStatus.ACTIVE
            ) {
                throw new BadRequestException(
                    `Cannot update space status to: ${dto.status}`,
                );
            }
        }

        if (dto.resendForReview) {
            if (space.status !== SpaceStatus.REJECTED) {
                throw new BadRequestException(
                    'Cannot resend for review - space is not rejected',
                );
            }
        }
    }

    static validateSpaceToBePaused(
        space: PauseSpacePayloadType,
        userId: string,
    ) {
        if (space.vendor.userId !== userId)
            throw new ForbiddenException('Not space owner');
        if (space.bookings.length > 0) {
            throw new ConflictException(
                `Cannot pause - ${space.bookings.length} active future bookings. Cancel bookings first.`,
            );
        }
        if (space.status === SpaceStatus.PAUSED) {
            throw new BadRequestException('Space already paused');
        }
        if (space.status === SpaceStatus.UNDER_REVIEW) {
            throw new BadRequestException('Cannot pause pending review spaces');
        }
        if (space.status === SpaceStatus.SUSPENDED) {
            throw new BadRequestException('Space already paused');
        }
    }

    static validateSpaceFileReplaceMent(
        vendorUserId: string,
        userId: string,
        spaceStaus: SpaceStatus,
    ) {
        if (vendorUserId !== userId)
            throw new ForbiddenException('Not space owner');
        if (spaceStaus !== SpaceStatus.DRAFT)
            throw new BadRequestException(
                'Can only update files in DRAFT status',
            );
    }

    static createSpaceData(
        dto: CreateSpaceDto,
        city: string,
        vendorId: string,
    ): Prisma.SpaceCreateInput {
        return {
            vendor: {
                connect: { id: vendorId },
            } as Prisma.VendorCreateNestedOneWithoutSpacesInput,
            name: dto.name,
            description: dto.description,
            capacity: dto.capacity,
            address: dto.address,
            city: city,
            spaceType: dto.spaceType,
            amenities: dto.amenities,
            pricePerHour: dto.pricePerHour,
            location: dto.location,
            ...(dto.rules !== undefined && { rules: dto.rules }),
            ...(dto.minBookingDurationHours !== undefined && {
                minBookingDurationHours: dto.minBookingDurationHours,
            }),
            ...(dto.minLeadTimeHours !== undefined && {
                minLeadTimeHours: dto.minLeadTimeHours,
            }),
            ...(dto.multiDayBookingAllowed !== undefined && {
                multiDayBookingAllowed: dto.multiDayBookingAllowed,
            }),
        };
    }
}
