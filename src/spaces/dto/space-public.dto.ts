import { ApiProperty } from '@nestjs/swagger';
import {
    SpaceAmenities,
    SpaceStatus,
    SpaceType,
    VendorStatus,
} from '@prisma/client';
import { Expose, Type } from 'class-transformer';

export class SpacePublicDto {
    @ApiProperty()
    @Expose()
    id: string;

    @ApiProperty()
    @Expose()
    name: string;

    @ApiProperty()
    @Expose()
    description: string;

    @ApiProperty()
    @Expose()
    capacity: number;

    @ApiProperty({ enum: SpaceType })
    @Expose()
    spaceType: SpaceType;

    @ApiProperty()
    @Type(() => Number)
    @Expose()
    pricePerHour: number;

    @ApiProperty({ enum: SpaceStatus })
    @Expose()
    status: SpaceStatus;

    @ApiProperty({
        example: [
            {
                id: 'cmmdtrjlx001kqo011c79l6in',
                spaceId: 'cmmdtrfio001jqo01cm0trqbj',
                url: 'https://xouczrsenrzrjpskelxa.supabase.co/storage/v1/object/public/spaces/cmlnqt8rp00000wplhnx0zt1p/423964cf-426c-49c3-bdd1-1a0a0e217d7e.png',
                order: 1,
            },
            {
                id: 'cmmdtrjlx001lqo01gd563xqk',
                spaceId: 'cmmdtrfio001jqo01cm0trqbj',
                url: 'https://xouczrsenrzrjpskelxa.supabase.co/storage/v1/object/public/spaces/cmlnqt8rp00000wplhnx0zt1p/be30d1d2-de9d-4086-bf77-5df2fdad44ee.jpg',
                order: 2,
            },
            {
                id: 'cmmdtrjlx001mqo011hclt6e7',
                spaceId: 'cmmdtrfio001jqo01cm0trqbj',
                url: 'https://xouczrsenrzrjpskelxa.supabase.co/storage/v1/object/public/spaces/cmlnqt8rp00000wplhnx0zt1p/570adcf3-b0f7-4eb6-aef3-46c5eaa7db3f.jpg',
                order: 3,
            },
        ],
    })
    @Expose()
    images: string[];

    @ApiProperty({
        example: ['https://storage.../img1.pdf', 'https://storage.../img2.pdf'],
    })
    @Expose()
    instructionsPdf: string[];

    @ApiProperty({
        example: { businessName: 'Yoga Oslo AS', vendorStatus: 'APPROVED' },
    })
    @Expose()
    vendorSummary: {
        businessName: string;
        vendorStatus: VendorStatus;
    };

    @ApiProperty({
        description: 'Amenities of the space',
        enum: SpaceAmenities,
        enumName: 'SpaceAmenities',
        type: [SpaceAmenities],
        example: [SpaceAmenities.WIFI, SpaceAmenities.PARKING],
    })
    @Expose()
    amenities: SpaceAmenities[];

    @ApiProperty({ example: ['No smoking', 'No pets'] })
    @Expose()
    rules: string[] | null;

    @ApiProperty({ example: true })
    @Expose()
    isAvailable: boolean;

    @ApiProperty({ example: ['2023-05-16'] })
    @Expose()
    daysBlocked: string[] | null;

    @ApiProperty({ example: 'Oslo' })
    @Expose()
    city: string;

    @ApiProperty({ example: 'Oslo, Norway, Oslo kommune' })
    @Expose()
    address: string;

    @ApiProperty({ example: 'Google Maps link to the location' })
    @Expose()
    location: string;

    @ApiProperty({ example: 'Europe/Oslo' })
    @Expose()
    timezone: string;
}
