import {
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Logger,
    Param,
    Patch,
    Query,
    UseGuards,
} from '@nestjs/common';
import { NotificationsService } from '../services';
import {
    ApiBearerAuth,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiOperation,
    ApiParam,
    ApiQuery,
    ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard, SuspentionGuard } from 'src/auth/guards';
import { type UserForTokenDto } from 'src/auth/interfaces';
import { GetUser } from 'src/auth/decorators';
import {
    NotificationsListQueryDto,
    NotificationsListResponseDto,
} from '../dto';

@ApiTags('Notifications')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, SuspentionGuard)
@Controller('notifications')
export class NotificationsController {
    private readonly logger = new Logger(NotificationsController.name);

    constructor(private readonly notificationsService: NotificationsService) {}

    @Get('me')
    @ApiOperation({ summary: 'Fetch user notifications' })
    @ApiQuery({ name: 'type', required: false })
    @ApiQuery({ name: 'read', required: false })
    @ApiQuery({ name: 'limit', required: false, example: 20 })
    @ApiQuery({ name: 'page', required: false, example: 1 })
    @ApiOkResponse({
        description: 'Notifications fetched',
        type: NotificationsListResponseDto,
    })
    async getMyNotifications(
        @GetUser() user: UserForTokenDto,
        @Query() query: NotificationsListQueryDto,
    ): Promise<NotificationsListResponseDto> {
        this.logger.debug(`Fetching notifications for user ${user.id}`);
        const { notifications, total } =
            await this.notificationsService.findByUser(user.id, query);
        return {
            notifications,
            meta: {
                page: query.page,
                limit: query.limit,
                total,
                totalPages: Math.ceil(total / query.limit),
            },
        };
    }

    @Get('me/unread-count')
    @ApiOperation({ summary: 'Get unread notifications count' })
    @ApiOkResponse({ description: 'Unread count', type: Number })
    async getUnreadCount(@GetUser() user: UserForTokenDto): Promise<number> {
        this.logger.debug(`Fetching unread count for user ${user.id}`);
        return this.notificationsService.getUnreadCount(user.id);
    }

    @Patch(':id/read')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Mark notification as read' })
    @ApiParam({ name: 'id', example: 'ntf123' })
    @ApiOkResponse({
        description: 'Marked as read',
        schema: {
            type: 'object',
            properties: { id: { type: 'string' }, read: { type: 'boolean' } },
        },
    })
    @ApiNotFoundResponse({
        description: 'Notification not found or not yours',
        example: {
            statusCode: 404,
            message: 'Notification not found or not yours',
        },
    })
    async markAsRead(
        @Param('id') id: string,
        @GetUser() user: UserForTokenDto,
    ): Promise<{ id: string; read: true }> {
        this.logger.debug(
            `Marking notification ${id} as read for user ${user.id}`,
        );
        return this.notificationsService.markAsRead(id, user.id);
    }
}
