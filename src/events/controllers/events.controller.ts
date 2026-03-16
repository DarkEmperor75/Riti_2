import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Logger,
    Param,
    Patch,
    Post,
    Put,
    Query,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { EventsService } from '../services';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import {
    AdminProfileGuard,
    AttendeeProfileGuard,
    HostProfileGuard,
} from 'src/users/guards';
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiConsumes,
    ApiCreatedResponse,
    ApiExtraModels,
    ApiNonAuthoritativeInformationResponse,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiOperation,
    ApiParam,
    ApiProperty,
    ApiQuery,
    ApiTags,
    ApiUnauthorizedResponse,
    getSchemaPath,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { GetUser, Public } from 'src/auth/decorators';
import { type UserForTokenDto } from 'src/auth/interfaces';
import {
    CreateEventDto,
    EventPreviewResponseDto,
    HostEventAttendeesResponseDto,
    HostEventResponseDto,
    HostEventStatsDto,
    PublicEventResponseDto,
    UpdateEventDto,
} from '../dto';
import { Paginated } from 'src/common/types';
import { EventCategory } from '@prisma/client';
import { EventResponse, PublicEventsList } from '../types';
import { SuspentionGuard } from 'src/auth/guards/suspended.guard';
import { EventCronService } from '../services/event.cron.service';

@ApiTags('Events')
@ApiBearerAuth('access-token')
@Controller('events')
@UseGuards(JwtAuthGuard, SuspentionGuard)
export class EventsController {
    private readonly logger = new Logger(EventsController.name);
    constructor(
        private readonly eventsService: EventsService,
        private readonly eventsCronService: EventCronService,
    ) {}

    @ApiExtraModels(EventPreviewResponseDto)
    @Get()
    @Public()
    @ApiNonAuthoritativeInformationResponse({
        description:
            'Returns a paginated list of published events with filters for date, price, category, and city.',
        schema: {
            properties: {
                items: {
                    type: 'array',
                    items: { $ref: getSchemaPath(EventPreviewResponseDto) },
                },
                page: { type: 'number' },
                limit: { type: 'number' },
                total: { type: 'number' },
            },
        },
    })
    @ApiOperation({
        summary: 'List published events for discovery',
        description:
            'Returns a paginated list of published events with filters for date, price, category, and city.',
    })
    @ApiQuery({ name: 'page', required: false, example: 1 })
    @ApiQuery({ name: 'limit', required: false, example: 10 })
    @ApiQuery({
        name: 'date_from',
        required: false,
        example: '2026-03-01T00:00:00Z',
    })
    @ApiQuery({
        name: 'date_to',
        required: false,
        example: '2026-03-31T23:59:59Z',
    })
    @ApiQuery({ name: 'price_min', required: false, example: '0' })
    @ApiQuery({ name: 'price_max', required: false, example: '500' })
    @ApiQuery({
        name: 'category',
        required: false,
        enum: EventCategory,
        examples: {
            ArtValue: { value: EventCategory.ART },
            MusicValue: { value: EventCategory.MUSIC },
            BusinessValue: { value: EventCategory.BUSINESS },
            FoodValue: { value: EventCategory.FOOD },
            WorkshopValue: { value: EventCategory.WORKSHOP },
            OtherValue: { value: EventCategory.OTHER },
        },
    })
    @ApiQuery({ name: 'city', required: false, example: 'Oslo' })
    @ApiOkResponse({
        description: 'Paginated list of published events.',
        schema: {
            properties: {
                items: {
                    type: 'array',
                    items: { $ref: getSchemaPath(EventPreviewResponseDto) },
                },
                meta: {
                    type: 'object',
                    properties: {
                        page: { type: 'number' },
                        limit: { type: 'number' },
                        totalItems: { type: 'number' },
                        totalPages: { type: 'number' },
                    },
                },
            },
        },
    })
    async listPublicEvents(
        @Query('page') page = 1,
        @Query('limit') limit = 10,
        @Query('date_from') date_from?: string,
        @Query('date_to') date_to?: string,
        @Query('price_min') price_min?: string,
        @Query('price_max') price_max?: string,
        @Query('category') category?: EventCategory,
        @Query('city') city?: string,
    ): Promise<PublicEventsList> {
        return this.eventsService.getPublicEvents(Number(page), Number(limit), {
            date_from,
            date_to,
            price_min,
            price_max,
            category,
            city,
        });
    }

    @Post()
    @UseGuards(HostProfileGuard)
    @HttpCode(HttpStatus.CREATED)
    @UseInterceptors(FileInterceptor('coverImg'))
    @ApiOperation({
        summary: 'Create a new draft event',
        description:
            'Creates a new event in DRAFT status. Hosts can upload a cover image, set details, and link a booked space (if applicable). Returns validation status for publishing readiness.',
    })
    @ApiConsumes('multipart/form-data')
    @ApiCreatedResponse({
        description: 'The event has been successfully created in DRAFT status.',
        schema: {
            example: {
                success: true,
                data: {
                    event: {
                        id: 'evt_01HXYZ9KQ2ABCD1234',
                        title: 'My event',
                        description: 'A Concert for Iron madien',
                        category: 'MUSIC',
                        status: 'DRAFT',
                        eventType: 'FREE',
                        capacity: 5000,
                        bookingId: '4234324',
                        startTime: '2026-10-29T10:30:00.000Z',
                        endTime: '2026-10-30T10:30:00.000Z',
                        coverImg: 'https://example.com/cover.jpg',
                        hostId: 'cmkzwivmb00000w7wue900lgzt',
                        createdAt: '2026-02-10T16:10:00.677Z',
                        updatedAt: '2026-02-10T16:10:00.677Z',
                    },
                    publishValidation: {
                        isPublishable: false,
                        missingFields: [],
                        warnings: [
                            'Warning: Event "Orca March" starts at the same time.',
                        ],
                    },
                },
            },
        },
    })
    @ApiBadRequestResponse({
        description:
            'Validation failed (e.g., invalid booking ID, missing title).',
        schema: {
            example: {
                statusCode: 400,
                timestamp: '2026-02-10T15:24:22.419Z',
                path: '/api/events',
                message: {
                    message: ['Date input is invalid', 'Date input is invalid'],
                    error: 'Bad Request',
                    statusCode: 400,
                },
            },
        },
    })
    @ApiUnauthorizedResponse({
        description: 'User is not logged in or not a valid Host.',
        example: {
            statusCode: 401,
            timestamp: '2026-02-10T16:10:00.677Z',
            path: '/api/events',
            message: {
                message: 'Unauthorized',
                statusCode: 401,
            },
        },
    })
    async createEvent(
        @GetUser() user: UserForTokenDto,
        @Body() dto: CreateEventDto,
        @UploadedFile() coverImg?: Express.Multer.File,
    ): Promise<EventResponse> {
        this.logger.debug('Creating event for user: ', user.id);

        if (coverImg) {
            dto.coverImg = coverImg;
        }

        return this.eventsService.createEvent(user.id, dto);
    }

    @Post('trigger-manual-event-reminders')
    @ApiProperty({
        description:
            'Trigger manual event reminders for attendees before 24 hours of events',
    })
    @HttpCode(HttpStatus.OK)
    @UseGuards(AdminProfileGuard)
    async triggerManualEventReminders() {
        return this.eventsCronService.triggerSendEventReminders();
    }

    @Get('host')
    @UseGuards(HostProfileGuard)
    @ApiOperation({
        summary: 'List events created by the current host',
        description:
            'Returns a paginated list of events created by the authenticated host.',
    })
    @ApiQuery({ name: 'page', required: false, example: 1 })
    @ApiQuery({ name: 'limit', required: false, example: 10 })
    @ApiOkResponse({
        description: 'Paginated list of host events.',
        schema: {
            properties: {
                items: {
                    type: 'array',
                    items: { $ref: getSchemaPath(EventPreviewResponseDto) },
                },
                meta: {
                    type: 'object',
                    properties: {
                        page: { type: 'number' },
                        limit: { type: 'number' },
                        totalItems: { type: 'number' },
                        totalPages: { type: 'number' },
                    },
                },
            },
        },
    })
    async getMyEvents(
        @GetUser() user: UserForTokenDto,
        @Query('page') page = 1,
        @Query('limit') limit = 10,
        @Query('sortBy') sortBy = 'asc',
    ): Promise<Paginated<EventPreviewResponseDto>> {
        this.logger.debug('Getting host events for user: ', user.id);
        if (sortBy !== 'asc' && sortBy !== 'desc') {
            throw new BadRequestException('sortBy must be "asc" or "desc"');
        }
        return this.eventsService.getHostEvents(
            user.id,
            Number(page),
            Number(limit),
            sortBy as 'asc' | 'desc',
        );
    }

    @Get('host/:eventId')
    @UseGuards(HostProfileGuard)
    @ApiOperation({
        summary: 'Get detailed info for a host-owned event',
        description:
            'Returns full event details for the host, including tickets and attendees.',
    })
    @ApiParam({ name: 'eventId', example: 'evt_ckz12345' })
    @ApiOkResponse({
        type: HostEventResponseDto,
        description: 'Event details.',
        example: {
            id: 'cmlgsgtyx00010wzky7j69cho',
            title: 'Token Man',
            eventDate: '2026-10-29T10:30:00.000Z',
            capacityUsed: '0/100',
            eventStaus: 'DRAFT',
            coverImg:
                'https://xouczrsenrzrjpskelxa.supabase.co/storage/v1/object/public/events/cmkzwivmb00000w7we900lgzt/7a64b671-b5be-4962-b629-067df14e8886.png',
            category: 'BUSINESS',
            eventType: 'FREE',
            description: 'We are Charlie Kirk goated sigma',
            startTime: '2026-10-29T10:30:00.000Z',
            endTime: '2026-10-30T10:30:00.000Z',
            location: 'Oslo',
            address: 'Karl Johans gate 1',
            price: '0',
            capacity: 100,
            payoutStatus: 'UNINITIATED',
            tickets: [],
            attendees: [],
        },
    })
    @ApiNotFoundResponse({
        description: 'Event not found.',
        example: {
            statusCode: 404,
            timestamp: '2026-02-11T13:49:50.695Z',
            path: '/api/events/host/cmlgsgtyx00010wzky7j69cho4',
            message: {
                message: 'Event not found',
                error: 'Not Found',
                statusCode: 404,
            },
        },
    })
    @ApiUnauthorizedResponse({
        description: 'User is not a host.',
        example: {
            statusCode: 401,
            timestamp: '2026-02-11T13:48:00.553Z',
            path: '/api/events/host/cmlgsgtyx00010wzky7j69cho',
            message: {
                message: 'Unauthorized',
                statusCode: 401,
            },
        },
    })
    async getHostEventById(
        @GetUser() user: UserForTokenDto,
        @Param('eventId') eventId: string,
    ): Promise<HostEventResponseDto> {
        return this.eventsService.getHostEventById(user.id, eventId);
    }

    @Get('attendees/:hostId')
    @ApiParam({ name: 'hostId', example: 'evt_ckz12345' })
    @ApiOperation({
        summary: 'List events created by host id',
        description:
            'Returns a paginated list of events created by the authenticated host.',
    })
    @ApiQuery({ name: 'page', required: false, example: 1 })
    @ApiQuery({ name: 'limit', required: false, example: 10 })
    @ApiOkResponse({
        description: 'Paginated list of host events.',
        schema: {
            properties: {
                items: {
                    type: 'array',
                    items: { $ref: getSchemaPath(EventPreviewResponseDto) },
                },
                meta: {
                    type: 'object',
                    properties: {
                        page: { type: 'number' },
                        limit: { type: 'number' },
                        totalItems: { type: 'number' },
                        totalPages: { type: 'number' },
                    },
                },
            },
        },
    })
    async getHostEvents(
        @GetUser() user: UserForTokenDto,
        @Param('hostId') hostId: string,
        @Query('page') page = 1,
        @Query('limit') limit = 10,
        @Query('sortBy') sortBy = 'asc',
    ): Promise<Paginated<EventPreviewResponseDto>> {
        this.logger.debug(`Get host events for user: ${user.id}, for host ${hostId}`);
        if(!hostId || hostId === '' || hostId === null || hostId === ':hostId') throw new BadRequestException('Host ID is required');
        if (sortBy !== 'asc' && sortBy !== 'desc') {
            throw new BadRequestException('sortBy must be "asc" or "desc"');
        }
        return this.eventsService.getHostEventsForAttendees(
            user.id,
            hostId,
            Number(page),
            Number(limit),
            sortBy as 'asc' | 'desc',
        );
    }

    @Patch(':eventId/publish')
    @UseGuards(HostProfileGuard)
    @ApiOperation({
        summary: 'Publish an event',
        description:
            'Validates and publishes a DRAFT event (DRAFT → PUBLISHED).',
    })
    @ApiParam({ name: 'eventId', example: 'evt_ckz12345' })
    @ApiOkResponse({
        description: 'Event published successfully.',
        type: PublicEventResponseDto,
        example: {
            success: true,
            data: {
                event: {
                    id: 'cmlgsgtyx00010wzky7j69cho',
                    status: 'PUBLISHED',
                    title: 'Token Man',
                    description: 'We are Charlie Kirk goated sigma',
                    category: 'BUSINESS',
                    eventType: 'FREE',
                    startTime: '2026-10-29T10:30:00.000Z',
                    endTime: '2026-10-30T10:30:00.000Z',
                    bookingId: 'cmlfuia2b00090w41j1fvji1m',
                    coverImg:
                        'https://xouczrsenrzrjpskelxa.supabase.co/storage/v1/object/public/events/cmkzwivmb00000w7we900lgzt/7a64b671-b5be-4962-b629-067df14e8886.png',
                },
                canPublish: true,
                missingForPublish: [],
            },
            meta: {
                eventId: 'cmlgsgtyx00010wzky7j69cho',
                hostId: 'cml9x9se600000wuwkghgiw80',
            },
        },
    })
    @ApiBadRequestResponse({
        description: 'Event not publishable or invalid state.',
        example: {
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Event is already published',
            },
        },
    })
    @ApiNotFoundResponse({
        description: 'Event not found.',
        example: {
            success: false,
            error: {
                code: 'EVENT_NOT_FOUND',
                message: 'Event not found',
            },
        },
    })
    async publishEvent(
        @GetUser() user: UserForTokenDto,
        @Param('eventId') eventId: string,
    ): Promise<EventResponse> {
        return this.eventsService.publishEvent(user.id, eventId);
    }

    @Patch(':eventId/cancel')
    @UseGuards(HostProfileGuard)
    @ApiOperation({
        summary: 'Cancel an event',
        description: 'Cancels a PUBLISHED event (PUBLISHED → CANCELLED).',
    })
    @ApiParam({ name: 'eventId', example: 'evt_ckz12345' })
    @ApiOkResponse({
        description: 'Event cancelled successfully.',
        example: {
            success: true,
            data: {
                event: {
                    id: 'cmlgsgtyx00010wzky7j69cho',
                    status: 'CANCELLED',
                    title: 'Token Man',
                    description: 'We are Charlie Kirk goated sigma',
                    category: 'BUSINESS',
                    eventType: 'FREE',
                    startTime: '2026-10-29T10:30:00.000Z',
                    endTime: '2026-10-30T10:30:00.000Z',
                    bookingId: 'cmlfuia2b00090w41j1fvji1m',
                    coverImg:
                        'https://xouczrsenrzrjpskelxa.supabase.co/storage/v1/object/public/events/cmkzwivmb00000w7we900lgzt/7a64b671-b5be-4962-b629-067df14e8886.png',
                },
                canPublish: true,
                missingForPublish: [],
            },
            meta: {
                eventId: 'cmlgsgtyx00010wzky7j69cho',
                hostId: 'cml9x9se600000wuwkghgiw80',
            },
        },
    })
    @ApiBadRequestResponse({
        description: 'Event not cancellable (wrong state).',
        example: {
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Cannot cancel events that are not published!',
            },
        },
    })
    @ApiNotFoundResponse({ description: 'Event not found.' })
    async cancelEvent(
        @GetUser() user: UserForTokenDto,
        @Param('eventId') eventId: string,
    ): Promise<EventResponse> {
        return this.eventsService.cancelEvent(user.id, eventId);
    }

    @Delete(':eventId')
    @UseGuards(HostProfileGuard)
    @ApiOperation({
        summary: 'Delete an event',
        description:
            'Hard delete of an event, only allowed if status is DRAFT.',
    })
    @ApiParam({ name: 'eventId', example: 'evt_ckz12345' })
    @ApiOkResponse({
        description: 'Event deleted successfully.',
        example: {
            success: true,
            data: {
                event: {
                    id: 'cmli667cy00010wqhvvqepbw6',
                    status: 'DRAFT',
                    title: 'Love the Lassan Event',
                    description: 'We are Charlie Kirk goated sigma',
                    category: 'MUSIC',
                    eventType: 'FREE',
                    startTime: '2026-10-29T10:30:00.000Z',
                    endTime: '2026-10-30T10:30:00.000Z',
                    bookingId: 'cmlfuia2b00090w41j1fvji1m',
                },
                canPublish: false,
                missingForPublish: ['coverImg'],
            },
            meta: {
                eventId: 'cmli667cy00010wqhvvqepbw6',
                hostId: 'cml9x9se600000wuwkghgiw80',
            },
        },
    })
    @ApiBadRequestResponse({
        description: 'Event not deletable (must be DRAFT).',
        example: {
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Cannot delete events that are not draft!',
            },
        },
    })
    @ApiNotFoundResponse({ description: 'Event not found.' })
    async deleteEvent(
        @GetUser() user: UserForTokenDto,
        @Param('eventId') eventId: string,
    ): Promise<EventResponse> {
        return this.eventsService.deleteEvent(user.id, eventId);
    }

    @Put(':eventId')
    @UseGuards(HostProfileGuard)
    @HttpCode(HttpStatus.OK)
    @UseInterceptors(FileInterceptor('coverImg'))
    @ApiOperation({
        summary: 'Update an existing event',
        description:
            'Updates event details. Only allowed for DRAFT or PUBLISHED events. Published events have restrictions: cannot change capacity or start time. Returns updated event with publish readiness status.',
    })
    @ApiConsumes('multipart/form-data')
    @ApiParam({
        name: 'eventId',
        description: 'The unique identifier of the event to update',
        example: 'evt_ckz12345',
        type: String,
    })
    @ApiOkResponse({
        description: 'The event has been successfully updated.',
        schema: {
            example: {
                success: true,
                data: {
                    event: {
                        id: 'cmlgsgtyx00010wzky7j69cho',
                        status: 'DRAFT',
                        title: 'Token Man',
                        description: 'We are Charlie Kirk goated sigma',
                        category: 'MUSIC',
                        eventType: 'FREE',
                        startTime: '2026-10-29T10:30:00.000Z',
                        endTime: '2026-10-30T10:30:00.000Z',
                        bookingId: 'cmlfuia2b00090w41j1fvji1m',
                        coverImg:
                            'https://xouczrsenrzrjpskelxa.supabase.co/storage/v1/object/public/events/cmkzwivmb00000w7we900lgzt/7a64b671-b5be-4962-b629-067df14e8886.png',
                    },
                    canPublish: true,
                    missingForPublish: [],
                },
                meta: {
                    eventId: 'cmlgsgtyx00010wzky7j69cho',
                    hostId: 'cml9x9se600000wuwkghgiw80',
                },
            },
        },
    })
    @ApiBadRequestResponse({
        description:
            'Validation failed. Common errors: trying to change capacity/start time on published event, event times outside booking window, booking already in use.',
        schema: {
            examples: {
                invalidInput: {
                    value: {
                        statusCode: 400,
                        timestamp: '2026-02-10T21:03:08.134Z',
                        path: '/api/events/cmlgsgtyx00010wzky7j69cho',
                        message: {
                            message: [
                                'category must be one of the following values: MUSIC, WORKSHOP, BUSINESS, FOOD, ART, OTHER',
                            ],
                            error: 'Bad Request',
                            statusCode: 400,
                        },
                    },
                },
                capacityLocked: {
                    value: {
                        success: false,
                        error: {
                            code: 'VALIDATION_ERROR',
                            message:
                                'Cannot change capacity when event is already published',
                        },
                    },
                },
                bookingConflict: {
                    value: {
                        success: false,
                        error: {
                            code: 'VALIDATION_ERROR',
                            message:
                                'This Booking Is Already In Use by another event!',
                        },
                    },
                },
                timeOutsideBooking: {
                    value: {
                        success: false,
                        error: {
                            code: 'EVENT_TIME_OUTSIDE_BOOKING',
                            message: 'Event times must be within booking times',
                        },
                    },
                },
            },
        },
    })
    @ApiNotFoundResponse({
        description: 'Event not found or does not belong to this host.',
        schema: {
            example: {
                success: false,
                error: {
                    code: 'BOOKING_NOT_FOUND',
                    message: 'Booking with ID 4234324 not found',
                },
            },
        },
    })
    @ApiUnauthorizedResponse({
        description: 'User is not logged in or does not have a Host profile.',
    })
    async updateEvent(
        @GetUser() user: UserForTokenDto,
        @Param('eventId') eventId: string,
        @Body() dto: UpdateEventDto,
        @UploadedFile() coverImg?: Express.Multer.File,
    ) {
        if (coverImg) {
            dto.coverImg = coverImg;
        }
        return this.eventsService.updateEvent(user.id, dto, eventId);
    }

    @Get(':eventId')
    @Public()
    @ApiOperation({
        summary: 'Get public event details',
        description:
            'Returns a single published event with full details for attendees.',
    })
    @ApiParam({ name: 'eventId', example: 'evt_ckz12345' })
    @ApiOkResponse({
        type: PublicEventResponseDto,
        description: 'Get event',
        example: {
            id: 'cmlfuu44i000r0wos841ekxia',
            title: 'Oslo Tech Mixer #5',
            eventDate: '2026-03-15T18:00:00.000Z',
            capacityUsed: '0/50',
            eventStaus: 'PUBLISHED',
            coverImg:
                'https://images.unsplash.com/photo-1540575467063-178a50c2df87',
            category: 'MUSIC',
            eventType: 'FREE',
            description: 'Tech networking event edition 5.',
            startTime: '2026-03-15T18:00:00.000Z',
            endTime: '2026-03-15T22:00:00.000Z',
            location: 'Pune',
            address: 'Karl Johans gate 1',
            price: '0',
            capacity: 50,
        },
    })
    @ApiNotFoundResponse({
        description: 'Event not found or not published.',
        example: {
            statusCode: 404,
            timestamp: '2026-02-11T15:19:50.581Z',
            path: '/api/events/cmlfuu44i000r0wos841ekxiaS',
            message: {
                message: 'Event not found',
                error: 'Not Found',
                statusCode: 404,
            },
        },
    })
    async getEventById(
        @Param('eventId') eventId: string,
    ): Promise<PublicEventResponseDto> {
        this.logger.debug('Get public event by id: ', eventId);
        return await this.eventsService.getPublicEventById(eventId);
    }

    @Get(':eventId/attendees')
    @UseGuards(HostProfileGuard)
    @ApiOperation({ summary: 'Event attendees' })
    @ApiParam({ name: 'eventId', example: 'evt_ckz12345' })
    @ApiOkResponse({
        description: 'Event attendees',
        type: HostEventAttendeesResponseDto,
        example: {
            items: [
                {
                    ticketId: 'cmlkzivfr001a0w10ox1rbwmi',
                    attendeeId: 'cmlkzir4n000w0w10f5astxlf',
                    attendeeName: 'Sneha Gupta',
                    attendeeEmail: 'newman.attendee5@gmail.com',
                    ticketType: 'REGULAR',
                    status: 'PURCHASED',
                    pricePaid: 0,
                    purchasedAt: '2026-02-13T10:30:29.799Z',
                },
                {
                    ticketId: 'cmlkzityo00140w10qv2q5bfv',
                    attendeeId: 'cmlkzilvb000n0w10dt5b3279',
                    attendeeName: 'Anurodh Kumar',
                    attendeeEmail: 'newman.attendee2@gmail.com',
                    ticketType: 'STUDENT',
                    status: 'PURCHASED',
                    pricePaid: 0,
                    purchasedAt: '2026-02-13T13:30:27.887Z',
                },
                {
                    ticketId: 'cmlkzith100120w10pe0hj6xn',
                    attendeeId: 'cmlkzik0k000k0w10evq7u90t',
                    attendeeName: 'Shashwat Raghuvanshi',
                    attendeeEmail: 'newman.attendee1@gmail.com',
                    ticketType: 'REGULAR',
                    status: 'PURCHASED',
                    pricePaid: 0,
                    purchasedAt: '2026-02-13T14:30:27.252Z',
                },
            ],
            totalSold: 3,
            totalRevenue: 0,
        },
    })
    @ApiNotFoundResponse({
        description: 'Event not found or not published.',
        example: {
            statusCode: 404,
            timestamp: '2026-02-13T15:36:22.117Z',
            path: '/api/events/cmlkzisze00100w10nrqgpya8a/attendees',
            message: {
                message: 'Event not found',
                error: 'Not Found',
                statusCode: 404,
            },
        },
    })
    async attendees(
        @Param('eventId') eventId: string,
        @GetUser() user: UserForTokenDto,
    ): Promise<HostEventAttendeesResponseDto> {
        return this.eventsService.getEventAttendees(user.id, eventId);
    }

    @Get(':eventId/stats')
    @ApiOperation({ summary: 'Event ticket stats' })
    @ApiParam({ name: 'eventId', example: 'evt_ckz12345' })
    @ApiOkResponse({
        description: 'Event ticket stats',
        type: HostEventStatsDto,
        example: {
            totalSold: 3,
            regularSold: 2,
            studentSold: 1,
            totalCancelled: 1,
            totalRevenue: 198.01999999999998,
            capacity: 8,
            isSoldOut: false,
        },
    })
    async stats(
        @Param('eventId') eventId: string,
        @GetUser() user: UserForTokenDto,
    ): Promise<HostEventStatsDto> {
        return this.eventsService.getEventStats(user.id, eventId);
    }
}
