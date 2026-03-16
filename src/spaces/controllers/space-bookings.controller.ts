import {
    Body,
    Controller,
    ForbiddenException,
    Get,
    Logger,
    Param,
    Patch,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiBody,
    ApiConflictResponse,
    ApiCreatedResponse,
    ApiForbiddenResponse,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiOperation,
    ApiParam,
    ApiQuery,
    ApiTags,
} from '@nestjs/swagger';
import { SpaceBookingCronService, SpaceBookingsService } from '../services';
import { AdminProfileGuard, VendorProfileGuard } from 'src/users/guards';
import { JwtAuthGuard, SuspentionGuard } from 'src/auth/guards';
import { CreateBookingDto } from '../dto/create-booking.dto';
import { GetUser } from 'src/auth/decorators';
import { type UserForTokenDto } from 'src/auth/interfaces';
import { BookingStatus, UserType } from '@prisma/client';
import {
    BookingStatusResponseDto,
    UpdateBookingStatusDto,
    VendorBookingsListDto,
    VendorBookingsQueryDto,
} from '../dto';
import {
    UserBookingsListDto,
    UserBookingsQueryDto,
} from '../dto/user-bookings.dto';

@ApiTags('Space Bookings')
@Controller('spaces/bookings')
@UseGuards(JwtAuthGuard, SuspentionGuard)
export class SpaceBookingsController {
    private readonly logger = new Logger(SpaceBookingsController.name);
    constructor(
        private readonly bookingCronService: SpaceBookingCronService,
        private readonly bookingsService: SpaceBookingsService,
    ) {}

    @Post('cron/expire-pending')
    @UseGuards(AdminProfileGuard)
    @ApiOperation({ summary: 'Manual booking expiry (admin)' })
    @ApiCreatedResponse({
        description: 'Expired pending bookings',
        example: {
            message: 'Expired pending bookings',
        },
    })
    async manualExpiry() {
        await this.bookingCronService.triggerExpiry();
        return { message: 'Expired pending bookings' };
    }

    @Post('cron/complete-bookings')
    @UseGuards(AdminProfileGuard)
    @ApiOperation({ summary: 'Manual booking completion (admin)' })
    @ApiCreatedResponse({
        description: 'Complete paid bookings',
        example: {
            message: 'Complete paid bookings',
        },
    })
    async manualBookingCompletion() {
        await this.bookingCronService.triggerBookingsCompletion();
        return { message: 'Complete paid bookings' };
    }

    @Post()
    @ApiOperation({ summary: 'Create space booking request' })
    @ApiBody({ type: CreateBookingDto })
    @ApiCreatedResponse({
        description: 'Created space booking request',
        type: BookingStatusResponseDto,
        example: {
            id: 'cmlqlxg5o00010w6l7z3z6ya5',
            status: 'PENDING',
        },
    })
    @ApiBadRequestResponse({
        description: 'Bad requests for bookings',
        examples: {
            SpaceUnavailable: {
                summary: 'Space is not available',
                value: {
                    statusCode: 400,
                    timestamp: '2026-02-17T12:44:48.163Z',
                    path: '/api/spaces/bookings',
                    message: {
                        message: 'Space unavailable for booking',
                        error: 'Bad Request',
                        statusCode: 400,
                    },
                },
            },
            MinBookingTimeViolation: {
                summary: 'Minimum booking time criteria violation',
                value: {
                    statusCode: 400,
                    timestamp: '2026-02-17T12:46:32.788Z',
                    path: '/api/spaces/bookings',
                    message: {
                        message: 'Minimum 12h booking required',
                        error: 'Bad Request',
                        statusCode: 400,
                    },
                },
            },
            MinLeadTimeViolation: {
                summary: 'Minimum lead time criteria violation',
                value: {
                    statusCode: 400,
                    timestamp: '2026-02-17T12:48:22.508Z',
                    path: '/api/spaces/bookings',
                    message: {
                        message: 'Minimum 24h advance notice required',
                        error: 'Bad Request',
                        statusCode: 400,
                    },
                },
            },
            PendingBookingExists: {
                summary: 'Pending booking already exists',
                value: {
                    statusCode: 400,
                    timestamp: '2026-02-17T13:14:40.809Z',
                    path: '/api/spaces/bookings',
                    message: {
                        message: 'Cannot book - pending booking already exists',
                        error: 'Bad Request',
                        statusCode: 400,
                    },
                },
            },
        },
    })
    @ApiForbiddenResponse({
        description: 'Forbidden for attendees and hosts',
        example: {
            statusCode: 403,
            timestamp: '2026-02-16T17:40:20.753Z',
            path: '/api/spaces/bookings',
            message: {
                message: 'Only Attendees and Hosts can book spaces',
                error: 'Forbidden',
                statusCode: 403,
            },
        },
    })
    @ApiNotFoundResponse({
        description: 'Space not found',
        example: {
            statusCode: 404,
            timestamp: '2026-02-17T12:51:11.415Z',
            path: '/api/spaces/bookings',
            message: {
                message: 'Space not found',
                error: 'Not Found',
                statusCode: 404,
            },
        },
    })
    @ApiConflictResponse({
        description: 'Booking already exists',
        example: {
            statusCode: 409,
            timestamp: '2026-02-17T12:55:12.296Z',
            path: '/api/spaces/bookings',
            message: {
                message: 'Time slot unavailable',
                error: 'Conflict',
                statusCode: 409,
            },
        },
    })
    async createBooking(
        @GetUser() user: UserForTokenDto,
        @Body() dto: CreateBookingDto,
    ): Promise<{ id: string; status: string }> {
        if (
            user.userType === UserType.VENDOR ||
            user.userType === UserType.ADMIN
        ) {
            throw new ForbiddenException(
                'Only Attendees and Hosts can book spaces',
            );
        }

        return this.bookingsService.createBookingRequest(dto, user.id);
    }

    @Get('vendor')
    @ApiOperation({ summary: 'Vendor booking requests (all spaces)' })
    @ApiQuery({
        name: 'status',
        enum: BookingStatus,
        enumName: 'BookingStatus',
        example: BookingStatus.PENDING,
        required: false,
        type: String,
    })
    @ApiQuery({
        name: 'spaceId',
        example: 'clabc123',
        required: false,
        type: String,
    })
    @ApiQuery({ name: 'page', example: 1, type: Number, required: false })
    @ApiQuery({ name: 'limit', example: 20, type: Number, required: false })
    @ApiOkResponse({
        type: VendorBookingsListDto,
        description: 'Paigniated list of all bookings',
        examples: {
            UnfilteredRes: {
                summary: 'Unfiltered response',
                value: {
                    bookings: [
                        {
                            id: 'cmlqm576y00010w6tdja9fkuz',
                            space: {
                                id: 'cmlntv5ad00020w1cd485og40',
                                name: 'Noida darbar',
                                coverImage:
                                    'https://xouczrsenrzrjpskelxa.supabase.co/storage/v1/object/public/spaces/cmlnqt8rp00000wplhnx0zt1p/4764bf17-bc96-4681-bf5b-bc1159c3d155.jpg',
                            },
                            renter: {
                                fullName: 'Amit Patel',
                                email: 'newman.attendee4@gmail.com',
                            },
                            status: 'PENDING',
                            startTime: '2026-02-19T10:30:00.000Z',
                            endTime: '2026-02-19T23:30:00.000Z',
                            totalPrice: 1590.1599999999999,
                            note: 'De do na pls',
                            relativeTime: 'Just now',
                        },
                        {
                            id: 'test_booking_1',
                            space: {
                                id: 'cmlntv5ad00020w1cd485og40',
                                name: 'Noida darbar',
                                coverImage:
                                    'https://xouczrsenrzrjpskelxa.supabase.co/storage/v1/object/public/spaces/cmlnqt8rp00000wplhnx0zt1p/4764bf17-bc96-4681-bf5b-bc1159c3d155.jpg',
                            },
                            renter: {
                                fullName: 'Sneha Gupta',
                                email: 'newman.attendee5@gmail.com',
                            },
                            status: 'REJECTED',
                            startTime: '2026-02-17T10:41:35.677Z',
                            endTime: '2026-02-20T14:41:35.677Z',
                            totalPrice: 1000,
                            note: null,
                            relativeTime: '27h ago',
                        },
                        {
                            id: 'cmlnqynj8001a0wf2tbn2fsat',
                            space: {
                                id: 'cmlnqy6fi00040wf2u2v22oym',
                                name: 'Ram Ram Ji',
                                coverImage:
                                    'https://picsum.photos/800/600?random=0',
                            },
                            renter: {
                                fullName: 'Varun Kumar',
                                email: 'newman.host1@gmail.com',
                            },
                            status: 'PAID',
                            startTime: '2026-03-15T18:00:00.000Z',
                            endTime: '2026-03-15T22:00:00.000Z',
                            totalPrice: 1600,
                            note: null,
                            relativeTime: '48h ago',
                            eventId: 'cmlnqyo1g001c0wf2cl8xfxqo',
                        },
                    ],
                    meta: {
                        page: 1,
                        limit: 20,
                        total: 3,
                        totalPages: 1,
                    },
                },
            },
            FilteredRes: {
                summary: 'Filtered by space response',
                value: {
                    bookings: [
                        {
                            id: 'cmlqm576y00010w6tdja9fkuz',
                            space: {
                                id: 'cmlntv5ad00020w1cd485og40',
                                name: 'Noida darbar',
                                coverImage:
                                    'https://xouczrsenrzrjpskelxa.supabase.co/storage/v1/object/public/spaces/cmlnqt8rp00000wplhnx0zt1p/4764bf17-bc96-4681-bf5b-bc1159c3d155.jpg',
                            },
                            renter: {
                                fullName: 'Amit Patel',
                                email: 'newman.attendee4@gmail.com',
                            },
                            status: 'PENDING',
                            startTime: '2026-02-19T10:30:00.000Z',
                            endTime: '2026-02-19T23:30:00.000Z',
                            totalPrice: 1590.1599999999999,
                            note: 'De do na pls',
                            relativeTime: '1h ago',
                        },
                        {
                            id: 'test_booking_1',
                            space: {
                                id: 'cmlntv5ad00020w1cd485og40',
                                name: 'Noida darbar',
                                coverImage:
                                    'https://xouczrsenrzrjpskelxa.supabase.co/storage/v1/object/public/spaces/cmlnqt8rp00000wplhnx0zt1p/4764bf17-bc96-4681-bf5b-bc1159c3d155.jpg',
                            },
                            renter: {
                                fullName: 'Sneha Gupta',
                                email: 'newman.attendee5@gmail.com',
                            },
                            status: 'REJECTED',
                            startTime: '2026-02-17T10:41:35.677Z',
                            endTime: '2026-02-20T14:41:35.677Z',
                            totalPrice: 1000,
                            note: null,
                            relativeTime: '28h ago',
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
            EmptyResponse: {
                summary: 'Empty response if nothing found',
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
    @ApiForbiddenResponse({
        description: 'Not vendor',
        example: {
            statusCode: 403,
            timestamp: '2026-02-17T14:08:57.183Z',
            path: '/api/spaces/bookings/vendor?spaceId=cmlntv5ad00020w1cd485og40',
            message: {
                message: 'Only Vendors have access to access this endpoint',
                error: 'Forbidden',
                statusCode: 403,
            },
        },
    })
    @UseGuards(VendorProfileGuard)
    async getVendorBookings(
        @Query() query: VendorBookingsQueryDto,
        @GetUser() user: UserForTokenDto,
    ): Promise<VendorBookingsListDto> {
        return this.bookingsService.getVendorBookings(user.id, query);
    }

    @Patch(':bookingId/status')
    @ApiOperation({ summary: 'Approve/reject booking request' })
    @ApiParam({ name: 'bookingId', example: 'bk123' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: { status: { enum: ['APPROVED', 'REJECTED'] } },
        },
    })
    @ApiOkResponse({
        type: BookingStatusResponseDto,
        description: 'Success Responses of status update',
        examples: {
            OnApproval: {
                summary:
                    'Booking approved + rejected other bookings for the same slot',
                value: {
                    id: 'bktest-pending1',
                    status: 'APPROVED',
                    updatedAt: '2026-02-17T15:01:12.838Z',
                },
            },
            OnRejection: {
                summary: 'Booking rejected',
                value: {
                    id: 'bktest-reject',
                    status: 'REJECTED',
                    updatedAt: '2026-02-17T15:05:16.760Z',
                },
            },
        },
    })
    @ApiBadRequestResponse({
        description: 'Invalid booking status updates',
        examples: {
            CanOnlyUpdatePending: {
                summary: 'Invalid status',
                value: {
                    statusCode: 400,
                    timestamp: '2026-02-17T14:33:43.004Z',
                    path: '/api/spaces/bookings/cmlnqynj8001a0wf2tbn2fsat/status',
                    message: {
                        message: 'Can only update PENDING bookings',
                        error: 'Bad Request',
                        statusCode: 400,
                    },
                },
            },
            ExpiredBooking: {
                summary: 'Expired booking',
                value: {
                    statusCode: 400,
                    timestamp: '2026-02-17T14:37:24.239Z',
                    path: '/api/spaces/bookings/test_booking_1/status',
                    message: {
                        message: 'Booking has expired',
                        error: 'Bad Request',
                        statusCode: 400,
                    },
                },
            },
            InvalidStatus: {
                summary: 'Invalid status',
                value: {
                    statusCode: 400,
                    timestamp: '2026-02-17T15:06:46.887Z',
                    path: '/api/spaces/bookings/bktest-reject/status',
                    message: {
                        message: [
                            'Invalid status, must be APPROVED or REJECTED',
                        ],
                        error: 'Bad Request',
                        statusCode: 400,
                    },
                },
            },
        },
    })
    @ApiForbiddenResponse({
        description: 'Not booking owner',
        example: {
            statusCode: 403,
            timestamp: '2026-02-17T14:32:13.636Z',
            path: '/api/spaces/bookings/test_booking_2/status',
            message: {
                message: 'Not your booking',
                error: 'Forbidden',
                statusCode: 403,
            },
        },
    })
    @ApiNotFoundResponse({
        description: 'Booking not found',
        example: {
            statusCode: 404,
            timestamp: '2026-02-17T15:07:43.703Z',
            path: '/api/spaces/bookings/bktest-reject1212321/status',
            message: {
                message: 'Booking not found',
                error: 'Not Found',
                statusCode: 404,
            },
        },
    })
    @ApiConflictResponse({
        description: 'Overlap with approved booking',
        example: {
            statusCode: 409,
            timestamp: '2026-02-17T14:53:55.925Z',
            path: '/api/spaces/bookings/bktest-overlap2/status',
            message: {
                message: 'Cannot approve - overlaps with booking lap1',
                error: 'Conflict',
                statusCode: 409,
            },
        },
    })
    @UseGuards(VendorProfileGuard)
    async updateBookingStatus(
        @GetUser() user: UserForTokenDto,
        @Param('bookingId') bookingId: string,
        @Body() dto: UpdateBookingStatusDto,
    ): Promise<BookingStatusResponseDto> {
        this.logger.debug(`Updating status for booking: ${bookingId} with status: ${dto.status} and reason: ${dto.reason}`);
        return this.bookingsService.updateBookingStatus(
            bookingId,
            user.id,
            dto.status,
            dto.reason
        );
    }

    @Get('my')
    @ApiOperation({ summary: "User's space bookings" })
    @ApiQuery({
        name: 'type',
        enum: ['upcoming', 'history', 'all'],
        example: 'upcoming',
    })
    @ApiQuery({ name: 'status', enum: BookingStatus, required: false })
    @ApiQuery({ name: 'page', example: 1 })
    @ApiQuery({ name: 'limit', example: 20 })
    @ApiOkResponse({
        type: UserBookingsListDto,
        description: 'User bookings',
        examples: {
            FilteredResponse: {
                summary:
                    'Filtered response with: ?type=upcoming&status=PENDING&page=1&limit=10',
                value: {
                    bookings: [
                        {
                            id: 'bktest-overlap2',
                            space: {
                                id: 'cmlntv5ad00020w1cd485og40',
                                name: 'Noida darbar',
                                coverImage:
                                    'https://xouczrsenrzrjpskelxa.supabase.co/storage/v1/object/public/spaces/cmlnqt8rp00000wplhnx0zt1p/4764bf17-bc96-4681-bf5b-bc1159c3d155.jpg',
                            },
                            status: 'PENDING',
                            startTime: '2026-03-20T12:00:00.000Z',
                            endTime: '2026-03-20T15:00:00.000Z',
                            totalPrice: 750,
                            note: null,
                            relativeTime: 'Just now',
                        },
                    ],
                    meta: {
                        page: 1,
                        limit: 10,
                        total: 1,
                        totalPages: 1,
                    },
                },
            },
            UnfilteredResponse: {
                summary: 'Unfiltered response',
                value: {
                    bookings: [
                        {
                            id: 'bktest-reject',
                            space: {
                                id: 'cmlntv5ad00020w1cd485og40',
                                name: 'Noida darbar',
                                coverImage:
                                    'https://xouczrsenrzrjpskelxa.supabase.co/storage/v1/object/public/spaces/cmlnqt8rp00000wplhnx0zt1p/4764bf17-bc96-4681-bf5b-bc1159c3d155.jpg',
                            },
                            status: 'REJECTED',
                            startTime: '2026-03-30T10:00:00.000Z',
                            endTime: '2026-03-30T14:00:00.000Z',
                            totalPrice: 1000,
                            note: null,
                            relativeTime: 'Just now',
                        },
                        {
                            id: 'bktest-pending2',
                            space: {
                                id: 'cmlntv5ad00020w1cd485og40',
                                name: 'Noida darbar',
                                coverImage:
                                    'https://xouczrsenrzrjpskelxa.supabase.co/storage/v1/object/public/spaces/cmlnqt8rp00000wplhnx0zt1p/4764bf17-bc96-4681-bf5b-bc1159c3d155.jpg',
                            },
                            status: 'REJECTED',
                            startTime: '2026-03-25T11:00:00.000Z',
                            endTime: '2026-03-25T13:00:00.000Z',
                            totalPrice: 500,
                            note: null,
                            relativeTime: 'Just now',
                        },
                        {
                            id: 'bktest-pending3',
                            space: {
                                id: 'cmlntv5ad00020w1cd485og40',
                                name: 'Noida darbar',
                                coverImage:
                                    'https://xouczrsenrzrjpskelxa.supabase.co/storage/v1/object/public/spaces/cmlnqt8rp00000wplhnx0zt1p/4764bf17-bc96-4681-bf5b-bc1159c3d155.jpg',
                            },
                            status: 'REJECTED',
                            startTime: '2026-03-25T13:00:00.000Z',
                            endTime: '2026-03-25T16:00:00.000Z',
                            totalPrice: 750,
                            note: null,
                            relativeTime: 'Just now',
                        },
                        {
                            id: 'bktest-pending1',
                            space: {
                                id: 'cmlntv5ad00020w1cd485og40',
                                name: 'Noida darbar',
                                coverImage:
                                    'https://xouczrsenrzrjpskelxa.supabase.co/storage/v1/object/public/spaces/cmlnqt8rp00000wplhnx0zt1p/4764bf17-bc96-4681-bf5b-bc1159c3d155.jpg',
                            },
                            status: 'APPROVED',
                            startTime: '2026-03-25T10:00:00.000Z',
                            endTime: '2026-03-25T14:00:00.000Z',
                            totalPrice: 1000,
                            note: null,
                            relativeTime: 'Just now',
                        },
                        {
                            id: 'bktest-overlap1',
                            space: {
                                id: 'cmlntv5ad00020w1cd485og40',
                                name: 'Noida darbar',
                                coverImage:
                                    'https://xouczrsenrzrjpskelxa.supabase.co/storage/v1/object/public/spaces/cmlnqt8rp00000wplhnx0zt1p/4764bf17-bc96-4681-bf5b-bc1159c3d155.jpg',
                            },
                            status: 'APPROVED',
                            startTime: '2026-03-20T10:00:00.000Z',
                            endTime: '2026-03-20T14:00:00.000Z',
                            totalPrice: 1000,
                            note: null,
                            relativeTime: 'Just now',
                        },
                        {
                            id: 'bktest-overlap2',
                            space: {
                                id: 'cmlntv5ad00020w1cd485og40',
                                name: 'Noida darbar',
                                coverImage:
                                    'https://xouczrsenrzrjpskelxa.supabase.co/storage/v1/object/public/spaces/cmlnqt8rp00000wplhnx0zt1p/4764bf17-bc96-4681-bf5b-bc1159c3d155.jpg',
                            },
                            status: 'PENDING',
                            startTime: '2026-03-20T12:00:00.000Z',
                            endTime: '2026-03-20T15:00:00.000Z',
                            totalPrice: 750,
                            note: null,
                            relativeTime: 'Just now',
                        },
                        {
                            id: 'cmlnqynj8001a0wf2tbn2fsat',
                            space: {
                                id: 'cmlnqy6fi00040wf2u2v22oym',
                                name: 'Ram Ram Ji',
                                coverImage:
                                    'https://picsum.photos/800/600?random=0',
                            },
                            status: 'PAID',
                            startTime: '2026-03-15T18:00:00.000Z',
                            endTime: '2026-03-15T22:00:00.000Z',
                            totalPrice: 1600,
                            note: null,
                            relativeTime: '50h ago',
                            eventTitle: 'FULL TEST EVENT',
                        },
                    ],
                    meta: {
                        page: 1,
                        limit: 20,
                        total: 7,
                        totalPages: 1,
                    },
                },
            },
        },
    })
    @ApiForbiddenResponse({
        description: 'Only Attendees and Hosts can view their bookings',
        example: {
            statusCode: 403,
            timestamp: '2026-02-17T15:42:32.654Z',
            path: '/api/spaces/bookings/my?type=upcoming',
            message: {
                message: 'Only Attendees and Hosts can view their bookings',
                error: 'Forbidden',
                statusCode: 403,
            },
        },
    })
    async getMyBookings(
        @Query() query: UserBookingsQueryDto,
        @GetUser() user: UserForTokenDto,
    ): Promise<UserBookingsListDto> {
        if (
            user.userType === UserType.VENDOR ||
            user.userType === UserType.ADMIN
        ) {
            throw new ForbiddenException(
                'Only Attendees and Hosts can view their bookings',
            );
        }
        this.logger.debug('My bookings for user: ', user.id);
        return this.bookingsService.getUserBookings(user.id, query);
    }

    @Patch(':bookingId/cancel')
    @ApiOperation({ summary: 'Cancel user booking request' })
    @ApiParam({ name: 'bookingId', example: 'bk123' })
    @ApiOkResponse({
        description: 'Booking cancelled',
        examples: {
            CancelledReq: {
                summary: 'Cancelled request',
                value: {
                    id: 'bktest-pending-cancel',
                    status: 'CANCELLED',
                },
            },
            CancelledBefore24h: {
                summary: 'Cancelled before 24h',
                value: {
                    id: 'bktest-approved-cancel-ok',
                    status: 'CANCELLED',
                },
            },
        },
    })
    @ApiBadRequestResponse({
        description: 'Cannot cancel this booking',
        examples: {
            BookingAlreadyCancelled: {
                summary: 'Cannot cancel this CANCELLED booking',
                value: {
                    statusCode: 400,
                    timestamp: '2026-02-17T16:00:13.829Z',
                    path: '/api/spaces/bookings/bktest-pending-cancel/cancel',
                    message: {
                        message: 'Booking already cancelled/expired',
                        error: 'Bad Request',
                        statusCode: 400,
                    },
                },
            },
            BookingAlreadyExpired: {
                summary: 'Cannot cancel this EXPIRED booking',
                value: {
                    statusCode: 400,
                    timestamp: '2026-02-17T16:00:13.829Z',
                    path: '/api/spaces/bookings/bktest-pending-cancel/cancel',
                    message: {
                        message: 'Booking already cancelled/expired',
                        error: 'Bad Request',
                        statusCode: 400,
                    },
                },
            },
            CannotCancelWithin24h: {
                summary: 'Cannot cancel within 24h of start time',
                value: {
                    statusCode: 400,
                    timestamp: '2026-02-17T16:06:03.944Z',
                    path: '/api/spaces/bookings/bktest-approved-cancel-not-ok/cancel',
                    message: {
                        message: 'Cannot cancel within 24h of start time',
                        error: 'Bad Request',
                        statusCode: 400,
                    },
                },
            },
        },
    })
    @ApiForbiddenResponse({
        description: 'Not your booking',
        examples: {
            NotBookingOwner: {
                summary: 'Not your booking',
                value: {
                    statusCode: 403,
                    timestamp: '2026-02-17T16:08:56.897Z',
                    path: '/api/spaces/bookings/bktest-notowner/cancel',
                    message: {
                        message: 'Not your booking',
                        error: 'Forbidden',
                        statusCode: 403,
                    },
                },
            },
            WrongUser: {
                summary: 'Only Attendees and Hosts can access this route!',
                value: {
                    statusCode: 403,
                    timestamp: '2026-02-17T16:21:27.891Z',
                    path: '/api/spaces/bookings/bktest-paid-cancel-ok/cancel',
                    message: {
                        message:
                            'Only Attendees and Hosts can access this route!',
                        error: 'Forbidden',
                        statusCode: 403,
                    },
                },
            },
        },
    })
    @ApiNotFoundResponse({
        description: 'Booking not found',
        example: {
            statusCode: 404,
            timestamp: '2026-02-17T16:03:05.153Z',
            path: '/api/spaces/bookings/bktest-approved-cancel-ok/cancel',
            message: {
                message: 'Booking not found',
                error: 'Not Found',
                statusCode: 404,
            },
        },
    })
    @UseGuards(JwtAuthGuard)
    async cancelBooking(
        @Param('bookingId') bookingId: string,
        @GetUser() user: UserForTokenDto,
    ): Promise<{ id: string; status: string }> {
        if (
            user.userType === UserType.VENDOR ||
            user.userType === UserType.ADMIN
        ) {
            throw new ForbiddenException(
                'Only Attendees and Hosts can access this route!',
            );
        }
        await this.bookingsService.cancelBooking(bookingId, user.id);
        return { id: bookingId, status: 'CANCELLED' };
    }
}
