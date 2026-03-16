import {
    Body,
    Controller,
    Get,
    Post,
    UseGuards,
    Query,
    Param,
    Patch,
    Logger,
    HttpStatus,
    HttpCode,
} from '@nestjs/common';
import { TicketsService } from '../services';
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiCreatedResponse,
    ApiInternalServerErrorResponse,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiOperation,
    ApiParam,
    ApiQuery,
    ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { GetUser } from 'src/auth/decorators';
import { FreeTicketRes, PaidTicketRes, PurchaseTicketDto, TicketResponseDto } from '../dto';
import { TicketStatus } from '@prisma/client';
import { AttendeeProfileGuard } from 'src/users/guards';
import { Paginated } from 'src/common/types';
import { type UserForTokenDto } from 'src/auth/interfaces';
import { SuspentionGuard } from 'src/auth/guards/suspended.guard';

@ApiTags('Tickets')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, SuspentionGuard)
@Controller('tickets')
export class TicketsController {
    private readonly logger = new Logger(TicketsController.name);
    constructor(private ticketsService: TicketsService) {}

    @UseGuards(AttendeeProfileGuard)
    @Post('purchase')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Purchase ticket' })
    @ApiCreatedResponse({
        type: TicketResponseDto,
        example: {
            id: 'cmll4mu3r00010wqdmxbn58zg',
            attendeeId: 'cmll4c2m400040w8w34hzxak8',
            eventId: 'cmll24e8300100w4kv8pybghx',
            ticketType: 'STUDENT',
            status: 'PURCHASED',
            pricePaid: 84.096,
            isRefunded: false,
            cancelledAt: null,
        },
    })
    @ApiBadRequestResponse({
        description: 'Invalid request',
        examples: {
            SoldOutEvent: {
                summary: 'Event sold out',
                value: {
                    statusCode: 400,
                    timestamp: '2026-02-13T16:54:29.358Z',
                    path: '/api/tickets/purchase',
                    message: {
                        message: 'Event sold out!',
                        error: 'Bad Request',
                        statusCode: 400,
                    },
                },
            },
            UserAlreadyHasTickets: {
                summary: 'User already has a ticket',
                value: {
                    statusCode: 400,
                    timestamp: '2026-02-13T17:01:57.887Z',
                    path: '/api/tickets/purchase',
                    message: {
                        message: 'User already has a ticket',
                        error: 'Bad Request',
                        statusCode: 400,
                    },
                },
            },
        },
    })
    @ApiInternalServerErrorResponse({
        description: 'Internal server error',
        example: {
            statusCode: 500,
            timestamp: '2026-02-13T16:47:38.292Z',
            path: '/api/tickets/purchase',
            message: 'Internal server error',
        },
    })
    async purchase(
        @GetUser() user: UserForTokenDto,
        @Body() dto: PurchaseTicketDto,
    ): Promise<FreeTicketRes | PaidTicketRes> {
        return this.ticketsService.purchaseTicket(user.id, dto);
    }

    @UseGuards(AttendeeProfileGuard)
    @Get()
    @ApiOperation({ summary: 'My tickets' })
    @ApiQuery({
        name: 'page',
        type: 'number',
        required: false,
        description: 'Page number',
    })
    @ApiQuery({
        name: 'limit',
        type: 'number',
        required: false,
        description: 'Number of items per page',
    })
    @ApiQuery({
        name: 'status',
        type: 'string',
        enum: TicketStatus,
        required: false,
        description: 'Filter by status',
    })
    @ApiOkResponse({
        description: 'Returns paginated list of tickets',
        example: {
            items: [
                {
                    id: 'cmll24iom001g0w4kj8qzfbze',
                    attendeeId: 'cmll2441k000k0w4kdoav3h48',
                    eventId: 'cmll24i55001e0w4ktoqsajc4',
                    ticketType: 'STUDENT',
                    status: 'PURCHASED',
                    pricePaid: 101.29,
                    attendeeStripePaymentId: null,
                    isRefunded: false,
                    cancelledAt: null,
                },
                {
                    id: 'cmll24err00120w4kh7ugc619',
                    attendeeId: 'cmll2441k000k0w4kdoav3h48',
                    eventId: 'cmll24e8300100w4kv8pybghx',
                    ticketType: 'REGULAR',
                    status: 'PURCHASED',
                    pricePaid: 97.26,
                    attendeeStripePaymentId: null,
                    isRefunded: false,
                    cancelledAt: null,
                },
            ],
            meta: {
                page: 1,
                limit: 20,
                totalItems: 2,
                totalPages: 1,
            },
        },
    })
    async myTickets(
        @GetUser() user: UserForTokenDto,
        @Query('page') page = 1,
        @Query('limit') limit = 20,
        @Query('status') status?: TicketStatus,
    ): Promise<Paginated<TicketResponseDto>> {
        this.logger.debug('My tickets for user: ', user.id);
        return this.ticketsService.myTickets(user.id, { page, limit, status });
    }

    @UseGuards(AttendeeProfileGuard)
    @Get(':id')
    @ApiOperation({ summary: 'Ticket details' })
    @ApiParam({ name: 'id', type: 'string' })
    @ApiOkResponse({
        type: TicketResponseDto,
        example: {
            id: 'cmll24err00120w4kh7ugc619',
            attendeeId: 'cmll2441k000k0w4kdoav3h48',
            eventId: 'cmll24e8300100w4kv8pybghx',
            ticketType: 'REGULAR',
            status: 'PURCHASED',
            pricePaid: 97.26,
            isRefunded: false,
            cancelledAt: null,
        },
    })
    @ApiNotFoundResponse({
        description: 'Ticket not found',
        example: {
            statusCode: 404,
            timestamp: '2026-02-13T16:42:06.829Z',
            path: '/api/tickets/cmll24err00120w4kh7ugc619a',
            message: {
                message: 'Not Found',
                statusCode: 404,
            },
        },
    })
    async getTicket(@GetUser() user: UserForTokenDto, @Param('id') id: string) {
        return this.ticketsService.getTicket(user.id, id);
    }

    @UseGuards(AttendeeProfileGuard)
    @Patch(':id/cancel')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Cancel ticket' })
    @ApiOkResponse({
        description: 'Ticket cancelled',
        type: TicketResponseDto,
        example: {
            id: 'cmll4mu3r00010wqdmxbn58zg',
            attendeeId: 'cmll4c2m400040w8w34hzxak8',
            eventId: 'cmll24e8300100w4kv8pybghx',
            ticketType: 'STUDENT',
            status: 'CANCELLED',
            pricePaid: 84.096,
            isRefunded: true,
            cancelledAt: '2026-02-13T17:15:27.728Z',
        },
    })
    @ApiBadRequestResponse({
        description: 'Cannot cancel ticket',
        example: {
            statusCode: 400,
            timestamp: '2026-02-13T17:17:22.175Z',
            path: '/api/tickets/cmll4mu3r00010wqdmxbn58zg/cancel',
            message: {
                message: 'Ticket already cancelled',
                error: 'Bad Request',
                statusCode: 400,
            },
        },
    })
    async cancelTicket(
        @GetUser() user: UserForTokenDto,
        @Param('id') id: string,
    ) {
        return this.ticketsService.cancelTicket(user.id, id);
    }
}
