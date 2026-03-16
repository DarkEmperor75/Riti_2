import {
    BadRequestException,
    Controller,
    Get,
    Logger,
    Param,
    Post,
    Query,
    type RawBodyRequest,
    Req,
    Res,
    UseGuards,
} from '@nestjs/common';
import {
    PaymentsCronService,
    PaymentsService,
    StripeActorType,
    StripeServiece,
} from '../services';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard, SuspentionGuard } from 'src/auth/guards';
import {
    AdminProfileGuard,
    HostProfileGuard,
    VendorProfileGuard,
} from 'src/users/guards';
import { GetUser, Public } from 'src/auth/decorators';
import { type UserForTokenDto } from 'src/auth/interfaces';
import Stripe from 'stripe';
import { Request, type Response } from 'express';
import { UserType } from '@prisma/client';
import { FinancialsService } from 'src/financials/services';

@ApiTags('Payments')
@Controller('payments')
@UseGuards(JwtAuthGuard, SuspentionGuard)
export class PaymentsController {
    private readonly logger = new Logger(PaymentsController.name);
    constructor(
        private readonly paymentsService: PaymentsService,
        private readonly stripeService: StripeServiece,
        private readonly paymentsCronService: PaymentsCronService,
        private readonly financialsService: FinancialsService,
    ) {}

    @ApiTags('Admin')
    @ApiOperation({
        summary: 'Release vendor payouts',
        description:
            'The admin can release vendor payouts manually by this endpoint, though the cron job is set in place',
    })
    @Post('cron/payments-release')
    @UseGuards(AdminProfileGuard)
    async releaseVendorPayouts() {
        return this.paymentsCronService.triggerReleaseVendorPayouts();
    }

    @Post('vendor/connect-stripe')
    @ApiOperation({
        summary: 'Connect vendor stripe account',
        description:
            'The vendor can connect their stripe account by this endpoint',
    })
    @UseGuards(VendorProfileGuard)
    async connectVendorStripe(@GetUser() user: UserForTokenDto) {
        return this.paymentsService.connectStripeAccount(
            user.id,
            StripeActorType.VENDOR,
        );
    }

    @Get('vendor/details-stripe')
    @UseGuards(VendorProfileGuard)
    async vendorStripeDetails(@GetUser() user: UserForTokenDto) {
        return this.paymentsService.vendorStripeDetails(user.id);
    }

    @Post('host/connect-stripe')
    @UseGuards(HostProfileGuard)
    async connectHostStripe(@GetUser() user: UserForTokenDto) {
        return this.paymentsService.connectStripeAccount(
            user.id,
            StripeActorType.HOST,
        );
    }

    @Get('host/details-stripe')
    @UseGuards(HostProfileGuard)
    async hostStripeDetails(@GetUser() user: UserForTokenDto) {
        return this.paymentsService.hostStripeDetails(user.id);
    }

    @Public()
    @Post('stripe/webhook')
    async handleStripeWebhook(
        @Req() req: RawBodyRequest<Request>,
        @Res() res: Response,
    ) {
        this.logger.log('Received Stripe webhook');
        if (req.rawBody === null) throw new Error('Missing Stripe raw body');

        const signature = req.headers['stripe-signature'];
        const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

        if (!signature || !endpointSecret) return;

        let event: Stripe.Event;

        try {
            event = this.stripeService
                .getClient()
                .webhooks.constructEvent(
                    req.rawBody as string | Buffer<ArrayBufferLike>,
                    signature,
                    endpointSecret,
                );
            this.logger.debug(`Received Stripe event: ${event.type}`);
        } catch (error) {
            throw new Error(`Webhook Error: ${error}`);
        }

        await this.paymentsService.handleStripeWebhook(event);
        this.logger.debug(`Handled Stripe event: ${event.type}`);

        return res.status(200).json({ received: true });
    }

    @Post('bookings/:bookingId')
    async payForSpaceBooking(
        @GetUser() user: UserForTokenDto,
        @Param('bookingId') bookingId: string,
    ): Promise<{ url: string }> {
        if (
            user.userType === UserType.VENDOR ||
            user.userType === UserType.ADMIN
        ) {
            throw new BadRequestException(
                'Only Hosts and Attendees can book spaces',
            );
        }
        return this.paymentsService.payForSpaceBooking(user.id, bookingId);
    }

    @Get('/vendors/payouts')
    @UseGuards(VendorProfileGuard)
    async getVendorPayouts(@GetUser() user: UserForTokenDto) {
        return this.financialsService.getActorPayouts('VENDOR', user.id);
    }

    @Get('/hosts/payouts')
    @UseGuards(HostProfileGuard)
    async getHostPayouts(@GetUser() user: UserForTokenDto) {
        return this.financialsService.getActorPayouts('HOST', user.id);
    }

    @Get('/admin/payouts')
    @UseGuards(AdminProfileGuard)
    async getAdminPayouts(@Query('limit') limit: string) {
        if (!limit) limit = '50';
        return this.financialsService.getAllPayouts(Number(limit));
    }
}
