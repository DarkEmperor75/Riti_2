import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('')
export class AppController {
    @Get('health')
    @ApiOperation({ summary: 'API Health check' })
    @ApiResponse({
        status: 200,
        description: 'Service is Healthy',
        schema: {
            example: {
                status: 'healthy',
            },
        },
    })
    getHealth(): Record<string, string> {
        return { status: 'healthy' };
    }
}
