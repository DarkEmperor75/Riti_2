import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';

@Injectable()
export class StripeServiece {
    private readonly stripe: Stripe;

    constructor() {
        this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
            apiVersion: '2026-01-28.clover'
        });
    }

    getClient(): Stripe {
        return this.stripe;
    }
}
