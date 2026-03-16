import { Prisma, SpaceStatus } from '@prisma/client';
import { UpdateSpaceStatusDto } from '../dto';
import { BadRequestException, ForbiddenException, Logger } from '@nestjs/common';

type SpaceToBeUpdated = Prisma.SpaceGetPayload<{
    select: {
        id: true;
        name: true;
        status: true;
        adminReason: true;
        vendor: {
            select: {
                id: true;
                businessName: true;
                vendorStatus: true;
                spaces: {
                    select: {
                        status: true;
                    };
                };
            };
        };
    };
}>;

type SpacesToBeUpdated = Prisma.SpaceGetPayload<{
    select: {
        vendor: {
            select: {
                id: true;
                businessName: true;
                vendorStatus: true;
                spaces: {
                    select: {
                        status: true;
                    };
                };
            };
        };
    };
}>;

export class AdminSpaceUpdateEntity {
    private static logger = new Logger(AdminSpaceUpdateEntity.name);
    static validateSpaceToBeUpdated(
        space: SpaceToBeUpdated,
        dto: UpdateSpaceStatusDto,
    ) {
        if (
            dto.status === SpaceStatus.APPROVED ||
            dto.status === SpaceStatus.REJECTED
        ) {
            if (space.status !== SpaceStatus.UNDER_REVIEW) {
                throw new ForbiddenException('Space is not under review');
            }
        }

        if (
            dto.status === SpaceStatus.REJECTED ||
            dto.status === SpaceStatus.SUSPENDED
        ) {
            if (!dto.reason) {
                throw new BadRequestException(
                    'Please provide a reason for rejection or suspension',
                );
            }

            if(space.vendor.vendorStatus === 'SUSPENDED') {
                throw new BadRequestException('Vendor is suspended');
            }
        }
    }

    static areAllSpacesSuspended(spaces: SpacesToBeUpdated): boolean {
        const suspendedSpaces = spaces.vendor.spaces.filter(
            (s) => s.status === SpaceStatus.SUSPENDED,
        );

        return suspendedSpaces.length + 1 === spaces.vendor.spaces.length;
    }
}
