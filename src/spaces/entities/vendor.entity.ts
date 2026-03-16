import { BadRequestException } from '@nestjs/common';
import { VendorStatus } from '@prisma/client';

export class VendorEntity {
    static validateCanCreateSpace(vendorStatus: VendorStatus, city: string | null) {
        if (city === null) {
            throw new BadRequestException(
                'Fill in your city details before attempting to create a space',
            );
        }

        if (vendorStatus === VendorStatus.REJECTED) {
            throw new BadRequestException(
                'Your profile is currently prohibited from creating spaces',
            );
        }
    }

    static isFirstSpace(spacesCount: number): boolean {
        return spacesCount === 0;
    }
}
