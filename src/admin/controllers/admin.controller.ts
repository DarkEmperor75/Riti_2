import {
    BadRequestException,
    Body,
    Controller,
    Get,
    Logger,
    Param,
    Patch,
    Query,
    UseGuards,
} from '@nestjs/common';
import { AdminService } from '../services';
import { AdminProfileGuard } from 'src/users/guards';
import { JwtAuthGuard, SuspentionGuard } from 'src/auth/guards';
import {
    ApiBadRequestResponse,
    ApiBody,
    ApiForbiddenResponse,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiOperation,
    ApiParam,
    ApiQuery,
    ApiTags,
} from '@nestjs/swagger';
import {
    BookingStatus,
    SpaceStatus,
    TicketStatus,
    UserStatus,
    UserType,
    VendorStatus,
} from '@prisma/client';
import {
    AdminBookingsListResponseDto,
    AdminBookingsQueryDto,
    AdminEventCancelDto,
    AdminEventCancelResponseDto,
    AdminListSpacesQueryDto,
    AdminSpaceListResponseDto,
    AdminSpaceStatusResponseDto,
    AdminUserDetailResponseDto,
    AdminUsersListResponseDto,
    AdminUsersQueryDto,
    UpdateSpaceStatusDto,
    AdminTicketsListResponseDto,
    AdminTicketsQueryDto,
    AdminSuspendUserDto,
    AdminSuspendUserResponseDto,
    AdminCommissionOverviewResponseDto,
    AdminFinanceOverviewDto,
} from '../dto';
import { GetUser } from 'src/auth/decorators';
import { type UserForTokenDto } from 'src/auth/interfaces';
import { DatabaseService } from 'src/database/database.service';
import { FinancialsService } from 'src/financials/services';

@ApiTags('Admin Apis')
@Controller('admin')
@ApiForbiddenResponse({
    description: 'Forbidden',
    example: {
        statusCode: 403,
        timestamp: '2026-02-18T21:47:57.921Z',
        path: '/api/admin/users/cmlnqybxf000r0wf27384m23k',
        message: {
            message: 'This endpoint is for Admins only',
            error: 'Forbidden',
            statusCode: 403,
        },
    },
})
@UseGuards(JwtAuthGuard, AdminProfileGuard, SuspentionGuard)
export class AdminController {
    private readonly logger = new Logger(AdminController.name);
    constructor(
        private readonly adminService: AdminService,
        private readonly db: DatabaseService,
        private readonly financeService: FinancialsService
    ) {}

    @Get('spaces')
    @ApiOperation({ summary: 'List spaces for admin review (paginated)' })
    @ApiQuery({
        name: 'status',
        enum: SpaceStatus,
        example: 'UNDER_REVIEW',
        description: 'Filter by space status (e.g., UNDER_REVIEW, SUSPENDED)',
    })
    @ApiQuery({ name: 'vendorStatus', enum: VendorStatus, required: false })
    @ApiQuery({ name: 'page', example: 1, required: false })
    @ApiQuery({ name: 'limit', example: 20, required: false })
    @ApiQuery({
        name: 'sortBy',
        enum: ['createdAt', 'name', 'updatedAt'],
        required: false,
    })
    @ApiQuery({ name: 'order', enum: ['asc', 'desc'], required: false })
    @ApiOkResponse({
        description: 'Paginated list of spaces',
        type: AdminSpaceListResponseDto,
        examples: {
            UnFiltered: {
                summary: 'Unfiltered list of spaces',
                value: {
                    spaces: [
                        {
                            id: 'cmlntv5ad00020w1cd485og40',
                            name: 'Noida darbar',
                            vendorId: 'cmlnqy5i800020wf2lsycnjfi',
                            vendorName: 'Ramesh Chatterji',
                            status: 'SUSPENDED',
                            vendorStatus: 'APPROVED',
                            spaceType: 'STUDIO',
                            capacity: 1221,
                            pricePerHour: 122.32,
                            city: 'Oslo',
                            images: [
                                {
                                    url: 'https://xouczrsenrzrjpskelxa.supabase.co/storage/v1/object/public/spaces/cmlnqt8rp00000wplhnx0zt1p/4764bf17-bc96-4681-bf5b-bc1159c3d155.jpg',
                                    order: 1,
                                },
                                {
                                    url: 'https://xouczrsenrzrjpskelxa.supabase.co/storage/v1/object/public/spaces/cmlnqt8rp00000wplhnx0zt1p/81576c8a-c3e1-403d-9c3d-66add0b5f8b4.jpg',
                                    order: 2,
                                },
                                {
                                    url: 'https://xouczrsenrzrjpskelxa.supabase.co/storage/v1/object/public/spaces/cmlnqt8rp00000wplhnx0zt1p/8e790554-4e02-4583-8395-3f4c0aeac52c.jpg',
                                    order: 3,
                                },
                            ],
                            adminReason: 'FUCK OFF',
                            createdAt: '2026-02-15T14:15:23.269Z',
                            vendorBusinessName: 'Oslo Venue Pros',
                        },
                        {
                            id: 'cmlnt8drm00000wbyqfqjmfem',
                            name: 'Noida darbar',
                            vendorId: 'cmlnqy5i800020wf2lsycnjfi',
                            vendorName: 'Ramesh Chatterji',
                            status: 'ACTIVE',
                            vendorStatus: 'APPROVED',
                            spaceType: 'STUDIO',
                            capacity: 213,
                            pricePerHour: 122.32,
                            city: 'Oslo',
                            images: [
                                {
                                    url: 'https://xouczrsenrzrjpskelxa.supabase.co/storage/v1/object/public/spaces/cmlnqt8rp00000wplhnx0zt1p/0a166ab2-c485-4598-9cb9-525ccc137fef.png',
                                    order: 1,
                                },
                                {
                                    url: 'https://xouczrsenrzrjpskelxa.supabase.co/storage/v1/object/public/spaces/cmlnqt8rp00000wplhnx0zt1p/fdbfa3ea-eed8-4a17-abdb-894abacbae5d.jpg',
                                    order: 2,
                                },
                                {
                                    url: 'https://xouczrsenrzrjpskelxa.supabase.co/storage/v1/object/public/spaces/cmlnqt8rp00000wplhnx0zt1p/b967c77a-918c-44b0-b338-43f49fd95a67.png',
                                    order: 3,
                                },
                                {
                                    url: 'https://xouczrsenrzrjpskelxa.supabase.co/storage/v1/object/public/spaces/cmlnqt8rp00000wplhnx0zt1p/fddae55e-dc81-4aec-9fea-785fd4a70cbf.png',
                                    order: 4,
                                },
                                {
                                    url: 'https://xouczrsenrzrjpskelxa.supabase.co/storage/v1/object/public/spaces/cmlnqt8rp00000wplhnx0zt1p/ff06709d-a7b7-48a6-a5da-330c9b54fd7e.jpg',
                                    order: 5,
                                },
                            ],
                            adminReason: null,
                            createdAt: '2026-02-15T13:57:41.170Z',
                            vendorBusinessName: 'Oslo Venue Pros',
                        },
                        {
                            id: 'cmlnqyb0p000o0wf2bmeiz374',
                            name: 'Conference Room',
                            vendorId: 'cmlnqy5i800020wf2lsycnjfi',
                            vendorName: 'Ramesh Chatterji',
                            status: 'PAUSED',
                            vendorStatus: 'APPROVED',
                            spaceType: 'CONFERENCE_ROOM',
                            capacity: 80,
                            pricePerHour: 900,
                            city: 'Prayagraj',
                            images: [
                                {
                                    url: 'https://picsum.photos/800/600?random=5',
                                    order: 0,
                                },
                                {
                                    url: 'https://picsum.photos/800/600?random=15',
                                    order: 1,
                                },
                            ],
                            adminReason: null,
                            createdAt: '2026-02-15T12:53:51.818Z',
                            vendorBusinessName: 'Oslo Venue Pros',
                        },
                        {
                            id: 'cmlnqya3z000k0wf2728p4ft5',
                            name: 'Art Gallery',
                            vendorId: 'cmlnqy5i800020wf2lsycnjfi',
                            vendorName: 'Ramesh Chatterji',
                            status: 'ACTIVE',
                            vendorStatus: 'APPROVED',
                            spaceType: 'AUDITORIUM',
                            capacity: 70,
                            pricePerHour: 800,
                            city: 'Oslo',
                            images: [
                                {
                                    url: 'https://picsum.photos/800/600?random=4',
                                    order: 0,
                                },
                                {
                                    url: 'https://picsum.photos/800/600?random=14',
                                    order: 1,
                                },
                            ],
                            adminReason: null,
                            createdAt: '2026-02-15T12:53:50.639Z',
                            vendorBusinessName: 'Oslo Venue Pros',
                        },
                        {
                            id: 'cmlnqy977000g0wf2ov1n1h4c',
                            name: 'Cozy Yoga Space',
                            vendorId: 'cmlnqy5i800020wf2lsycnjfi',
                            vendorName: 'Ramesh Chatterji',
                            status: 'UNDER_REVIEW',
                            vendorStatus: 'APPROVED',
                            spaceType: 'WORKSHOP',
                            capacity: 60,
                            pricePerHour: 700,
                            city: 'Oslo',
                            images: [
                                {
                                    url: 'https://picsum.photos/800/600?random=3',
                                    order: 0,
                                },
                                {
                                    url: 'https://picsum.photos/800/600?random=13',
                                    order: 1,
                                },
                            ],
                            adminReason: null,
                            createdAt: '2026-02-15T12:53:49.459Z',
                            vendorBusinessName: 'Oslo Venue Pros',
                        },
                        {
                            id: 'cmlnqy8a7000c0wf2pnrkbinh',
                            name: 'Workshop Hall',
                            vendorId: 'cmlnqy5i800020wf2lsycnjfi',
                            vendorName: 'Ramesh Chatterji',
                            status: 'ACTIVE',
                            vendorStatus: 'APPROVED',
                            spaceType: 'GALLERY',
                            capacity: 50,
                            pricePerHour: 600,
                            city: 'Prayagraj',
                            images: [
                                {
                                    url: 'https://picsum.photos/800/600?random=2',
                                    order: 0,
                                },
                                {
                                    url: 'https://picsum.photos/800/600?random=12',
                                    order: 1,
                                },
                            ],
                            adminReason: null,
                            createdAt: '2026-02-15T12:53:48.271Z',
                            vendorBusinessName: 'Oslo Venue Pros',
                        },
                        {
                            id: 'cmlnqy7dc00080wf2hqt13c28',
                            name: 'Startup Studio',
                            vendorId: 'cmlnw8fym00030wyqluiig92k',
                            vendorName: 'Shashwat Singh',
                            status: 'UNDER_REVIEW',
                            vendorStatus: 'SUSPENDED',
                            spaceType: 'HALL',
                            capacity: 40,
                            pricePerHour: 500,
                            city: 'Oslo',
                            images: [
                                {
                                    url: 'https://picsum.photos/800/600?random=1',
                                    order: 0,
                                },
                                {
                                    url: 'https://picsum.photos/800/600?random=11',
                                    order: 1,
                                },
                            ],
                            adminReason: null,
                            createdAt: '2026-02-15T12:53:47.088Z',
                            vendorBusinessName: 'Shashwat Singh',
                        },
                        {
                            id: 'cmlnqy6fi00040wf2u2v22oym',
                            name: 'Ram Ram Ji',
                            vendorId: 'cmlnqy5i800020wf2lsycnjfi',
                            vendorName: 'Ramesh Chatterji',
                            status: 'DRAFT',
                            vendorStatus: 'APPROVED',
                            spaceType: 'STUDIO',
                            capacity: 30,
                            pricePerHour: 400,
                            city: 'Oslo',
                            images: [
                                {
                                    url: 'https://picsum.photos/800/600?random=0',
                                    order: 0,
                                },
                                {
                                    url: 'https://picsum.photos/800/600?random=10',
                                    order: 1,
                                },
                            ],
                            adminReason: null,
                            createdAt: '2026-02-15T12:53:45.870Z',
                            vendorBusinessName: 'Oslo Venue Pros',
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
            FilteredRes: {
                summary:
                    'Filtered response with: ?status=DRAFT&vendorStatus=APPROVED&page=1&limit=2&sortBy=name&order=asc',
                value: {
                    spaces: [
                        {
                            id: 'cmlnqy6fi00040wf2u2v22oym',
                            name: 'Ram Ram Ji',
                            vendorId: 'cmlnqy5i800020wf2lsycnjfi',
                            vendorName: 'Ramesh Chatterji',
                            status: 'DRAFT',
                            vendorStatus: 'APPROVED',
                            spaceType: 'STUDIO',
                            capacity: 30,
                            pricePerHour: 400,
                            city: 'Oslo',
                            images: [
                                {
                                    url: 'https://picsum.photos/800/600?random=0',
                                    order: 0,
                                },
                                {
                                    url: 'https://picsum.photos/800/600?random=10',
                                    order: 1,
                                },
                            ],
                            adminReason: null,
                            createdAt: '2026-02-15T12:53:45.870Z',
                            vendorBusinessName: 'Oslo Venue Pros',
                        },
                    ],
                    meta: {
                        page: 1,
                        limit: 2,
                        total: 1,
                        totalPages: 1,
                    },
                },
            },
            EmptyRes: {
                summary: 'When there are no spaces matching queries',
                value: {
                    spaces: [],
                    meta: {
                        page: 1,
                        limit: 2,
                        total: 0,
                        totalPages: 0,
                    },
                },
            },
        },
    })
    async listSpacesForReview(
        @Query() query: AdminListSpacesQueryDto,
    ): Promise<AdminSpaceListResponseDto> {
        this.logger.debug('Fetching admin spaces list');
        return this.adminService.listSpacesForReview(query);
    }

    @Patch('spaces/:spaceId/status')
    @ApiOperation({
        summary: 'Update space status to: APPROVED, REJECTED, or SUSPENDED',
    })
    @ApiOkResponse({
        description: 'Space status updated',
        examples: {
            Approved: {
                summary: 'Space status updated to APPROVED',
                value: {
                    spaceId: 'cmlnqy8a7000c0wf2pnrkbinh',
                    status: 'APPROVED',
                },
            },
            Rejected: {
                summary: 'Space status updated to REJECTED',
                value: {
                    spaceId: 'cmlnqy8a7000c0wf2pnrkbinh',
                    status: 'REJECTED',
                },
            },
            Suspended: {
                summary: 'Space status updated to SUSPENDED',
                value: {
                    spaceId: 'cmlnqy8a7000c0wf2pnrkbinh',
                    status: 'SUSPENDED',
                },
            },
            VendorSuspentionCascades: {
                summary: 'Space status updated to SUSPENDED',
                value: {
                    spaceId: 'cmlnqy8a7000c0wf2pnrkbinh',
                    status: 'SUSPENDED',
                },
            },
        },
    })
    @ApiBadRequestResponse({
        description: 'Invalid status',
        examples: {
            ReasonRequied: {
                summary:
                    'If status is REJECTED or SUSPENDED, reason is required',
                value: {
                    statusCode: 400,
                    timestamp: '2026-02-18T17:04:09.241Z',
                    path: '/api/admin/spaces/cmlnqy977000g0wf2ov1n1h4c/status',
                    message: {
                        message:
                            'Please provide a reason for rejection or suspension',
                        error: 'Bad Request',
                        statusCode: 400,
                    },
                },
            },
            BadInput: {
                summary: 'Bad input',
                value: {
                    statusCode: 400,
                    timestamp: '2026-02-18T17:05:00.579Z',
                    path: '/api/admin/spaces/cmlnqy977000g0wf2ov1n1h4c/status',
                    message: {
                        message: ['property reasons should not exist'],
                        error: 'Bad Request',
                        statusCode: 400,
                    },
                },
            },
            IncorrectStatus: {
                summary: 'Incorrect status',
                value: {
                    statusCode: 400,
                    timestamp: '2026-02-18T17:07:15.760Z',
                    path: '/api/admin/spaces/cmlnqy977000g0wf2ov1n1h4c/status',
                    message: {
                        message: [
                            'Invalid status, must be APPROVED, REJECTED, or SUSPENDED',
                        ],
                        error: 'Bad Request',
                        statusCode: 400,
                    },
                },
            },
        },
    })
    @ApiForbiddenResponse({
        description: 'Forbidden',
        example: {
            statusCode: 403,
            timestamp: '2026-02-18T16:27:32.938Z',
            path: '/api/admin/spaces/cmlntv5ad00020w1cd485og40/status',
            message: {
                message: 'Space is not under review',
                error: 'Forbidden',
                statusCode: 403,
            },
        },
    })
    @ApiNotFoundResponse({
        description: 'Space not found',
        example: {
            statusCode: 404,
            timestamp: '2026-02-18T18:51:13.412Z',
            path: '/api/admin/spaces/cmlntv5ad00020w1cd485og40a/status',
            message: {
                message: 'Space not found',
                error: 'Not Found',
                statusCode: 404,
            },
        },
    })
    async updateSpaceStatus(
        @GetUser() user: UserForTokenDto,
        @Param('spaceId') spaceId: string,
        @Body() dto: UpdateSpaceStatusDto,
    ): Promise<AdminSpaceStatusResponseDto> {
        this.logger.debug('Updating space status');
        const approvedStatuses: SpaceStatus[] = [
            SpaceStatus.APPROVED,
            SpaceStatus.REJECTED,
            SpaceStatus.SUSPENDED,
        ];

        if (!approvedStatuses.includes(dto.status)) {
            throw new BadRequestException(
                'Invalid status, must be APPROVED, REJECTED, or SUSPENDED',
            );
        }

        return this.adminService.updateSpaceStatus(user.id, spaceId, dto);
    }

    @Patch('events/:eventId/cancel')
    @ApiOperation({ summary: 'Cancel an event' })
    @ApiOkResponse({
        description: 'Event canceled',
        example: {
            eventId: 'cmlnqyo1g001c0wf2cl8xfxqo',
            status: 'CANCELLED',
        },
    })
    @ApiBadRequestResponse({
        description: 'Bad Input',
        example: {
            statusCode: 400,
            timestamp: '2026-02-18T20:36:05.041Z',
            path: '/api/admin/events/cmlnqyo1g001c0wf2cl8xfxqo/cancel',
            message: {
                message: [
                    'Reason must be at least 3 characters',
                    'Reason must be a string',
                ],
                error: 'Bad Request',
                statusCode: 400,
            },
        },
    })
    @ApiForbiddenResponse({
        description: 'Forbidden',
        examples: {
            AlreadyCancelled: {
                summary: 'Event is already cancelled',
                value: {
                    statusCode: 403,
                    timestamp: '2026-02-18T20:40:33.383Z',
                    path: '/api/admin/events/cmlnqyo1g001c0wf2cl8xfxqo/cancel',
                    message: {
                        message: 'Event is already cancelled',
                        error: 'Forbidden',
                        statusCode: 403,
                    },
                },
            },
            AlreadyCompleted: {
                summary: 'Event is already completed',
                value: {
                    statusCode: 403,
                    timestamp: '2026-02-18T20:40:33.383Z',
                    path: '/api/admin/events/cmlnqyo1g001c0wf2cl8xfxqo/cancel',
                    message: {
                        message: 'Event is already completed',
                        error: 'Forbidden',
                        statusCode: 403,
                    },
                },
            },
        },
    })
    @ApiNotFoundResponse({
        description: 'Event not found',
        example: {
            statusCode: 404,
            timestamp: '2026-02-18T20:36:05.041Z',
            path: '/api/admin/events/cmlnqyo1g001c0wf2cl8xfxqo/cancel',
            message: {
                message: 'Event not found',
                error: 'Not Found',
                statusCode: 404,
            },
        },
    })
    async cancelEvent(
        @GetUser() user: UserForTokenDto,
        @Param('eventId') eventId: string,
        @Body() dto: AdminEventCancelDto,
    ): Promise<AdminEventCancelResponseDto> {
        return this.adminService.cancelEvent(user.id, eventId, dto);
    }

    @Get('bookings')
    @ApiOperation({ summary: 'List all bookings (admin read-only, paginated)' })
    @ApiQuery({ name: 'status', enum: BookingStatus })
    @ApiQuery({ name: 'spaceId', example: 'space_123' })
    @ApiQuery({ name: 'page', example: 1 })
    @ApiQuery({ name: 'limit', example: 20 })
    @ApiQuery({ name: 'sortBy', enum: ['createdAt', 'startTime'] })
    @ApiQuery({ name: 'order', enum: ['asc', 'desc'] })
    @ApiOkResponse({
        type: AdminBookingsListResponseDto,
        description: 'Api returns a list of bookings with pagination',
        examples: {
            Unfiltered: {
                summary: 'Unfiltered Bookings',
                value: {
                    bookings: [
                        {
                            bookingId: 'bktest-paid-cancel-ok',
                            spaceId: 'cmlntv5ad00020w1cd485og40',
                            renterId: 'cmlnqybxf000r0wf27384m23k',
                            spaceName: 'Noida darbar',
                            renterName: 'Varun Kumar',
                            status: 'CANCELLED',
                            startTime: '2026-02-19T04:12:35.769Z',
                            endTime: '2026-02-19T08:12:35.769Z',
                            totalPrice: 900,
                        },
                        {
                            bookingId: 'bktest-notowner',
                            spaceId: 'cmlntv5ad00020w1cd485og40',
                            renterId: 'cmlnqyhjf00100wf25asi3goo',
                            spaceName: 'Noida darbar',
                            renterName: 'Priya Sharma',
                            status: 'EXPIRED',
                            startTime: '2026-02-19T16:08:41.416Z',
                            endTime: '2026-02-19T18:08:41.416Z',
                            totalPrice: 700,
                        },
                        {
                            bookingId: 'bktest-approved-cancel-not-ok',
                            spaceId: 'cmlntv5ad00020w1cd485og40',
                            renterId: 'cmlnqybxf000r0wf27384m23k',
                            spaceName: 'Noida darbar',
                            renterName: 'Varun Kumar',
                            status: 'APPROVED',
                            startTime: '2026-02-17T17:05:38.821Z',
                            endTime: '2026-02-17T21:05:38.821Z',
                            totalPrice: 1200,
                        },
                        {
                            bookingId: 'bktest-approved-cancel-ok',
                            spaceId: 'cmlntv5ad00020w1cd485og40',
                            renterId: 'cmlnqybxf000r0wf27384m23k',
                            spaceName: 'Noida darbar',
                            renterName: 'Varun Kumar',
                            status: 'CANCELLED',
                            startTime: '2026-02-19T16:04:30.973Z',
                            endTime: '2026-02-19T20:04:30.973Z',
                            totalPrice: 1200,
                        },
                        {
                            bookingId: 'bktest-pending-cancel',
                            spaceId: 'cmlntv5ad00020w1cd485og40',
                            renterId: 'cmlnqybxf000r0wf27384m23k',
                            spaceName: 'Noida darbar',
                            renterName: 'Varun Kumar',
                            status: 'CANCELLED',
                            startTime: '2026-03-25T10:00:00.000Z',
                            endTime: '2026-03-25T14:00:00.000Z',
                            totalPrice: 1000,
                        },
                        {
                            bookingId: 'bktest-reject',
                            spaceId: 'cmlntv5ad00020w1cd485og40',
                            renterId: 'cmlnqybxf000r0wf27384m23k',
                            spaceName: 'Noida darbar',
                            renterName: 'Varun Kumar',
                            status: 'REJECTED',
                            startTime: '2026-03-30T10:00:00.000Z',
                            endTime: '2026-03-30T14:00:00.000Z',
                            totalPrice: 1000,
                        },
                        {
                            bookingId: 'bktest-pending1',
                            spaceId: 'cmlntv5ad00020w1cd485og40',
                            renterId: 'cmlnqybxf000r0wf27384m23k',
                            spaceName: 'Noida darbar',
                            renterName: 'Varun Kumar',
                            status: 'APPROVED',
                            startTime: '2026-03-25T10:00:00.000Z',
                            endTime: '2026-03-25T14:00:00.000Z',
                            totalPrice: 1000,
                        },
                        {
                            bookingId: 'bktest-pending3',
                            spaceId: 'cmlntv5ad00020w1cd485og40',
                            renterId: 'cmlnqybxf000r0wf27384m23k',
                            spaceName: 'Noida darbar',
                            renterName: 'Varun Kumar',
                            status: 'REJECTED',
                            startTime: '2026-03-25T13:00:00.000Z',
                            endTime: '2026-03-25T16:00:00.000Z',
                            totalPrice: 750,
                        },
                        {
                            bookingId: 'bktest-pending2',
                            spaceId: 'cmlntv5ad00020w1cd485og40',
                            renterId: 'cmlnqybxf000r0wf27384m23k',
                            spaceName: 'Noida darbar',
                            renterName: 'Varun Kumar',
                            status: 'REJECTED',
                            startTime: '2026-03-25T11:00:00.000Z',
                            endTime: '2026-03-25T13:00:00.000Z',
                            totalPrice: 500,
                        },
                        {
                            bookingId: 'bktest-overlap2',
                            spaceId: 'cmlntv5ad00020w1cd485og40',
                            renterId: 'cmlnqybxf000r0wf27384m23k',
                            spaceName: 'Noida darbar',
                            renterName: 'Varun Kumar',
                            status: 'EXPIRED',
                            startTime: '2026-03-20T12:00:00.000Z',
                            endTime: '2026-03-20T15:00:00.000Z',
                            totalPrice: 750,
                        },
                        {
                            bookingId: 'bktest-overlap1',
                            spaceId: 'cmlntv5ad00020w1cd485og40',
                            renterId: 'cmlnqybxf000r0wf27384m23k',
                            spaceName: 'Noida darbar',
                            renterName: 'Varun Kumar',
                            status: 'APPROVED',
                            startTime: '2026-03-20T10:00:00.000Z',
                            endTime: '2026-03-20T14:00:00.000Z',
                            totalPrice: 1000,
                        },
                        {
                            bookingId: 'cmlqm576y00010w6tdja9fkuz',
                            spaceId: 'cmlntv5ad00020w1cd485og40',
                            renterId: 'cmlnqyjcx00130wf2cwyanhj0',
                            spaceName: 'Noida darbar',
                            renterName: 'Amit Patel',
                            status: 'EXPIRED',
                            startTime: '2026-02-19T10:30:00.000Z',
                            endTime: '2026-02-19T23:30:00.000Z',
                            totalPrice: 1590.1599999999999,
                        },
                        {
                            bookingId: 'test_booking_2',
                            spaceId: 'cmlnqy7dc00080wf2hqt13c28',
                            renterId: 'cmlnqyl7700160wf2zgdbyx7f',
                            spaceName: 'Startup Studio',
                            renterName: 'Sneha Gupta',
                            status: 'EXPIRED',
                            startTime: '2026-02-20T10:41:35.677Z',
                            endTime: '2026-02-20T13:41:35.677Z',
                            totalPrice: 900,
                        },
                        {
                            bookingId: 'bktest-expired-cancel',
                            spaceId: 'cmlntv5ad00020w1cd485og40',
                            renterId: 'cmlnqybxf000r0wf27384m23k',
                            spaceName: 'Noida darbar',
                            renterName: 'Varun Kumar',
                            status: 'EXPIRED',
                            startTime: '2026-03-26T10:00:00.000Z',
                            endTime: '2026-03-26T14:00:00.000Z',
                            totalPrice: 800,
                        },
                        {
                            bookingId: 'test_booking_1',
                            spaceId: 'cmlntv5ad00020w1cd485og40',
                            renterId: 'cmlnqyl7700160wf2zgdbyx7f',
                            spaceName: 'Noida darbar',
                            renterName: 'Sneha Gupta',
                            status: 'EXPIRED',
                            startTime: '2026-02-17T10:41:35.677Z',
                            endTime: '2026-02-20T14:41:35.677Z',
                            totalPrice: 1000,
                        },
                        {
                            bookingId: 'cmlnqynj8001a0wf2tbn2fsat',
                            spaceId: 'cmlnqy6fi00040wf2u2v22oym',
                            renterId: 'cmlnqybxf000r0wf27384m23k',
                            spaceName: 'Ram Ram Ji',
                            renterName: 'Varun Kumar',
                            status: 'PAID',
                            startTime: '2026-03-15T18:00:00.000Z',
                            endTime: '2026-03-15T22:00:00.000Z',
                            totalPrice: 1600,
                        },
                    ],
                    meta: {
                        page: 1,
                        limit: 20,
                        total: 16,
                        totalPages: 1,
                    },
                },
            },
            Filtered: {
                summary:
                    'Filtered Bookings with: ?status=EXPIRED&spaceId=cmlntv5ad00020w1cd485og40&page=1&limit=20&sortBy=startTime&order=desc',
                value: {
                    bookings: [
                        {
                            bookingId: 'bktest-expired-cancel',
                            spaceId: 'cmlntv5ad00020w1cd485og40',
                            renterId: 'cmlnqybxf000r0wf27384m23k',
                            spaceName: 'Noida darbar',
                            renterName: 'Varun Kumar',
                            status: 'EXPIRED',
                            startTime: '2026-03-26T10:00:00.000Z',
                            endTime: '2026-03-26T14:00:00.000Z',
                            totalPrice: 800,
                        },
                        {
                            bookingId: 'bktest-overlap2',
                            spaceId: 'cmlntv5ad00020w1cd485og40',
                            renterId: 'cmlnqybxf000r0wf27384m23k',
                            spaceName: 'Noida darbar',
                            renterName: 'Varun Kumar',
                            status: 'EXPIRED',
                            startTime: '2026-03-20T12:00:00.000Z',
                            endTime: '2026-03-20T15:00:00.000Z',
                            totalPrice: 750,
                        },
                        {
                            bookingId: 'bktest-notowner',
                            spaceId: 'cmlntv5ad00020w1cd485og40',
                            renterId: 'cmlnqyhjf00100wf25asi3goo',
                            spaceName: 'Noida darbar',
                            renterName: 'Priya Sharma',
                            status: 'EXPIRED',
                            startTime: '2026-02-19T16:08:41.416Z',
                            endTime: '2026-02-19T18:08:41.416Z',
                            totalPrice: 700,
                        },
                        {
                            bookingId: 'cmlqm576y00010w6tdja9fkuz',
                            spaceId: 'cmlntv5ad00020w1cd485og40',
                            renterId: 'cmlnqyjcx00130wf2cwyanhj0',
                            spaceName: 'Noida darbar',
                            renterName: 'Amit Patel',
                            status: 'EXPIRED',
                            startTime: '2026-02-19T10:30:00.000Z',
                            endTime: '2026-02-19T23:30:00.000Z',
                            totalPrice: 1590.1599999999999,
                        },
                        {
                            bookingId: 'test_booking_1',
                            spaceId: 'cmlntv5ad00020w1cd485og40',
                            renterId: 'cmlnqyl7700160wf2zgdbyx7f',
                            spaceName: 'Noida darbar',
                            renterName: 'Sneha Gupta',
                            status: 'EXPIRED',
                            startTime: '2026-02-17T10:41:35.677Z',
                            endTime: '2026-02-20T14:41:35.677Z',
                            totalPrice: 1000,
                        },
                    ],
                    meta: {
                        page: 1,
                        limit: 20,
                        total: 5,
                        totalPages: 1,
                    },
                },
            },
            EmptyResponse: {
                summary: 'Empty response',
                value: {
                    bookings: [],
                    meta: {
                        page: 1,
                        limit: 20,
                        total: 0,
                        totalPages: 0,
                    },
                },
            },
        },
    })
    @ApiBadRequestResponse({
        description: 'Invalid query parameters',
        example: {
            statusCode: 400,
            timestamp: '2026-02-18T21:35:42.073Z',
            path: '/api/admin/bookings?status=EXPIREDss&spaceId=cmlntv5ad00020w1cd485og40&page=1&limit=20&sortBy=startTime&order=desc',
            message: {
                message: [
                    'status must be one of the following values: PENDING, EXPIRED, APPROVED, REJECTED, PAID, COMPLETED, CANCELLED',
                ],
                error: 'Bad Request',
                statusCode: 400,
            },
        },
    })
    async listBookings(@Query() query: AdminBookingsQueryDto) {
        return this.adminService.listBookings(query);
    }

    @Get('tickets')
    @ApiOperation({ summary: 'List all tickets (admin read-only, paginated)' })
    @ApiQuery({ name: 'status', enum: TicketStatus })
    @ApiQuery({ name: 'eventId', example: 'evt_123' })
    @ApiQuery({ name: 'attendeeId', example: 'user_123' })
    @ApiQuery({ name: 'page', example: 1 })
    @ApiQuery({ name: 'limit', example: 20 })
    @ApiOkResponse({
        type: AdminTicketsListResponseDto,
        description: 'Api returns a list of tickets with pagination',
        examples: {
            Unfiltered: {
                summary: 'Unfiltered tickets',
                value: {
                    tickets: [
                        {
                            ticketId: 'cmlnqyt8l001w0wf22hze95cb',
                            eventId: 'cmlnqyrp9001q0wf2qy0shmsj',
                            attendeeId: 'cmlnqyhjf00100wf25asi3goo',
                            eventTitle: 'PARTIAL (3/10 tickets)',
                            attendeeName: 'Priya Sharma',
                            status: 'CANCELLED',
                            pricePaid: 0,
                            ticketType: 'STUDENT',
                            cancelledAt: '2026-02-18T20:44:07.724Z',
                        },
                        {
                            ticketId: 'cmlnqysqf001u0wf2emgz5mg5',
                            eventId: 'cmlnqyrp9001q0wf2qy0shmsj',
                            attendeeId: 'cmlnqyfph000x0wf2hy60v8fn',
                            eventTitle: 'PARTIAL (3/10 tickets)',
                            attendeeName: 'Anurodh Kumar',
                            status: 'CANCELLED',
                            pricePaid: 0,
                            ticketType: 'REGULAR',
                            cancelledAt: '2026-02-18T20:44:07.724Z',
                        },
                        {
                            ticketId: 'cmlnqys7n001s0wf2yxv5xmln',
                            eventId: 'cmlnqyrp9001q0wf2qy0shmsj',
                            attendeeId: 'cmlnqydvs000u0wf2ty5xp6hq',
                            eventTitle: 'PARTIAL (3/10 tickets)',
                            attendeeName: 'Shashwat Raghuvanshi',
                            status: 'CANCELLED',
                            pricePaid: 0,
                            ticketType: 'STUDENT',
                            cancelledAt: '2026-02-18T20:44:07.724Z',
                        },
                        {
                            ticketId: 'cmlnqyone001e0wf2e338o7k1',
                            eventId: 'cmlnqyo1g001c0wf2cl8xfxqo',
                            attendeeId: 'cmlnqydvs000u0wf2ty5xp6hq',
                            eventTitle: 'FULL TEST EVENT',
                            attendeeName: 'Shashwat Raghuvanshi',
                            status: 'PURCHASED',
                            pricePaid: 0,
                            ticketType: 'REGULAR',
                            cancelledAt: '2026-02-18T20:37:11.255Z',
                        },
                        {
                            ticketId: 'cmlnqyp5u001g0wf2lv8rha0i',
                            eventId: 'cmlnqyr6t001o0wf2ks9dgs76',
                            attendeeId: 'cmlnqyfph000x0wf2hy60v8fn',
                            eventTitle: 'EMPTY EVENT (0 tickets)',
                            attendeeName: 'Anurodh Kumar',
                            status: 'CANCELLED',
                            pricePaid: 0,
                            ticketType: 'STUDENT',
                            cancelledAt: '2026-02-18T20:43:33.203Z',
                        },
                        {
                            ticketId: 'cmlnqypo5001i0wf2nurw5ikz',
                            eventId: 'cmlnqyo1g001c0wf2cl8xfxqo',
                            attendeeId: 'cmlnqyhjf00100wf25asi3goo',
                            eventTitle: 'FULL TEST EVENT',
                            attendeeName: 'Priya Sharma',
                            status: 'PURCHASED',
                            pricePaid: 0,
                            ticketType: 'REGULAR',
                            cancelledAt: '2026-03-14T10:00:00.000Z',
                        },
                        {
                            ticketId: 'cmlnqyq6b001k0wf28czgdlpx',
                            eventId: 'cmlnqyr6t001o0wf2ks9dgs76',
                            attendeeId: 'cmlnqyjcx00130wf2cwyanhj0',
                            eventTitle: 'EMPTY EVENT (0 tickets)',
                            attendeeName: 'Amit Patel',
                            status: 'CANCELLED',
                            pricePaid: 0,
                            ticketType: 'STUDENT',
                            cancelledAt: '2026-02-18T20:43:33.203Z',
                        },
                        {
                            ticketId: 'cmlnqyqoj001m0wf2acc2nr0a',
                            eventId: 'cmlnqyo1g001c0wf2cl8xfxqo',
                            attendeeId: 'cmlnqyl7700160wf2zgdbyx7f',
                            eventTitle: 'FULL TEST EVENT',
                            attendeeName: 'Sneha Gupta',
                            status: 'PURCHASED',
                            pricePaid: 0,
                            ticketType: 'REGULAR',
                            cancelledAt: '2026-02-18T20:37:11.255Z',
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
            Filtered: {
                summary:
                    'Filtered tickets with: ?status=CANCELLED&eventId=cmlnqyrp9001q0wf2qy0shmsj&attendeeId=cmlnqyig700120wf2htty89l2&page=1&limit=20',
                value: {
                    tickets: [
                        {
                            ticketId: 'cmlnqyt8l001w0wf22hze95cb',
                            eventId: 'cmlnqyrp9001q0wf2qy0shmsj',
                            attendeeId: 'cmlnqyig700120wf2htty89l2',
                            eventTitle: 'PARTIAL (3/10 tickets)',
                            attendeeName: 'Priya Sharma',
                            status: 'CANCELLED',
                            pricePaid: 0,
                            ticketType: 'STUDENT',
                            cancelledAt: '2026-02-18T20:44:07.724Z',
                        },
                    ],
                    meta: {
                        page: 1,
                        limit: 20,
                        total: 1,
                        totalPages: 1,
                    },
                },
            },
            EmptyResponse: {
                summary: 'Empty response',
                value: {
                    tickets: [],
                    meta: {
                        page: 20,
                        limit: 20,
                        total: 3,
                        totalPages: 1,
                    },
                },
            },
        },
    })
    @ApiBadRequestResponse({
        description: 'Invalid query parameters',
        example: {
            statusCode: 400,
            timestamp: '2026-02-18T21:03:39.494Z',
            path: '/api/admin/tickets?status=PURCHASEDwq&page=1&limit=20',
            message: {
                message: [
                    'status must be one of the following values: PURCHASED, CANCELLED, REFUNDED',
                ],
                error: 'Bad Request',
                statusCode: 400,
            },
        },
    })
    async listTickets(@Query() query: AdminTicketsQueryDto) {
        return this.adminService.listTickets(query);
    }

    @Get('users')
    @ApiOperation({ summary: 'List all users (admin, paginated/filtered)' })
    @ApiQuery({ name: 'userType', enum: UserType })
    @ApiQuery({ name: 'status', enum: UserStatus })
    @ApiQuery({ name: 'email', example: 'user@riti.no' })
    @ApiQuery({ name: 'page', example: 1 })
    @ApiQuery({ name: 'limit', example: 50 })
    @ApiOkResponse({
        type: AdminUsersListResponseDto,
        description: 'List of users',
        examples: {
            Unfiltered: {
                summary: 'Unfiltered users',
                value: {
                    users: [
                        {
                            id: 'cmlnw68aw00000wyqlnondku8',
                            email: 'newman@gmail.com',
                            fullName: 'Shashwat Singh',
                            userType: 'VENDOR',
                            status: 'ACTIVE',
                            isAdmin: false,
                            createdAt: '2026-02-15T15:19:59.624Z',
                            vendorStatus: 'SUSPENDED',
                            spacesCount: 0,
                            eventsCount: 0,
                            bookingsCount: 0,
                            ticketsCount: 0,
                        },
                        {
                            id: 'cmlnqyl7700160wf2zgdbyx7f',
                            email: 'newman.attendee5@gmail.com',
                            fullName: 'Sneha Gupta',
                            userType: 'ATTENDEE',
                            status: 'ACTIVE',
                            isAdmin: false,
                            createdAt: '2026-02-15T12:54:05.011Z',
                            spacesCount: 0,
                            eventsCount: 0,
                            bookingsCount: 2,
                            ticketsCount: 1,
                        },
                        {
                            id: 'cmlnqyjcx00130wf2cwyanhj0',
                            email: 'newman.attendee4@gmail.com',
                            fullName: 'Amit Patel',
                            userType: 'ATTENDEE',
                            status: 'ACTIVE',
                            isAdmin: false,
                            createdAt: '2026-02-15T12:54:02.625Z',
                            spacesCount: 0,
                            eventsCount: 0,
                            bookingsCount: 1,
                            ticketsCount: 1,
                        },
                        {
                            id: 'cmlnqyhjf00100wf25asi3goo',
                            email: 'newman.attendee3@gmail.com',
                            fullName: 'Priya Sharma',
                            userType: 'ATTENDEE',
                            status: 'ACTIVE',
                            isAdmin: false,
                            createdAt: '2026-02-15T12:54:00.268Z',
                            spacesCount: 0,
                            eventsCount: 0,
                            bookingsCount: 1,
                            ticketsCount: 2,
                        },
                        {
                            id: 'cmlnqyfph000x0wf2hy60v8fn',
                            email: 'newman.attendee2@gmail.com',
                            fullName: 'Anurodh Kumar',
                            userType: 'ATTENDEE',
                            status: 'ACTIVE',
                            isAdmin: false,
                            createdAt: '2026-02-15T12:53:57.893Z',
                            spacesCount: 0,
                            eventsCount: 0,
                            bookingsCount: 0,
                            ticketsCount: 2,
                        },
                        {
                            id: 'cmlnqydvs000u0wf2ty5xp6hq',
                            email: 'newman.attendee1@gmail.com',
                            fullName: 'Shashwat Raghuvanshi',
                            userType: 'ATTENDEE',
                            status: 'ACTIVE',
                            isAdmin: false,
                            createdAt: '2026-02-15T12:53:55.528Z',
                            spacesCount: 0,
                            eventsCount: 0,
                            bookingsCount: 0,
                            ticketsCount: 2,
                        },
                        {
                            id: 'cmlnqybxf000r0wf27384m23k',
                            email: 'newman.host1@gmail.com',
                            fullName: 'Varun Kumar',
                            userType: 'HOST',
                            status: 'ACTIVE',
                            isAdmin: false,
                            createdAt: '2026-02-15T12:53:52.996Z',
                            hostingStatus: 'ACTIVE',
                            spacesCount: 0,
                            eventsCount: 0,
                            bookingsCount: 12,
                            ticketsCount: 0,
                        },
                        {
                            id: 'cmlnqt8rp00000wplhnx0zt1p',
                            email: 'newman.vendor1@gmail.com',
                            fullName: 'Ramesh Chatterji',
                            userType: 'VENDOR',
                            status: 'ACTIVE',
                            isAdmin: false,
                            createdAt: '2026-02-15T12:49:55.622Z',
                            vendorStatus: 'SUSPENDED',
                            spacesCount: 0,
                            eventsCount: 0,
                            bookingsCount: 0,
                            ticketsCount: 0,
                        },
                    ],
                    meta: {
                        page: 1,
                        limit: 50,
                        total: 8,
                        totalPages: 1,
                    },
                },
            },
            Filtered: {
                summary:
                    'Filtered tickets with: ?status=ACTIVE&email=newman@gmail.com&page=1&limit=29',
                value: {
                    users: [
                        {
                            id: 'cmlnw68aw00000wyqlnondku8',
                            email: 'newman@gmail.com',
                            fullName: 'Shashwat Singh',
                            userType: 'VENDOR',
                            status: 'ACTIVE',
                            isAdmin: false,
                            createdAt: '2026-02-15T15:19:59.624Z',
                            vendorStatus: 'SUSPENDED',
                            spacesCount: 0,
                            eventsCount: 0,
                            bookingsCount: 0,
                            ticketsCount: 0,
                        },
                    ],
                    meta: {
                        page: 1,
                        limit: 29,
                        total: 1,
                        totalPages: 1,
                    },
                },
            },
            EmptyResponse: {
                summary: 'Empty response',
                value: {
                    users: [],
                    meta: {
                        page: 1,
                        limit: 29,
                        total: 0,
                        totalPages: 0,
                    },
                },
            },
        },
    })
    @ApiBadRequestResponse({
        description: 'Invalid query parameters',
        example: {
            statusCode: 400,
            timestamp: '2026-02-18T21:21:46.810Z',
            path: '/api/admin/users?userType=VENDORsd',
            message: {
                message: [
                    'userType must be one of the following values: ATTENDEE, HOST, VENDOR, ADMIN',
                ],
                error: 'Bad Request',
                statusCode: 400,
            },
        },
    })
    async listUsers(@Query() query: AdminUsersQueryDto) {
        return this.adminService.listUsers(query);
    }

    @Get('users/:userId')
    @ApiOperation({
        summary:
            'Get full user details with profiles (admin only), for a specific user. Also returns the number of times the user has logged into the application under "sessionCount"',
    })
    @ApiParam({ name: 'userId', example: 'cmlnqybxf000r0wf27384m23k' })
    @ApiOkResponse({
        type: AdminUserDetailResponseDto,
        description: 'User details',
        example: {
            id: 'cmlnqybxf000r0wf27384m23k',
            email: 'newman.host1@gmail.com',
            fullName: 'Varun Kumar',
            profilePicture: null,
            country: 'NO',
            language: 'EN',
            city: null,
            termsAccepted: false,
            initialIntent: 'HOST',
            userType: 'HOST',
            status: 'ACTIVE',
            isAdmin: false,
            createdAt: '2026-02-15T12:53:52.996Z',
            updatedAt: '2026-02-15T12:53:52.996Z',
            attendee: null,
            host: {
                bio: 'Tech event organizer.',
                phoneNumber: '+47 987 65 432',
                website: null,
                instagramUrl: null,
                tikTokUrl: null,
                twitterUrl: null,
                otherSocialLinks: null,
                stripeAccountId: null,
                stripeOnboarded: false,
                stripeVerified: false,
                hostingStatus: 'ACTIVE',
                suspendedAt: null,
                suspensionReason: null,
            },
            vendor: null,
            spacesCount: 0,
            eventsCount: 0,
            bookingsCount: 12,
            ticketsCount: 0,
            sessionsCount: 1,
        },
    })
    @ApiNotFoundResponse({
        description: 'User not found',
        example: {
            statusCode: 404,
            timestamp: '2026-02-18T21:44:50.025Z',
            path: '/api/admin/users/cmlnqybxf000r0wf27384m23ka',
            message: {
                message: 'User not found',
                error: 'Not Found',
                statusCode: 404,
            },
        },
    })
    async getUserDetails(@Param('userId') userId: string) {
        return this.adminService.getUserDetails(userId);
    }

    @Patch('users/:userId/suspend')
    @ApiOperation({ summary: 'Suspend user account + profiles (admin only)' })
    @ApiParam({ name: 'userId', example: 'cmlnqybxf000r0wf27384m23k' })
    @ApiBody({ type: AdminSuspendUserDto })
    @ApiOkResponse({
        type: AdminSuspendUserResponseDto,
        description: 'User is suspended',
        example: {
            userId: 'cmlnqybxf000r0wf27384m23k',
            status: 'SUSPENDED',
            suspendedAt: '2026-02-18T22:11:57.926Z',
        },
    })
    @ApiForbiddenResponse({
        description: 'Cannot suspend admin or already suspended',
        examples: {
            AlreadySuspended: {
                summary: 'User account already suspended',
                value: {
                    statusCode: 403,
                    timestamp: '2026-02-18T22:12:37.973Z',
                    path: '/api/admin/users/cmlnqybxf000r0wf27384m23k/suspend',
                    message: {
                        message: 'User already suspended',
                        error: 'Forbidden',
                        statusCode: 403,
                    },
                },
            },
            CannotSuspendAdmin: {
                summary: 'Cannot suspend admin accounts',
                value: {
                    statusCode: 403,
                    timestamp: '2026-02-18T22:12:37.973Z',
                    path: '/api/admin/users/cmlnqybxf000r0wf27384m23k/suspend',
                    message: {
                        message: 'Cannot suspend admin accounts',
                        error: 'Forbidden',
                        statusCode: 403,
                    },
                },
            },
        },
    })
    @ApiBadRequestResponse({
        description: 'Missing reason',
        example: {
            statusCode: 400,
            timestamp: '2026-02-18T22:17:17.303Z',
            path: '/api/admin/users/cmlnqybxf000r0wf27384m23k/suspend',
            message: {
                message: [
                    'Reason cannot exceed 500 characters',
                    'Reason must be at least 3 characters',
                    'Reason is required to suspend user',
                ],
                error: 'Bad Request',
                statusCode: 400,
            },
        },
    })
    async suspendUser(
        @GetUser() admin: UserForTokenDto,
        @Param('userId') userId: string,
        @Body() dto: AdminSuspendUserDto,
    ) {
        return this.adminService.suspendUser(admin.id, userId, dto);
    }

    @Patch('users/:userId/unsuspend')
    async unsuspendUser(
        @GetUser() admin: UserForTokenDto,
        @Param('userId') userId: string,
    ) {
        return this.adminService.unsuspendUser(admin.id, userId);
    }

    @Get('commissions')
    @ApiOperation({ summary: 'Get commission overview' })
    @ApiOkResponse({
        type: AdminCommissionOverviewResponseDto,
        description: 'Commission overview',
        example: {
            lifetimeCommission: 159.02,
            todayCommission: 0,
            monthCommission: 159.02,
            refundedCommission: 0,
        },
    })
    async getCommissions(): Promise<AdminCommissionOverviewResponseDto> {
        this.logger.debug('Getting commission overview');
        return this.adminService.getCommissionOverview();
    }

    @Get('finance/overview')
    @ApiOperation({ summary: 'Get platform financial overview' })
    @ApiOkResponse({
        description: 'Aggregated financial data for platform',
        type: AdminFinanceOverviewDto,
    })
    @ApiForbiddenResponse({
        description: 'Only admins can access this endpoint',
    })
    async getFinanceOverview(): Promise<AdminFinanceOverviewDto> {
        return this.adminService.getPlatformFinancialOverview();
    }

    @Get('finance/transcations')
    async getTransactions(@Query('limit') limit = 50) {
        return this.db.financialLedger.findMany({
            orderBy: { createdAt: 'desc' },
            take: Number(limit),
        });
    }

    @Get('finance/revenue/monthly')
    async getMonthlyRevenue(@Query('months') months: number) {
        return this.financeService.getMonthlyPlatformRevenue(Number(months));
    }
}
