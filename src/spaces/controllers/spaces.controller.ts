import {
    Controller,
    Post,
    Body,
    UseGuards,
    UseInterceptors,
    UploadedFiles,
    Get,
    Query,
    Put,
    Param,
    BadRequestException,
    Patch,
    Delete,
    Logger,
} from '@nestjs/common';
import { SpacesService } from '../services';
import {
    CreateSpaceDto,
    UpdateSpaceDto,
    SpaceResponseDto,
    SpaceListResponseDto,
    SpaceCalendarResponseDto,
    ReplaceSpaceFilesDto,
    SpacePublicDto,
    DiscoverSpacesQueryDto,
    BlockDaysDto,
    BlockDaysResultItemDto,
    BlockedDaysResponseDto,
} from '../dto';
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiBody,
    ApiConflictResponse,
    ApiConsumes,
    ApiCreatedResponse,
    ApiForbiddenResponse,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiOperation,
    ApiParam,
    ApiQuery,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { VendorProfileGuard } from 'src/users/guards';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { GetUser, Public } from 'src/auth/decorators';
import { type UserForTokenDto } from 'src/auth/interfaces';
import { JwtAuthGuard, SuspentionGuard } from 'src/auth/guards';
import { SpaceStatus, SpaceType } from '@prisma/client';

@ApiTags('Spaces')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, SuspentionGuard, VendorProfileGuard)
@Controller('spaces')
export class SpacesController {
    private readonly logger = new Logger(SpacesController.name);
    constructor(private readonly spacesService: SpacesService) {}

    @Get()
    @ApiOperation({ summary: 'Discover available spaces' })
    @ApiQuery({ name: 'city', example: 'Oslo' })
    @ApiQuery({ name: 'spaceType', enum: SpaceType, example: 'YOGA_STUDIO' })
    @ApiQuery({ name: 'capacityMin', example: 10 })
    @ApiQuery({ name: 'priceHourlyMax', example: 300 })
    @ApiQuery({ name: 'date', example: '2026-03-15' })
    @ApiQuery({ name: 'page', example: 1 })
    @ApiQuery({ name: 'limit', example: 20 })
    @ApiQuery({
        name: 'sortBy',
        enum: ['pricePerHour', 'capacity', 'createdAt'],
    })
    @ApiQuery({ name: 'order', enum: ['asc', 'desc'] })
    @ApiOkResponse({
        description: 'List of spaces',
        type: SpaceListResponseDto,
        examples: {
            SuccessRes1: {
                summary: 'List of spaces without queries',
                value: {
                    spaces: [
                        {
                            id: 'cmlntv5ad00020w1cd485og40',
                            name: 'Noida darbar',
                            images: [
                                {
                                    id: 'cmlntva6000030w1cy66lia4m',
                                    spaceId: 'cmlntv5ad00020w1cd485og40',
                                    url: 'https://xouczrsenrzrjpskelxa.supabase.co/storage/v1/object/public/spaces/cmlnqt8rp00000wplhnx0zt1p/097892a8-8cd4-48f4-86b1-fa91cc86d795.png',
                                    order: 1,
                                },
                            ],
                            pricePerHour: 122.32,
                            status: 'ACTIVE',
                            description: 'Kirmanistan',
                            capacity: 1221,
                            spaceType: 'STUDIO',
                            vendor: {
                                businessName: 'Oslo Venue Pros',
                                vendorStatus: 'APPROVED',
                            },
                        },
                        {
                            id: 'cmlnt8drm00000wbyqfqjmfem',
                            name: 'Noida darbar',
                            images: [
                                {
                                    id: 'cmlnt8in300010wbyejib9ugf',
                                    spaceId: 'cmlnt8drm00000wbyqfqjmfem',
                                    url: 'https://xouczrsenrzrjpskelxa.supabase.co/storage/v1/object/public/spaces/cmlnqt8rp00000wplhnx0zt1p/0a166ab2-c485-4598-9cb9-525ccc137fef.png',
                                    order: 1,
                                },
                            ],
                            pricePerHour: 122.32,
                            status: 'ACTIVE',
                            description: 'Kirmanistan',
                            capacity: 213,
                            spaceType: 'STUDIO',
                            vendor: {
                                businessName: 'Oslo Venue Pros',
                                vendorStatus: 'APPROVED',
                            },
                        },
                        {
                            id: 'cmlnqyb0p000o0wf2bmeiz374',
                            name: 'Conference Room',
                            images: [
                                {
                                    id: 'cmlnqyb0p000p0wf2owjcdldu',
                                    spaceId: 'cmlnqyb0p000o0wf2bmeiz374',
                                    url: 'https://picsum.photos/800/600?random=5',
                                    order: 0,
                                },
                            ],
                            pricePerHour: 900,
                            status: 'ACTIVE',
                            description: 'Capacity 80. Great for conferences.',
                            capacity: 80,
                            spaceType: 'CONFERENCE_ROOM',
                            vendor: {
                                businessName: 'Oslo Venue Pros',
                                vendorStatus: 'APPROVED',
                            },
                        },
                        {
                            id: 'cmlnqya3z000k0wf2728p4ft5',
                            name: 'Art Gallery',
                            images: [
                                {
                                    id: 'cmlnqya3z000l0wf2abbbzu2r',
                                    spaceId: 'cmlnqya3z000k0wf2728p4ft5',
                                    url: 'https://picsum.photos/800/600?random=4',
                                    order: 0,
                                },
                            ],
                            pricePerHour: 800,
                            status: 'ACTIVE',
                            description: 'Capacity 70. Great for art.',
                            capacity: 70,
                            spaceType: 'AUDITORIUM',
                            vendor: {
                                businessName: 'Oslo Venue Pros',
                                vendorStatus: 'APPROVED',
                            },
                        },
                        {
                            id: 'cmlnqy977000g0wf2ov1n1h4c',
                            name: 'Cozy Yoga Space',
                            images: [
                                {
                                    id: 'cmlnqy977000h0wf2zzd4gl21',
                                    spaceId: 'cmlnqy977000g0wf2ov1n1h4c',
                                    url: 'https://picsum.photos/800/600?random=3',
                                    order: 0,
                                },
                            ],
                            pricePerHour: 700,
                            status: 'ACTIVE',
                            description: 'Capacity 60. Great for yoga.',
                            capacity: 60,
                            spaceType: 'WORKSHOP',
                            vendor: {
                                businessName: 'Oslo Venue Pros',
                                vendorStatus: 'APPROVED',
                            },
                        },
                        {
                            id: 'cmlnqy8a7000c0wf2pnrkbinh',
                            name: 'Workshop Hall',
                            images: [
                                {
                                    id: 'cmlnqy8a7000d0wf2vd54nh8j',
                                    spaceId: 'cmlnqy8a7000c0wf2pnrkbinh',
                                    url: 'https://picsum.photos/800/600?random=2',
                                    order: 0,
                                },
                            ],
                            pricePerHour: 600,
                            status: 'ACTIVE',
                            description: 'Capacity 50. Great for meetings.',
                            capacity: 50,
                            spaceType: 'GALLERY',
                            vendor: {
                                businessName: 'Oslo Venue Pros',
                                vendorStatus: 'APPROVED',
                            },
                        },
                        {
                            id: 'cmlnqy7dc00080wf2hqt13c28',
                            name: 'Startup Studio',
                            images: [
                                {
                                    id: 'cmlnqy7dc00090wf2b0lzdtfn',
                                    spaceId: 'cmlnqy7dc00080wf2hqt13c28',
                                    url: 'https://picsum.photos/800/600?random=1',
                                    order: 0,
                                },
                            ],
                            pricePerHour: 500,
                            status: 'ACTIVE',
                            description: 'Capacity 40. Great for music.',
                            capacity: 40,
                            spaceType: 'HALL',
                            vendor: {
                                businessName: 'Shashwat Singh',
                                vendorStatus: 'APPROVED',
                            },
                        },
                        {
                            id: 'cmlnqy6fi00040wf2u2v22oym',
                            name: 'Ram Ram Ji',
                            images: [
                                {
                                    id: 'cmlnqy6fi00050wf2d1qcloz4',
                                    spaceId: 'cmlnqy6fi00040wf2u2v22oym',
                                    url: 'https://picsum.photos/800/600?random=0',
                                    order: 0,
                                },
                            ],
                            pricePerHour: 400,
                            status: 'ACTIVE',
                            description: 'Capacity 30. Great for workshops.',
                            capacity: 30,
                            spaceType: 'STUDIO',
                            vendor: {
                                businessName: 'Oslo Venue Pros',
                                vendorStatus: 'APPROVED',
                            },
                        },
                    ],
                    meta: {
                        page: 1,
                        limit: 20,
                        total: 8,
                        totalPages: 1,
                    },
                },
            },
            SuccesRes2: {
                summary:
                    'Returns a list of spaces with query: ?capacityMin=213',
                value: {
                    spaces: [
                        {
                            id: 'cmlntv5ad00020w1cd485og40',
                            name: 'Noida darbar',
                            images: [
                                {
                                    id: 'cmlntva6000030w1cy66lia4m',
                                    spaceId: 'cmlntv5ad00020w1cd485og40',
                                    url: 'https://xouczrsenrzrjpskelxa.supabase.co/storage/v1/object/public/spaces/cmlnqt8rp00000wplhnx0zt1p/097892a8-8cd4-48f4-86b1-fa91cc86d795.png',
                                    order: 1,
                                },
                            ],
                            pricePerHour: 122.32,
                            status: 'ACTIVE',
                            description: 'Kirmanistan',
                            capacity: 1221,
                            spaceType: 'STUDIO',
                            vendor: {
                                businessName: 'Oslo Venue Pros',
                                vendorStatus: 'APPROVED',
                            },
                        },
                        {
                            id: 'cmlnt8drm00000wbyqfqjmfem',
                            name: 'Noida darbar',
                            images: [
                                {
                                    id: 'cmlnt8in300010wbyejib9ugf',
                                    spaceId: 'cmlnt8drm00000wbyqfqjmfem',
                                    url: 'https://xouczrsenrzrjpskelxa.supabase.co/storage/v1/object/public/spaces/cmlnqt8rp00000wplhnx0zt1p/0a166ab2-c485-4598-9cb9-525ccc137fef.png',
                                    order: 1,
                                },
                            ],
                            pricePerHour: 122.32,
                            status: 'ACTIVE',
                            description: 'Kirmanistan',
                            capacity: 213,
                            spaceType: 'STUDIO',
                            vendor: {
                                businessName: 'Oslo Venue Pros',
                                vendorStatus: 'APPROVED',
                            },
                        },
                    ],
                    meta: {
                        page: 1,
                        limit: 20,
                        total: 2,
                        totalPages: 1,
                    },
                },
            },
            SuccessRes2: {
                summary:
                    'Returns a list of spaces with query: ?sortBy=capacity&date=2026-03-26',
                value: {
                    spaces: [
                        {
                            id: 'cmlntv5ad00020w1cd485og40',
                            name: 'Noida darbar',
                            images: [
                                {
                                    id: 'cmlntva6000030w1cy66lia4m',
                                    spaceId: 'cmlntv5ad00020w1cd485og40',
                                    url: 'https://xouczrsenrzrjpskelxa.supabase.co/storage/v1/object/public/spaces/cmlnqt8rp00000wplhnx0zt1p/097892a8-8cd4-48f4-86b1-fa91cc86d795.png',
                                    order: 1,
                                },
                            ],
                            pricePerHour: 122.32,
                            spaceType: 'STUDIO',
                            status: 'ACTIVE',
                            description: 'Kirmanistan',
                            capacity: 1221,
                            vendor: {
                                businessName: 'Oslo Venue Pros',
                                vendorStatus: 'APPROVED',
                            },
                        },
                        {
                            id: 'cmlnt8drm00000wbyqfqjmfem',
                            name: 'Noida darbar',
                            images: [
                                {
                                    id: 'cmlnt8in300010wbyejib9ugf',
                                    spaceId: 'cmlnt8drm00000wbyqfqjmfem',
                                    url: 'https://xouczrsenrzrjpskelxa.supabase.co/storage/v1/object/public/spaces/cmlnqt8rp00000wplhnx0zt1p/0a166ab2-c485-4598-9cb9-525ccc137fef.png',
                                    order: 1,
                                },
                            ],
                            pricePerHour: 122.32,
                            spaceType: 'STUDIO',
                            status: 'ACTIVE',
                            description: 'Kirmanistan',
                            capacity: 213,
                            vendor: {
                                businessName: 'Oslo Venue Pros',
                                vendorStatus: 'APPROVED',
                            },
                        },
                        {
                            id: 'cmlnqyb0p000o0wf2bmeiz374',
                            name: 'Conference Room',
                            images: [
                                {
                                    id: 'cmlnqyb0p000p0wf2owjcdldu',
                                    spaceId: 'cmlnqyb0p000o0wf2bmeiz374',
                                    url: 'https://picsum.photos/800/600?random=5',
                                    order: 0,
                                },
                            ],
                            pricePerHour: 900,
                            spaceType: 'CONFERENCE_ROOM',
                            status: 'ACTIVE',
                            description: 'Capacity 80. Great for conferences.',
                            capacity: 80,
                            vendor: {
                                businessName: 'Oslo Venue Pros',
                                vendorStatus: 'APPROVED',
                            },
                        },
                        {
                            id: 'cmlnqya3z000k0wf2728p4ft5',
                            name: 'Art Gallery',
                            images: [
                                {
                                    id: 'cmlnqya3z000l0wf2abbbzu2r',
                                    spaceId: 'cmlnqya3z000k0wf2728p4ft5',
                                    url: 'https://picsum.photos/800/600?random=4',
                                    order: 0,
                                },
                            ],
                            pricePerHour: 800,
                            spaceType: 'AUDITORIUM',
                            status: 'ACTIVE',
                            description: 'Capacity 70. Great for art.',
                            capacity: 70,
                            vendor: {
                                businessName: 'Oslo Venue Pros',
                                vendorStatus: 'APPROVED',
                            },
                        },
                        {
                            id: 'cmlnqy977000g0wf2ov1n1h4c',
                            name: 'Cozy Yoga Space',
                            images: [
                                {
                                    id: 'cmlnqy977000h0wf2zzd4gl21',
                                    spaceId: 'cmlnqy977000g0wf2ov1n1h4c',
                                    url: 'https://picsum.photos/800/600?random=3',
                                    order: 0,
                                },
                            ],
                            pricePerHour: 700,
                            spaceType: 'WORKSHOP',
                            status: 'ACTIVE',
                            description: 'Capacity 60. Great for yoga.',
                            capacity: 60,
                            vendor: {
                                businessName: 'Oslo Venue Pros',
                                vendorStatus: 'APPROVED',
                            },
                        },
                        {
                            id: 'cmlnqy8a7000c0wf2pnrkbinh',
                            name: 'Workshop Hall',
                            images: [
                                {
                                    id: 'cmlnqy8a7000d0wf2vd54nh8j',
                                    spaceId: 'cmlnqy8a7000c0wf2pnrkbinh',
                                    url: 'https://picsum.photos/800/600?random=2',
                                    order: 0,
                                },
                            ],
                            pricePerHour: 600,
                            spaceType: 'GALLERY',
                            status: 'ACTIVE',
                            description: 'Capacity 50. Great for meetings.',
                            capacity: 50,
                            vendor: {
                                businessName: 'Oslo Venue Pros',
                                vendorStatus: 'APPROVED',
                            },
                        },
                        {
                            id: 'cmlnqy7dc00080wf2hqt13c28',
                            name: 'Startup Studio',
                            images: [
                                {
                                    id: 'cmlnqy7dc00090wf2b0lzdtfn',
                                    spaceId: 'cmlnqy7dc00080wf2hqt13c28',
                                    url: 'https://picsum.photos/800/600?random=1',
                                    order: 0,
                                },
                            ],
                            pricePerHour: 500,
                            spaceType: 'HALL',
                            status: 'ACTIVE',
                            description: 'Capacity 40. Great for music.',
                            capacity: 40,
                            vendor: {
                                businessName: 'Shashwat Singh',
                                vendorStatus: 'APPROVED',
                            },
                        },
                        {
                            id: 'cmlnqy6fi00040wf2u2v22oym',
                            name: 'Ram Ram Ji',
                            images: [
                                {
                                    id: 'cmlnqy6fi00050wf2d1qcloz4',
                                    spaceId: 'cmlnqy6fi00040wf2u2v22oym',
                                    url: 'https://picsum.photos/800/600?random=0',
                                    order: 0,
                                },
                            ],
                            pricePerHour: 400,
                            spaceType: 'STUDIO',
                            status: 'ACTIVE',
                            description: 'Capacity 30. Great for workshops.',
                            capacity: 30,
                            vendor: {
                                businessName: 'Oslo Venue Pros',
                                vendorStatus: 'APPROVED',
                            },
                        },
                    ],
                    meta: {
                        page: 1,
                        limit: 20,
                        total: 8,
                        totalPages: 1,
                    },
                },
            },
        },
    })
    @Public()
    async discoverSpaces(
        @Query() query: DiscoverSpacesQueryDto,
    ): Promise<SpaceListResponseDto> {
        this.logger.debug('Discovering spaces');
        return this.spacesService.discoverSpaces(query);
    }

    @Post()
    @ApiOperation({ summary: 'Create a new space listing' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        description: `
            ### File Uploads (separate from JSON body):
            - \`images\` (array, max 5, min 3 required for approval)
            - \`instructionsPdf\` (optional, max 1)
            
            ### JSON Body: Space details (see DTO)
        `,
        type: 'multipart/form-data',
        schema: {
            type: 'object',
            properties: {
                name: { type: 'string', example: 'Cozy Yoga Studio' },
                description: {
                    type: 'string',
                    example:
                        'Perfect for yoga classes and small workshops. Natural light, wooden floors, sound system included.',
                },
                capacity: { type: 'number', example: 20 },
                pricePerHour: { type: 'number', example: 50 },
                address: {
                    type: 'string',
                    example: 'Storgata 1, 0155 Oslo, Norway',
                },
                spaceType: { type: 'string', example: 'STUDIO' },
                rules: {
                    type: 'array',
                    items: { type: 'string' },
                },
                minBookingDurationHours: { type: 'number', example: 12 },
                minLeadTimeHours: { type: 'number', example: 24 },
                multiDayBookingAllowed: { type: 'boolean', example: true },
                images: {
                    type: 'array',
                    items: { type: 'string', format: 'binary' },
                },
                instructionsPdf: {
                    type: 'array',
                    items: { type: 'string', format: 'binary' },
                },
            },
        },
    })
    @ApiCreatedResponse({
        description: 'Space created successfully (status: UNDER_REVIEW)',
        type: SpaceResponseDto,
        example: {
            id: 'cmlntv5ad00020w1cd485og40',
            name: 'Noida darbar',
            description: 'Kirmanistan',
            capacity: 213,
            address: 'Johan Jagrata Street, Near New Kosovo',
            spaceType: 'STUDIO',
            rules: ['Come to my house', 'Clean my house', '5 hour window'],
            pricePerHour: 122.32,
            minBookingDurationHours: 12,
            minLeadTimeHours: 24,
            multiDayBookingAllowed: true,
            city: 'Oslo',
            status: 'UNDER_REVIEW',
            isSuspended: false,
            instructionsPdfsUrls: [
                'https://xouczrsenrzrjpskelxa.supabase.co/storage/v1/object/public/spaces/cmlnqt8rp00000wplhnx0zt1p/6138d590-1418-4174-aec7-4b7dd3d69354.pdf',
                'https://xouczrsenrzrjpskelxa.supabase.co/storage/v1/object/public/spaces/cmlnqt8rp00000wplhnx0zt1p/327ab223-5620-41ef-96b5-c9a46c741234.pdf',
            ],
            vendorId: 'cmlnqy5i800020wf2lsycnjfi',
            createdAt: '2026-02-15T14:15:23.269Z',
            updatedAt: '2026-02-15T14:15:23.269Z',
            imagesUrls: [
                'https://xouczrsenrzrjpskelxa.supabase.co/storage/v1/object/public/spaces/cmlnqt8rp00000wplhnx0zt1p/097892a8-8cd4-48f4-86b1-fa91cc86d795.png',
                'https://xouczrsenrzrjpskelxa.supabase.co/storage/v1/object/public/spaces/cmlnqt8rp00000wplhnx0zt1p/c855cbe6-5174-4782-bb10-b264766edaaa.jpg',
                'https://xouczrsenrzrjpskelxa.supabase.co/storage/v1/object/public/spaces/cmlnqt8rp00000wplhnx0zt1p/12b76bf6-5708-4e88-9a03-b4f441aa164e.png',
                'https://xouczrsenrzrjpskelxa.supabase.co/storage/v1/object/public/spaces/cmlnqt8rp00000wplhnx0zt1p/f414e3c9-3e28-4769-abbf-f5f07357f92a.png',
                'https://xouczrsenrzrjpskelxa.supabase.co/storage/v1/object/public/spaces/cmlnqt8rp00000wplhnx0zt1p/e31a260b-6daf-4b26-857f-ca8905e54a85.jpg',
            ],
        },
    })
    @ApiBadRequestResponse({
        description: 'Invalid request',
        examples: {
            NoCityFound: {
                summary: 'No city found',
                value: {
                    statusCode: 400,
                    timestamp: '2026-02-15T13:32:31.614Z',
                    path: '/api/spaces',
                    message: {
                        message:
                            'Fill in your city details before attempting to create a space',
                        error: 'Bad Request',
                        statusCode: 400,
                    },
                },
            },
            InvalidInput: {
                summary: 'Invalid input data from dto',
                value: {
                    statusCode: 400,
                    timestamp: '2026-02-15T14:19:18.029Z',
                    path: '/api/spaces',
                    message: {
                        message: [
                            'Name must be between 3 and 100 characters',
                            'Name must be a string',
                            'Description cannot exceed 2000 characters',
                            'Description must be at least 5 characters',
                            'Description must be a string',
                            'Capacity must be at least 1',
                            'Capacity must be an integer',
                            'Address must be between 5 and 200 characters',
                            'Address must be a string',
                            'Invalid space type. Must be one of: STUDIO, HALL, GALLERY, WORKSHOP, AUDITORIUM, CONFERENCE_ROOM, BOARDROOM, OFFICE, LIBRARY, LABORATORY, THEATER, EXHIBITION_SPACE, COMMUNITY_CENTER, FITNESS_CENTER, YOGA_STUDIO, RETAIL_SPACE, RESTAURANT, OUTDOOR_SPACE, OTHER',
                        ],
                        error: 'Bad Request',
                        statusCode: 400,
                    },
                },
            },
        },
    })
    @UseInterceptors(
        FileFieldsInterceptor([
            { name: 'images', maxCount: 5 },
            { name: 'instructionsPdf', maxCount: 2 },
        ]),
    )
    async createSpace(
        @Body() dto: CreateSpaceDto,
        @UploadedFiles()
        files: {
            images: Express.Multer.File[];
            instructionsPdf: Express.Multer.File[];
        },
        @GetUser() user: UserForTokenDto,
    ): Promise<{
        success: boolean;
        message: string;
    }> {
        if (!files.images || !files.instructionsPdf)
            throw new BadRequestException(
                'You must upload images and pdf for space creation',
            );
        if (files.images.length < 3)
            throw new BadRequestException(
                'You must upload at least 3 images for space creation',
            );
        if (files.instructionsPdf.length < 1)
            throw new BadRequestException(
                'You must upload at least 1 pdf for space creation',
            );

        return this.spacesService.createSpace(user.id, dto, files);
    }

    @Get('my-listings')
    @ApiOperation({ summary: "Get vendor's space listings (all statuses)" })
    @ApiQuery({ name: 'status', enum: SpaceStatus, required: false })
    @ApiQuery({ name: 'page', required: false, example: 1 })
    @ApiQuery({ name: 'limit', required: false, example: 20 })
    @ApiOkResponse({
        type: SpaceListResponseDto,
        isArray: true,
        example: {
            spaces: [
                {
                    id: 'cmlntv5ad00020w1cd485og40',
                    name: 'Noida darbar',
                    description: 'Kirmanistan',
                    capacity: 213,
                    address: 'Johan Jagrata Street, Near New Kosovo',
                    spaceType: 'STUDIO',
                    rules: [
                        'Come to my house',
                        'Clean my house',
                        '5 hour window',
                    ],
                    pricePerHour: 122.32,
                    minBookingDurationHours: 12,
                    minLeadTimeHours: 24,
                    multiDayBookingAllowed: true,
                    city: 'Oslo',
                    status: 'UNDER_REVIEW',
                    isSuspended: false,
                    vendorId: 'cmlnqy5i800020wf2lsycnjfi',
                    createdAt: '2026-02-15T14:15:23.269Z',
                    updatedAt: '2026-02-15T14:15:23.269Z',
                    images: [
                        {
                            id: 'cmlntva6000030w1cy66lia4m',
                            spaceId: 'cmlntv5ad00020w1cd485og40',
                            url: 'https://xouczrsenrzrjpskelxa.supabase.co/storage/v1/object/public/spaces/cmlnqt8rp00000wplhnx0zt1p/097892a8-8cd4-48f4-86b1-fa91cc86d795.png',
                            order: 1,
                        },
                    ],
                    vendor: {
                        businessName: 'Oslo Venue Pros',
                        vendorStatus: 'APPROVED',
                    },
                },
                {
                    id: 'cmlnt8drm00000wbyqfqjmfem',
                    name: 'Noida darbar',
                    description: 'Kirmanistan',
                    capacity: 213,
                    address: 'Johan Jagrata Street, Near Kosovo ',
                    spaceType: 'STUDIO',
                    rules: [
                        'Come to my house',
                        'Clean my house',
                        '5 hour window',
                    ],
                    pricePerHour: 122.32,
                    minBookingDurationHours: 12,
                    minLeadTimeHours: 24,
                    multiDayBookingAllowed: true,
                    city: 'Oslo',
                    status: 'UNDER_REVIEW',
                    isSuspended: false,
                    vendorId: 'cmlnqy5i800020wf2lsycnjfi',
                    createdAt: '2026-02-15T13:57:41.170Z',
                    updatedAt: '2026-02-15T13:57:41.170Z',
                    images: [
                        {
                            id: 'cmlnt8in300010wbyejib9ugf',
                            spaceId: 'cmlnt8drm00000wbyqfqjmfem',
                            url: 'https://xouczrsenrzrjpskelxa.supabase.co/storage/v1/object/public/spaces/cmlnqt8rp00000wplhnx0zt1p/0a166ab2-c485-4598-9cb9-525ccc137fef.png',
                            order: 1,
                        },
                    ],
                    vendor: {
                        businessName: 'Oslo Venue Pros',
                        vendorStatus: 'APPROVED',
                    },
                },
                {
                    id: 'cmlnqyb0p000o0wf2bmeiz374',
                    name: 'Conference Room',
                    description: 'Capacity 80. Great for conferences.',
                    capacity: 80,
                    address: 'Karl Johans gate 35',
                    spaceType: 'CONFERENCE_ROOM',
                    rules: [],
                    pricePerHour: 900,
                    minBookingDurationHours: null,
                    minLeadTimeHours: null,
                    multiDayBookingAllowed: null,
                    city: 'Oslo',
                    status: 'UNDER_REVIEW',
                    isSuspended: false,
                    vendorId: 'cmlnqy5i800020wf2lsycnjfi',
                    createdAt: '2026-02-15T12:53:51.818Z',
                    updatedAt: '2026-02-15T12:53:51.818Z',
                    images: [
                        {
                            id: 'cmlnqyb0p000p0wf2owjcdldu',
                            spaceId: 'cmlnqyb0p000o0wf2bmeiz374',
                            url: 'https://picsum.photos/800/600?random=5',
                            order: 0,
                        },
                    ],
                    vendor: {
                        businessName: 'Oslo Venue Pros',
                        vendorStatus: 'APPROVED',
                    },
                },
                {
                    id: 'cmlnqya3z000k0wf2728p4ft5',
                    name: 'Art Gallery',
                    description: 'Capacity 70. Great for art.',
                    capacity: 70,
                    address: 'Karl Johans gate 30',
                    spaceType: 'AUDITORIUM',
                    rules: [],
                    pricePerHour: 800,
                    minBookingDurationHours: null,
                    minLeadTimeHours: null,
                    multiDayBookingAllowed: null,
                    city: 'Oslo',
                    status: 'UNDER_REVIEW',
                    isSuspended: false,
                    vendorId: 'cmlnqy5i800020wf2lsycnjfi',
                    createdAt: '2026-02-15T12:53:50.639Z',
                    updatedAt: '2026-02-15T12:53:50.639Z',
                    images: [
                        {
                            id: 'cmlnqya3z000l0wf2abbbzu2r',
                            spaceId: 'cmlnqya3z000k0wf2728p4ft5',
                            url: 'https://picsum.photos/800/600?random=4',
                            order: 0,
                        },
                    ],
                    vendor: {
                        businessName: 'Oslo Venue Pros',
                        vendorStatus: 'APPROVED',
                    },
                },
                {
                    id: 'cmlnqy977000g0wf2ov1n1h4c',
                    name: 'Cozy Yoga Space',
                    description: 'Capacity 60. Great for yoga.',
                    capacity: 60,
                    address: 'Karl Johans gate 25',
                    spaceType: 'WORKSHOP',
                    rules: [],
                    pricePerHour: 700,
                    minBookingDurationHours: null,
                    minLeadTimeHours: null,
                    multiDayBookingAllowed: null,
                    city: 'Oslo',
                    status: 'UNDER_REVIEW',
                    isSuspended: false,
                    vendorId: 'cmlnqy5i800020wf2lsycnjfi',
                    createdAt: '2026-02-15T12:53:49.459Z',
                    updatedAt: '2026-02-15T12:53:49.459Z',
                    images: [
                        {
                            id: 'cmlnqy977000h0wf2zzd4gl21',
                            spaceId: 'cmlnqy977000g0wf2ov1n1h4c',
                            url: 'https://picsum.photos/800/600?random=3',
                            order: 0,
                        },
                    ],
                    vendor: {
                        businessName: 'Oslo Venue Pros',
                        vendorStatus: 'APPROVED',
                    },
                },
            ],
            meta: {
                page: 1,
                limit: 5,
                total: 8,
                totalPages: 2,
            },
        },
    })
    async getMySpaces(
        @GetUser() user: UserForTokenDto,
        @Query('page') page = 1,
        @Query('limit') limit = 20,
        @Query('status') status?: SpaceStatus,
    ): Promise<SpaceListResponseDto> {
        return this.spacesService.getVendorSpaces(user.id, {
            page,
            limit,
            status,
        });
    }

    @Get('calendar')
    @ApiOperation({ summary: 'Vendor calendar - all spaces availability' })
    @ApiQuery({
        name: 'spaceIds',
        type: [String],
        example: 'cl1,cl2',
        required: false,
    })
    @ApiQuery({ name: 'startDate', example: '2026-03-01' })
    @ApiQuery({ name: 'endDate', example: '2026-03-31' })
    @ApiOkResponse({
        type: SpaceCalendarResponseDto,
        description: 'Space calendar',
        examples: {
            SuccessRes1: {
                summary: 'Success response 1',
                value: {
                    spaces: [
                        {
                            id: 'cmlnqy8a7000c0wf2pnrkbinh',
                            name: 'Workshop Hall',
                            status: 'UNDER_REVIEW',
                            bookings: [],
                            blockedSlots: [],
                            isAvailableNow: false,
                        },
                        {
                            id: 'cmlnqy977000g0wf2ov1n1h4c',
                            name: 'Cozy Yoga Space',
                            status: 'UNDER_REVIEW',
                            bookings: [],
                            blockedSlots: [],
                            isAvailableNow: false,
                        },
                        {
                            id: 'cmlnqya3z000k0wf2728p4ft5',
                            name: 'Art Gallery',
                            status: 'UNDER_REVIEW',
                            bookings: [],
                            blockedSlots: [],
                            isAvailableNow: false,
                        },
                        {
                            id: 'cmlnqyb0p000o0wf2bmeiz374',
                            name: 'Conference Room',
                            status: 'UNDER_REVIEW',
                            bookings: [],
                            blockedSlots: [],
                            isAvailableNow: false,
                        },
                        {
                            id: 'cmlnt8drm00000wbyqfqjmfem',
                            name: 'Noida darbar',
                            status: 'UNDER_REVIEW',
                            bookings: [],
                            blockedSlots: [],
                            isAvailableNow: false,
                        },
                        {
                            id: 'cmlntv5ad00020w1cd485og40',
                            name: 'Noida darbar',
                            status: 'PAUSED',
                            bookings: [],
                            blockedSlots: [],
                            isAvailableNow: false,
                        },
                    ],
                    summary: {
                        busySlots: 0,
                        availableSlots: 0,
                        upcomingBookings: 0,
                    },
                },
            },
            SuccessRes2: {
                summary: 'Success response 2',
                value: {
                    spaces: [
                        {
                            id: 'cmlnqy8a7000c0wf2pnrkbinh',
                            name: 'Workshop Hall',
                            status: 'UNDER_REVIEW',
                            bookings: [],
                            blockedSlots: [],
                            isAvailableNow: false,
                        },
                        {
                            id: 'cmlnqy977000g0wf2ov1n1h4c',
                            name: 'Cozy Yoga Space',
                            status: 'UNDER_REVIEW',
                            bookings: [],
                            blockedSlots: [],
                            isAvailableNow: false,
                        },
                        {
                            id: 'cmlnqya3z000k0wf2728p4ft5',
                            name: 'Art Gallery',
                            status: 'UNDER_REVIEW',
                            bookings: [],
                            blockedSlots: [],
                            isAvailableNow: false,
                        },
                        {
                            id: 'cmlnqyb0p000o0wf2bmeiz374',
                            name: 'Conference Room',
                            status: 'UNDER_REVIEW',
                            bookings: [],
                            blockedSlots: [],
                            isAvailableNow: false,
                        },
                        {
                            id: 'cmlnt8drm00000wbyqfqjmfem',
                            name: 'Noida darbar',
                            status: 'UNDER_REVIEW',
                            bookings: [],
                            blockedSlots: [],
                            isAvailableNow: false,
                        },
                        {
                            id: 'cmlnqy6fi00040wf2u2v22oym',
                            name: 'Ram Ram Ji',
                            status: 'ACTIVE',
                            bookings: [
                                {
                                    id: 'cmlnqynj8001a0wf2tbn2fsat',
                                    title: 'Booking #fsat',
                                    status: 'PAID',
                                    totalPrice: 1600,
                                    renter: {
                                        fullName: 'Varun Kumar',
                                        email: 'newman.host1@gmail.com',
                                    },
                                    startTime: '2026-03-15T18:00:00.000Z',
                                    endTime: '2026-03-15T22:00:00.000Z',
                                },
                            ],
                            blockedSlots: [],
                            isAvailableNow: true,
                        },
                        {
                            id: 'cmlntv5ad00020w1cd485og40',
                            name: 'Noida darbar',
                            status: 'PAUSED',
                            bookings: [],
                            blockedSlots: [],
                            isAvailableNow: false,
                        },
                    ],
                    summary: {
                        busySlots: 1,
                        availableSlots: 0,
                        upcomingBookings: 1,
                    },
                },
            },
            SuccessRes3: {
                summary: 'Success response 3',
                value: {
                    spaces: [
                        {
                            id: 'cmlnqy6fi00040wf2u2v22oym',
                            name: 'Ram Ram Ji',
                            status: 'ACTIVE',
                            bookings: [
                                {
                                    id: 'cmlnqynj8001a0wf2tbn2fsat',
                                    title: 'Booking #fsat',
                                    status: 'PAID',
                                    totalPrice: 1600,
                                    renter: {
                                        fullName: 'Varun Kumar',
                                        email: 'newman.host1@gmail.com',
                                    },
                                    startTime: '2026-03-15T18:00:00.000Z',
                                    endTime: '2026-03-15T22:00:00.000Z',
                                },
                            ],
                            blockedSlots: [],
                            isAvailableNow: true,
                        },
                    ],
                    summary: {
                        busySlots: 1,
                        availableSlots: 0,
                        upcomingBookings: 1,
                    },
                },
            },
        },
    })
    async getCalendar(
        @GetUser() user: UserForTokenDto,
        @Query('startDate') startDate: string,
        @Query('endDate') endDate: string,
        @Query('spaceIds') spaceIdsStr?: string,
    ): Promise<SpaceCalendarResponseDto> {
        return this.spacesService.getVendorCalendar(user.id, {
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            spaceIds: spaceIdsStr ? spaceIdsStr.split(',') : undefined,
        });
    }

    @Get('public/:spaceId')
    @ApiOperation({ summary: 'Public space details' })
    @ApiParam({ name: 'spaceId', example: 'clabc123' })
    @ApiOkResponse({
        description: 'Public space details',
        type: SpacePublicDto,
        example: {
            id: 'cmlnqyb0p000o0wf2bmeiz374',
            name: 'Conference Room',
            description: 'Capacity 80. Great for conferences.',
            capacity: 80,
            spaceType: 'CONFERENCE_ROOM',
            pricePerHour: 900,
            status: 'ACTIVE',
            coverImage: 'https://picsum.photos/800/600?random=5',
            vendorSummary: {
                businessName: 'Oslo Venue Pros',
                vendorStatus: 'APPROVED',
            },
            isAvailable: true,
        },
    })
    @ApiNotFoundResponse({
        description: 'Space unavailable or not approved',
        example: {
            statusCode: 404,
            timestamp: '2026-02-16T10:28:11.349Z',
            path: '/api/spaces/public/cmlntv5ad00020w1cd485og40',
            message: {
                message: 'Space unavailable or not approved',
                error: 'Not Found',
                statusCode: 404,
            },
        },
    })
    @Public()
    async getPublicSpace(
        @Param('spaceId') spaceId: string,
    ): Promise<SpacePublicDto> {
        this.logger.debug(`getting public space : ${spaceId}`);
        return this.spacesService.getPublicSpace(spaceId);
    }

    @Put(':spaceId')
    @ApiOperation({ summary: 'Update space (triggers re-review if approved)' })
    @ApiParam({ name: 'spaceId', type: 'string' })
    @ApiBody({ type: UpdateSpaceDto })
    @ApiOkResponse({
        description: 'Space updated',
        type: SpaceResponseDto,
        example: {
            id: 'cmlnqy6fi00040wf2u2v22oym',
            name: 'Ram Ram Ji',
            description: 'Capacity 30. Great for workshops.',
            capacity: 30,
            address: 'Karl Johans gate 10',
            spaceType: 'STUDIO',
            rules: [],
            pricePerHour: 400,
            minBookingDurationHours: null,
            minLeadTimeHours: null,
            multiDayBookingAllowed: null,
            city: 'Oslo',
            status: 'UNDER_REVIEW',
            isSuspended: false,
            vendorId: 'cmlnqy5i800020wf2lsycnjfi',
            createdAt: '2026-02-15T12:53:45.870Z',
            updatedAt: '2026-02-15T16:34:55.695Z',
            images: [
                {
                    id: 'cmlnqy6fi00050wf2d1qcloz4',
                    spaceId: 'cmlnqy6fi00040wf2u2v22oym',
                    url: 'https://picsum.photos/800/600?random=0',
                    order: 0,
                },
            ],
            vendor: {
                id: 'cmlnqy5i800020wf2lsycnjfi',
                businessName: 'Oslo Venue Pros',
                vendorStatus: 'APPROVED',
            },
        },
    })
    @ApiForbiddenResponse({
        description: 'Not space owner',
        example: {
            statusCode: 403,
            timestamp: '2026-02-15T15:23:04.432Z',
            path: '/api/spaces/cmlnqy6fi00040wf2u2v22oym',
            message: {
                message: 'Not space owner',
                error: 'Forbidden',
                statusCode: 403,
            },
        },
    })
    @ApiConflictResponse({
        description: 'Conflicts with existing bookings',
        example: {
            statusCode: 409,
            timestamp: '2026-02-15T15:28:29.022Z',
            path: '/api/spaces/cmlnqy6fi00040wf2u2v22oym',
            message: {
                message:
                    'Cannot alter capacity, price or type for existing confirmed bookings',
                error: 'Conflict',
                statusCode: 409,
            },
        },
    })
    @ApiNotFoundResponse({
        description: 'Space not found',
        example: {
            statusCode: 404,
            timestamp: '2026-02-15T15:18:30.304Z',
            path: '/api/spaces/cmlntv5ad00020w1cd485og40a',
            message: {
                message: 'Space not found',
                error: 'Not Found',
                statusCode: 404,
            },
        },
    })
    @ApiBadRequestResponse({
        description: 'No Data Provided',
        example: {
            statusCode: 400,
            timestamp: '2026-02-15T15:16:56.914Z',
            path: '/api/spaces/cmlntv5ad00020w1cd485og40',
            message: {
                message: 'No data provided',
                error: 'Bad Request',
                statusCode: 400,
            },
        },
    })
    async updateSpace(
        @Param('spaceId') spaceId: string,
        @Body() dto: UpdateSpaceDto,
        @GetUser() user: UserForTokenDto,
    ): Promise<SpaceResponseDto> {
        if (Object.keys(dto).length === 0)
            throw new BadRequestException('No data provided');
        return this.spacesService.updateSpace(spaceId, user.id, dto);
    }

    @Get(':spaceId')
    @ApiOperation({ summary: 'Get space details (vendor view)' })
    @ApiParam({ name: 'spaceId', example: 'clabc123' })
    @ApiOkResponse({
        type: SpaceResponseDto,
        description: 'Space found',
        example: {
            id: 'cmlntv5ad00020w1cd485og40',
            name: 'Noida darbar',
            description: 'Kirmanistan',
            capacity: 1221,
            address: 'Johan Jagrata Street, Near New Kosovo',
            spaceType: 'STUDIO',
            rules: ['Come to my house', 'Clean my house', '5 hour window'],
            pricePerHour: 122.32,
            minBookingDurationHours: 12,
            minLeadTimeHours: 24,
            multiDayBookingAllowed: true,
            city: 'Oslo',
            status: 'UNDER_REVIEW',
            isSuspended: false,
            imageUrls: [
                {
                    id: 'cmlntva6000030w1cy66lia4m',
                    spaceId: 'cmlntv5ad00020w1cd485og40',
                    url: 'https://xouczrsenrzrjpskelxa.supabase.co/storage/v1/object/public/spaces/cmlnqt8rp00000wplhnx0zt1p/097892a8-8cd4-48f4-86b1-fa91cc86d795.png',
                    order: 1,
                },
                {
                    id: 'cmlntva6000040w1c1bow2c56',
                    spaceId: 'cmlntv5ad00020w1cd485og40',
                    url: 'https://xouczrsenrzrjpskelxa.supabase.co/storage/v1/object/public/spaces/cmlnqt8rp00000wplhnx0zt1p/c855cbe6-5174-4782-bb10-b264766edaaa.jpg',
                    order: 2,
                },
                {
                    id: 'cmlntva6100050w1cez2sa73f',
                    spaceId: 'cmlntv5ad00020w1cd485og40',
                    url: 'https://xouczrsenrzrjpskelxa.supabase.co/storage/v1/object/public/spaces/cmlnqt8rp00000wplhnx0zt1p/12b76bf6-5708-4e88-9a03-b4f441aa164e.png',
                    order: 3,
                },
                {
                    id: 'cmlntva6100060w1c2c9n8962',
                    spaceId: 'cmlntv5ad00020w1cd485og40',
                    url: 'https://xouczrsenrzrjpskelxa.supabase.co/storage/v1/object/public/spaces/cmlnqt8rp00000wplhnx0zt1p/f414e3c9-3e28-4769-abbf-f5f07357f92a.png',
                    order: 4,
                },
                {
                    id: 'cmlntva6100070w1cib76ear1',
                    spaceId: 'cmlntv5ad00020w1cd485og40',
                    url: 'https://xouczrsenrzrjpskelxa.supabase.co/storage/v1/object/public/spaces/cmlnqt8rp00000wplhnx0zt1p/e31a260b-6daf-4b26-857f-ca8905e54a85.jpg',
                    order: 5,
                },
            ],
            instructionsPdfsUrls: [
                {
                    id: 'cmlntvb4e00080w1ct2paj10m',
                    spaceId: 'cmlntv5ad00020w1cd485og40',
                    url: 'https://xouczrsenrzrjpskelxa.supabase.co/storage/v1/object/public/spaces/cmlnqt8rp00000wplhnx0zt1p/6138d590-1418-4174-aec7-4b7dd3d69354.pdf',
                    order: 1,
                },
                {
                    id: 'cmlntvb4e00090w1c7rweri8m',
                    spaceId: 'cmlntv5ad00020w1cd485og40',
                    url: 'https://xouczrsenrzrjpskelxa.supabase.co/storage/v1/object/public/spaces/cmlnqt8rp00000wplhnx0zt1p/327ab223-5620-41ef-96b5-c9a46c741234.pdf',
                    order: 2,
                },
            ],
            vendorId: 'cmlnqy5i800020wf2lsycnjfi',
            createdAt: '2026-02-15T14:15:23.269Z',
            updatedAt: '2026-02-15T16:38:24.411Z',
        },
    })
    @ApiNotFoundResponse({
        description: 'Space not found',
        example: {
            statusCode: 404,
            timestamp: '2026-02-15T17:07:16.611Z',
            path: '/api/spaces/cmlntv5ad00020w1cd485og40a',
            message: {
                message: 'Space not found',
                error: 'Not Found',
                statusCode: 404,
            },
        },
    })
    @ApiForbiddenResponse({
        description: 'Not Space Owner',
        example: {
            statusCode: 403,
            timestamp: '2026-02-15T17:10:14.289Z',
            path: '/api/spaces/cmlnqy7dc00080wf2hqt13c28',
            message: {
                message: 'Not space owner',
                error: 'Forbidden',
                statusCode: 403,
            },
        },
    })
    async getSpace(
        @Param('spaceId') spaceId: string,
        @GetUser() user: UserForTokenDto,
    ): Promise<SpaceResponseDto> {
        return this.spacesService.getVendorSpace(user.id, spaceId);
    }

    @Delete(':spaceId')
    @ApiOperation({ summary: 'Delete a space (DRAFT or REJECTED only)' })
    @ApiParam({ name: 'spaceId', example: 'cmlnqy6fi00040wf2u2v22oym' })
    @ApiOkResponse({
        description: 'Space deleted successfully',
        example: { message: 'Space "Ram Ram Ji" deleted successfully.' },
    })
    @ApiForbiddenResponse({
        description: 'Not space owner',
        example: {
            statusCode: 403,
            message: 'Not space owner',
            error: 'Forbidden',
        },
    })
    @ApiBadRequestResponse({
        description: 'Space status not deletable',
        example: {
            statusCode: 400,
            message:
                'Cannot delete a space with status "ACTIVE". Only DRAFT or REJECTED spaces can be deleted. Use pause instead.',
            error: 'Bad Request',
        },
    })
    @ApiConflictResponse({
        description: 'Active bookings exist',
        example: {
            statusCode: 409,
            message: 'Cannot delete space - 2 active booking(s) exist.',
            error: 'Conflict',
        },
    })
    @ApiNotFoundResponse({
        description: 'Space not found',
        example: {
            statusCode: 404,
            message: 'Space not found',
            error: 'Not Found',
        },
    })
    async deleteSpace(
        @Param('spaceId') spaceId: string,
        @GetUser() user: UserForTokenDto,
    ): Promise<{ message: string }> {
        return this.spacesService.deleteSpace(spaceId, user.id);
    }

    @Patch(':spaceId/pause')
    @ApiOperation({ summary: 'Pause space (temporary disable bookings)' })
    @ApiParam({ name: 'spaceId', example: 'clabc123' })
    @ApiOkResponse({
        description: 'Space paused successfully',
        type: SpaceResponseDto,
        example: {
            id: 'cmlntv5ad00020w1cd485og40',
            name: 'Noida darbar',
            description: 'Kirmanistan',
            capacity: 1221,
            address: 'Johan Jagrata Street, Near New Kosovo',
            spaceType: 'STUDIO',
            rules: ['Come to my house', 'Clean my house', '5 hour window'],
            pricePerHour: 122.32,
            minBookingDurationHours: 12,
            minLeadTimeHours: 24,
            multiDayBookingAllowed: true,
            city: 'Oslo',
            status: 'PAUSED',
            isSuspended: false,
            vendorId: 'cmlnqy5i800020wf2lsycnjfi',
            createdAt: '2026-02-15T14:15:23.269Z',
            updatedAt: '2026-02-15T18:16:13.289Z',
        },
    })
    @ApiForbiddenResponse({
        description: 'Not space owner',
        example: {
            statusCode: 403,
            timestamp: '2026-02-15T18:11:57.077Z',
            path: '/api/spaces/cmlnqy7dc00080wf2hqt13c28/pause',
            message: {
                message: 'Not space owner',
                error: 'Forbidden',
                statusCode: 403,
            },
        },
    })
    @ApiConflictResponse({
        description: 'Cannot pause - active bookings',
        example: {
            statusCode: 409,
            timestamp: '2026-02-15T18:12:45.957Z',
            path: '/api/spaces/cmlnqy6fi00040wf2u2v22oym/pause',
            message: {
                message:
                    'Cannot pause - 1 active future bookings. Cancel bookings first.',
                error: 'Conflict',
                statusCode: 409,
            },
        },
    })
    @ApiNotFoundResponse({
        description: 'Space not found',
        example: {
            statusCode: 404,
            timestamp: '2026-02-15T18:12:45.957Z',
            path: '/api/spaces/cmlnqy6fi00040wf2u2v22oym/pause',
            message: {
                message: 'Space not found',
                error: 'Not Found',
                statusCode: 404,
            },
        },
    })
    @ApiBadRequestResponse({
        description: 'No data provided',
        examples: {
            PendingReview: {
                summary: 'Cannot pause pending review spaces',
                value: {
                    statusCode: 400,
                    timestamp: '2026-02-15T18:11:01.169Z',
                    path: '/api/spaces/cmlntv5ad00020w1cd485og40/pause',
                    message: {
                        message: 'Cannot pause pending review spaces',
                        error: 'Bad Request',
                        statusCode: 400,
                    },
                },
            },
            AlreadyPaused: {
                summary: 'Space already paused',
                value: {
                    statusCode: 400,
                    timestamp: '2026-02-15T18:14:05.481Z',
                    path: '/api/spaces/cmlntv5ad00020w1cd485og40/pause',
                    message: {
                        message: 'Space already paused',
                        error: 'Bad Request',
                        statusCode: 400,
                    },
                },
            },
        },
    })
    async pauseSpace(
        @Param('spaceId') spaceId: string,
        @GetUser() user: UserForTokenDto,
    ): Promise<SpaceResponseDto> {
        return this.spacesService.pauseSpace(spaceId, user.id);
    }

    @Put(':spaceId/files')
    @ApiOperation({ summary: 'Replace space images/PDFs (DRAFT only)' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        description: `
            - \`images\` (array, replace existing, max 5 total)
            - \`instructionsPdf\` (array, replace existing, max 2 total)
            - Maintains order - missing indices keep old files
        `,
        schema: {
            type: 'object',
            properties: {
                imageReplacementData: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'string' },
                            order: { type: 'integer' },
                        },
                    },
                },
                pdfReplacementData: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'string' },
                            order: { type: 'integer' },
                        },
                    },
                },
                images: {
                    type: 'array',
                    items: { type: 'string', format: 'binary' },
                },
                instructionsPdf: {
                    type: 'array',
                    items: { type: 'string', format: 'binary' },
                },
            },
        },
    })
    @ApiOkResponse({
        description: 'Returns updated space',
        type: SpaceResponseDto,
        example: {
            id: 'cmlntv5ad00020w1cd485og40',
            name: 'Noida darbar',
            description: 'Kirmanistan',
            capacity: 1221,
            address: 'Johan Jagrata Street, Near New Kosovo',
            spaceType: 'STUDIO',
            rules: ['Come to my house', 'Clean my house', '5 hour window'],
            pricePerHour: 122.32,
            minBookingDurationHours: 12,
            minLeadTimeHours: 24,
            multiDayBookingAllowed: true,
            city: 'Oslo',
            status: 'DRAFT',
            isSuspended: false,
            vendorId: 'cmlnqy5i800020wf2lsycnjfi',
            createdAt: '2026-02-15T14:15:23.269Z',
            updatedAt: '2026-02-15T18:16:13.289Z',
            images: [
                {
                    id: 'cmlntva6000040w1c1bow2c56',
                    spaceId: 'cmlntv5ad00020w1cd485og40',
                    url: 'https://xouczrsenrzrjpskelxa.supabase.co/storage/v1/object/public/spaces/cmlnqt8rp00000wplhnx0zt1p/c855cbe6-5174-4782-bb10-b264766edaaa.jpg',
                    order: 1,
                },
                {
                    id: 'cmlntva6100060w1c2c9n8962',
                    spaceId: 'cmlntv5ad00020w1cd485og40',
                    url: 'https://xouczrsenrzrjpskelxa.supabase.co/storage/v1/object/public/spaces/cmlnqt8rp00000wplhnx0zt1p/f414e3c9-3e28-4769-abbf-f5f07357f92a.png',
                    order: 2,
                },
                {
                    id: 'cmlpejdk700000w78cuakcjcx',
                    spaceId: 'cmlntv5ad00020w1cd485og40',
                    url: 'https://xouczrsenrzrjpskelxa.supabase.co/storage/v1/object/public/spaces/cmlnqt8rp00000wplhnx0zt1p/4764bf17-bc96-4681-bf5b-bc1159c3d155.jpg',
                    order: 3,
                },
                {
                    id: 'cmlpejdk700010w78brqpfs20',
                    spaceId: 'cmlntv5ad00020w1cd485og40',
                    url: 'https://xouczrsenrzrjpskelxa.supabase.co/storage/v1/object/public/spaces/cmlnqt8rp00000wplhnx0zt1p/81576c8a-c3e1-403d-9c3d-66add0b5f8b4.jpg',
                    order: 4,
                },
                {
                    id: 'cmlpejdk700020w78qxyxg0w4',
                    spaceId: 'cmlntv5ad00020w1cd485og40',
                    url: 'https://xouczrsenrzrjpskelxa.supabase.co/storage/v1/object/public/spaces/cmlnqt8rp00000wplhnx0zt1p/8e790554-4e02-4583-8395-3f4c0aeac52c.jpg',
                    order: 5,
                },
            ],
            instructionsPdf: [
                {
                    id: 'cmlntvb4e00080w1ct2paj10m',
                    spaceId: 'cmlntv5ad00020w1cd485og40',
                    name: null,
                    url: 'https://xouczrsenrzrjpskelxa.supabase.co/storage/v1/object/public/spaces/cmlnqt8rp00000wplhnx0zt1p/6138d590-1418-4174-aec7-4b7dd3d69354.pdf',
                    order: 1,
                },
                {
                    id: 'cmlpejfp000030w78emkmv6jb',
                    spaceId: 'cmlntv5ad00020w1cd485og40',
                    name: 'Vipul_Jain_Resume-1.pdf',
                    url: 'https://xouczrsenrzrjpskelxa.supabase.co/storage/v1/object/public/spaces/cmlnqt8rp00000wplhnx0zt1p/bae5ac98-50c7-40e0-88cb-d1daedd62051.pdf',
                    order: 2,
                },
            ],
            vendor: {
                businessName: 'Oslo Venue Pros',
                vendorStatus: 'APPROVED',
            },
        },
    })
    @ApiBadRequestResponse({
        description: 'Bad User Requests that fail validation',
        examples: {
            TooManyFiles: {
                summary: '>5 images or >2 PDFs',
                value: {
                    statusCode: 400,
                    timestamp: '2026-02-16T17:05:58.383Z',
                    path: '/api/spaces/cmlntv5ad00020w1cd485og40/files',
                    message: {
                        message: 'Total images must be 3-5 (current: 7)',
                        error: 'Bad Request',
                        statusCode: 400,
                    },
                },
            },
            BadBodyValidation: {
                summary: 'Bad Body Validation',
                value: {
                    statusCode: 400,
                    timestamp: '2026-02-16T15:44:30.424Z',
                    path: '/api/spaces/cmlntv5ad00020w1cd485og40/files',
                    message: {
                        message: [
                            'Images must be an array',
                            'Pdfs must be an array',
                        ],
                        error: 'Bad Request',
                        statusCode: 400,
                    },
                },
            },
            CanOnlyEditDraft: {
                summary: 'Can Only Edit Draft',
                value: {
                    statusCode: 400,
                    timestamp: '2026-02-16T15:56:16.320Z',
                    path: '/api/spaces/cmlntv5ad00020w1cd485og40/files',
                    message: {
                        message: 'Can only update files in DRAFT status',
                        error: 'Bad Request',
                        statusCode: 400,
                    },
                },
            },
        },
    })
    @ApiForbiddenResponse({
        description: 'Not owner',
        example: {
            statusCode: 403,
            timestamp: '2026-02-16T16:43:55.976Z',
            path: '/api/spaces/cmlnqy7dc00080wf2hqt13c28/files',
            message: {
                message: 'Not space owner',
                error: 'Forbidden',
                statusCode: 403,
            },
        },
    })
    @ApiNotFoundResponse({
        description: 'Space not found',
        example: {
            statusCode: 404,
            timestamp: '2026-02-16T17:16:06.899Z',
            path: '/api/spaces/cmlntv5ad00020w1cd485og40a/files',
            message: {
                message: 'Space not found',
                error: 'Not Found',
                statusCode: 404,
            },
        },
    })
    @UseInterceptors(
        FileFieldsInterceptor([
            { name: 'images', maxCount: 5 },
            { name: 'instructionsPdf', maxCount: 2 },
        ]),
    )
    async replaceFiles(
        @GetUser() user: UserForTokenDto,
        @Body() body: any,
        @Param('spaceId') spaceId: string,
        @UploadedFiles()
        files: {
            images?: Express.Multer.File[];
            instructionsPdf?: Express.Multer.File[];
        },
    ): Promise<SpaceResponseDto> {
        function safeParse(value: any) {
            if (typeof value === 'string') {
                return JSON.parse(value);
            }
            return value;
        }

        const dto: ReplaceSpaceFilesDto = {
            imageReplacementData: safeParse(body.imageReplacementData),
            pdfReplacementData: safeParse(body.pdfReplacementData),
        };

        return this.spacesService.replaceSpaceFiles(
            spaceId,
            user.id,
            dto,
            files,
        );
    }

    @Delete(':spaceId/:fileType/:fileId')
    @ApiOperation({ summary: 'Delete space image/PDF (DRAFT only)' })
    @ApiParam({ name: 'spaceId', example: 'clabc123' })
    @ApiParam({ name: 'fileType', enum: ['img', 'pdf'], example: 'img' })
    @ApiParam({ name: 'fileId', example: 'climg456' })
    @ApiOkResponse({
        description: 'File deleted successfully',
        examples: {
            ImgSuccess: {
                summary: 'Image deleted successfully',
                value: {
                    message: 'File img/climg456 deleted successfully',
                },
            },
            PdfSuccess: {
                summary: 'PDF deleted successfully',
                value: {
                    message: 'File pdf/clpdf789 deleted successfully',
                },
            },
        },
    })
    @ApiBadRequestResponse({
        description: 'Min images/PDFs violation & Invalid File Types',
        examples: {
            InvalidFileType: {
                summary: 'Invalid file type',
                value: {
                    statusCode: 400,
                    timestamp: '2026-02-16T17:05:58.383Z',
                    path: '/api/spaces/cmlntv5ad00020w1cd485og40/files',
                    message: {
                        message: 'Invalid file type',
                        error: 'Bad Request',
                        statusCode: 400,
                    },
                },
            },
            ImgMinViolation: {
                summary: 'Min images violation',
                value: {
                    statusCode: 400,
                    timestamp: '2026-02-16T17:23:32.248Z',
                    path: '/api/spaces/cmlntv5ad00020w1cd485og40/img/cmlpejdk700000w78cuakcjcx',
                    message: {
                        message:
                            'Cannot delete - minimum 3 images required (current: 2)',
                        error: 'Bad Request',
                        statusCode: 400,
                    },
                },
            },
            PdfMinViolation: {
                summary: 'Min PDFs violation',
                value: {
                    statusCode: 400,
                    timestamp: '2026-02-16T17:25:41.487Z',
                    path: '/api/spaces/cmlntv5ad00020w1cd485og40/pdf/cmlpejfp000030w78emkmv6jb',
                    message: {
                        message:
                            'Cannot delete - minimum 1 PDF required (current: 0)',
                        error: 'Bad Request',
                        statusCode: 400,
                    },
                },
            },
        },
    })
    @ApiForbiddenResponse({
        description: 'Not owner & Draft status violation',
        examples: {
            NotOwner: {
                summary: 'Not space owner',
                value: {
                    statusCode: 403,
                    timestamp: '2026-02-16T17:17:15.159Z',
                    path: '/api/spaces/cmlnqy7dc00080wf2hqt13c28/img/cmlnt8in300050wbyxvtvohwp',
                    message: {
                        message: 'Not space owner',
                        error: 'Forbidden',
                        statusCode: 403,
                    },
                },
            },
            DRAFTStatusViolation: {
                summary: 'Not DRAFT status',
                value: {
                    statusCode: 403,
                    timestamp: '2026-02-16T17:31:31.622Z',
                    path: '/api/spaces/cmlntv5ad00020w1cd485og40/pdf/cmlpejfp000030w78emkmv6jb',
                    message: {
                        message: 'Can only delete files in DRAFT status',
                        error: 'Forbidden',
                        statusCode: 403,
                    },
                },
            },
        },
    })
    @ApiNotFoundResponse({
        description: 'File/space not found',
        examples: {
            FileNotFound: {
                summary: 'File not found',
                value: {
                    statusCode: 404,
                    timestamp: '2026-02-16T17:15:41.387Z',
                    path: '/api/spaces/cmlntv5ad00020w1cd485og40/img/cmlnt8in300050wbyxvtvohwp',
                    message: {
                        message: 'File cmlnt8in300050wbyxvtvohwp not found',
                        error: 'Not Found',
                        statusCode: 404,
                    },
                },
            },
            SpaceNotFound: {
                summary: 'Space not found',
                value: {
                    statusCode: 404,
                    timestamp: '2026-02-16T17:33:17.331Z',
                    path: '/api/spaces/cmlntv5ad00020w1cd485og40a/pdf/cmlpejfp000030w78emkmv6jb',
                    message: {
                        message: 'Space not found',
                        error: 'Not Found',
                        statusCode: 404,
                    },
                },
            },
        },
    })
    async deleteFile(
        @Param('spaceId') spaceId: string,
        @Param('fileType') fileType: 'img' | 'pdf',
        @Param('fileId') fileId: string,
        @GetUser() user: UserForTokenDto,
    ): Promise<{ message: string }> {
        if (fileType !== 'img' && fileType !== 'pdf') {
            throw new BadRequestException('Invalid file type');
        }

        await this.spacesService.deleteSpaceFile(
            spaceId,
            fileType,
            fileId,
            user.id,
        );

        return { message: `File ${fileType}/${fileId} deleted successfully` };
    }

    @Post(':spaceId/block-days')
    @ApiOperation({
        summary: 'Block days for a space',
        description: `
            Allows a vendor to block one or more date ranges on their space, preventing attendees from submitting booking requests during those periods.

            **Ownership**: Only the vendor who owns the space can block dates.
            **Space Status**: Space must be \`ACTIVE\` to block dates.

            ---

            **Each date range is processed independently.**
            If one range fails validation, others in the same request are still processed.
            The response array mirrors the input array in order.

            ---

            **Rules per date range:**
            - \`endingDate\` must be after \`startingDate\`
            - \`startingDate\` cannot be in the past
            - Range cannot exceed **365 days**
            - Cannot overlap with an **existing blocked range**
            - Cannot overlap with an existing \`APPROVED\` or \`PAID\` booking

            ---

            **Use cases:**
            - Blocking for maintenance, personal use, holidays, travel
            - Blocking a single day (same \`startingDate\` and \`endingDate\`)
            `,
    })
    @ApiParam({
        name: 'spaceId',
        description: 'ID of the space to block dates for',
        example: 'cmmdtrfio001jqo01cm0trqbj',
    })
    @ApiBody({
        type: BlockDaysDto,
        description: 'Array of date ranges to block',
        examples: {
            SingleBlock: {
                summary: 'Block a single range',
                value: {
                    dates: [
                        {
                            startingDate: '2026-08-01',
                            endingDate: '2026-08-05',
                            reason: 'Maintenance',
                        },
                    ],
                },
            },
            MultipleBlocks: {
                summary: 'Block multiple ranges at once',
                value: {
                    dates: [
                        {
                            startingDate: '2026-08-01',
                            endingDate: '2026-08-05',
                            reason: 'Maintenance',
                        },
                        {
                            startingDate: '2026-09-10',
                            endingDate: '2026-09-15',
                            reason: 'Wedding',
                        },
                        {
                            startingDate: '2026-12-24',
                            endingDate: '2026-12-26',
                            reason: 'Christmas',
                        },
                    ],
                },
            },
            SingleDay: {
                summary: 'Block a single day',
                value: {
                    dates: [
                        {
                            startingDate: '2026-12-25',
                            endingDate: '2026-12-25',
                            reason: 'Christmas Day',
                        },
                    ],
                },
            },
            MixedValidInvalid: {
                summary: 'Mixed valid and invalid ranges (partial success)',
                value: {
                    dates: [
                        {
                            startingDate: '2026-08-01',
                            endingDate: '2026-08-05',
                            reason: 'Valid',
                        },
                        {
                            startingDate: '2026-03-01',
                            endingDate: '2026-02-01',
                        }, // Invalid: end before start
                    ],
                },
            },
        },
    })
    @ApiOkResponse({
        description: `
                Array of results matching the input array order.
                Each item indicates whether that date range was successfully blocked or why it failed.
                A **207 partial success** is possible — some ranges may succeed while others fail.
            `,
        type: [BlockDaysResultItemDto],
        examples: {
            AllSuccess: {
                summary: 'All ranges blocked successfully',
                value: [
                    {
                        success: true,
                        message:
                            'Successfully blocked dates from 2026-08-01 to 2026-08-05',
                    },
                    {
                        success: true,
                        message:
                            'Successfully blocked dates from 2026-09-10 to 2026-09-15',
                    },
                ],
            },
            PartialSuccess: {
                summary: 'Some ranges failed (order mirrors input)',
                value: [
                    {
                        success: true,
                        message:
                            'Successfully blocked dates from 2026-08-01 to 2026-08-05',
                    },
                    {
                        success: false,
                        message:
                            'End date must be after start date: 2026-03-01 - 2026-02-01',
                    },
                    {
                        success: true,
                        message:
                            'Successfully blocked dates from 2026-12-24 to 2026-12-26',
                    },
                    {
                        success: false,
                        message:
                            'Active bookings found between dates 2026-09-10 to 2026-09-15',
                    },
                ],
            },
            AllFailed: {
                summary: 'All ranges failed',
                value: [
                    {
                        success: false,
                        message: 'Start date cannot be in the past: 2025-01-01',
                    },
                    {
                        success: false,
                        message:
                            'Dates overlap with an existing block from 2026-08-01 to 2026-08-05',
                    },
                ],
            },
        },
    })
    @ApiBadRequestResponse({
        description: `
                Space is not \`ACTIVE\` — returned as a single error (not per-range array).

                Possible messages:
                - \`"Space must be ACTIVE to block dates"\`
        `,
    })
    @ApiNotFoundResponse({
        description: 'Space not found — spaceId does not exist',
    })
    @ApiForbiddenResponse({
        description: 'You do not own this space',
    })
    @ApiUnauthorizedResponse({
        description: 'Missing or invalid JWT token',
    })
    async blockDays(
        @GetUser() user: UserForTokenDto,
        @Param('spaceId') spaceId: string,
        @Body() dto: BlockDaysDto,
    ): Promise<BlockDaysResultItemDto[]> {
        return this.spacesService.blockDays(user.id, spaceId, dto);
    }

    @Get(':spaceId/blocked-days')
    @ApiOperation({
        summary: 'Get blocked days for a space',
        description: `
        Returns blocked date ranges for a given space.

        **Ownership**: Only the vendor who owns the space can view blocked dates.

        **Query params:**
        - \`from\`: filter ranges starting from this date
        - \`to\`: filter ranges ending at this date

        If both are provided → returns overlapping ranges only.
    `,
    })
    @ApiParam({
        name: 'spaceId',
        description: 'ID of the space',
        example: 'cmmdtrfio001jqo01cm0trqbj',
    })
    @ApiOkResponse({
        description: 'List of blocked date ranges',
        type: [BlockedDaysResponseDto],
        example: [
            {
                id: 'clx123',
                startingDate: '2026-08-01',
                endingDate: '2026-08-05',
                reason: 'Maintenance',
                createdAt: '2026-03-19T10:00:00.000Z',
            },
            {
                id: 'clx124',
                startingDate: '2026-09-10',
                endingDate: '2026-09-15',
                reason: 'Wedding',
                createdAt: '2026-03-19T10:05:00.000Z',
            },
        ],
    })
    @ApiNotFoundResponse({
        description: 'Space not found',
    })
    @ApiForbiddenResponse({
        description: 'You do not own this space',
    })
    @ApiUnauthorizedResponse({
        description: 'Missing or invalid JWT token',
    })
    async getBlockedDays(
        @GetUser() user: UserForTokenDto,
        @Param('spaceId') spaceId: string,
        @Query('from') from?: string,
        @Query('to') to?: string,
    ): Promise<BlockedDaysResponseDto[]> {
        return this.spacesService.getBlockedDays(user.id, spaceId, from, to);
    }
}
