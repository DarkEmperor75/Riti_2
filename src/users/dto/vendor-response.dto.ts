import { ApiProperty } from '@nestjs/swagger';
import { VendorStatus } from '@prisma/client';
import { Expose } from 'class-transformer';

export class VendorProfileResponseDto {
    @ApiProperty({ example: '123e4567-e89b-12d3-a456-426655440000' })
    @Expose()
    id: string;

    @ApiProperty({ enum: VendorStatus })
    @Expose()
    status: VendorStatus;

    @ApiProperty({ example: true })
    @Expose()
    isOnBoarded: boolean;

    @ApiProperty({ example: 'Ola Nordmann' })
    @Expose()
    businessName: string;

    @ApiProperty({ example: '+47 8912 1221' })
    @Expose()
    contactPhone: string;

    @ApiProperty({ example: 'johndoe@example' })
    @Expose()
    contactEmail: string;

    @ApiProperty({ example: 'Oslo' })
    @Expose()
    city: string;

    @ApiProperty({ example: 'Hello, I am Ola Nordmann' })
    @Expose()
    description?: string;
}
