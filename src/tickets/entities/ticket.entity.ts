import { EventStatus, Prisma, TicketStatus, TicketType } from '@prisma/client';
import { Transform } from 'class-transformer';
import { TicketResponseDto } from '../dto';

export class TicketEntity {
    private _prismaModel: Prisma.TicketGetPayload<{
        include: {
            event: {
                select: {
                    coverImg: true;
                    title: true;
                    startTime: true;
                    status: true;
                    booking: {
                        select: {
                            space: {
                                select: {
                                    address: true;
                                    location: true;
                                };
                            };
                        };
                    };
                };
            };
        };
    }>;

    constructor(
        model: Prisma.TicketGetPayload<{
            include: {
                event: {
                    select: {
                        coverImg: true;
                        title: true;
                        startTime: true;
                        status: true;
                        booking: {
                            select: {
                                space: {
                                    select: {
                                        address: true;
                                        location: true;
                                    };
                                };
                            };
                        };
                    };
                };
            };
        }>,
    ) {
        this._prismaModel = model;
    }

    static fromPrisma(
        model: Prisma.TicketGetPayload<{
            include: {
                event: {
                    select: {
                        coverImg: true;
                        title: true;
                        startTime: true;
                        status: true;
                        booking: {
                            select: {
                                space: {
                                    select: {
                                        address: true;
                                        location: true;
                                    };
                                };
                            };
                        };
                    };
                };
            };
        }>,
    ): TicketEntity {
        return new TicketEntity(model);
    }

    get id(): string {
        return this._prismaModel.id;
    }
    get status(): TicketStatus {
        return this._prismaModel.status;
    }
    get isRefunded(): boolean {
        return this._prismaModel.isRefunded;
    }
    get cancelledAt(): Date | null {
        return this._prismaModel.cancelledAt;
    }
    get attendeeId(): string {
        return this._prismaModel.attendeeId;
    }
    get eventId(): string {
        return this._prismaModel.eventId;
    }
    get ticketType(): TicketType {
        return this._prismaModel.ticketType;
    }

    @Transform(({ value }) => Number(value ?? 0))
    get pricePaid(): number {
        return Number(this._prismaModel.pricePaid);
    }
    get stripePaymentIntentId(): string | null {
        return this._prismaModel.stripePaymentIntentId;
    }

    get eventName(): string {
        return this._prismaModel.event.title;
    }

    get eventStartTime(): Date | null {
        return this._prismaModel.event.startTime;
    }

    get eventStatus(): EventStatus {
        return this._prismaModel.event.status;
    }

    get eventAddress(): string | undefined {
        return this._prismaModel.event?.booking?.space.address;
    }

    get eventLocation(): string | null | undefined {
        return this._prismaModel.event?.booking?.space.location;
    }

    get eventCoverImg(): string | null {
        return this._prismaModel.event.coverImg;
    }

    toDto(): Omit<TicketResponseDto, 'event'> {
        return {
            id: this.id,
            attendeeId: this.attendeeId,
            eventId: this.eventId,
            ticketType: this.ticketType,
            status: this.status,
            pricePaid: this.pricePaid,
            attendeeStripePaymentId: this.stripePaymentIntentId,
            isRefunded: this.isRefunded,
            cancelledAt: this.cancelledAt,
            eventName: this.eventName,
            eventStartTime: this.eventStartTime!,
            eventAddress: this.eventAddress!,
            eventLocation: this.eventLocation!,
            eventStatus: this.eventStatus,
            coverImg: this.eventCoverImg,
        };
    }

    canCancel(eventStartTime: Date): boolean {
        return (
            this.status === TicketStatus.PURCHASED &&
            !this.cancelledAt &&
            new Date() <
                new Date(eventStartTime.getTime() - 24 * 60 * 60 * 1000)
        );
    }

    cancel(eventStartTime: Date): void {
        if (!this.canCancel(eventStartTime))
            throw new Error('Cannot cancel ticket');
        this._prismaModel.status = TicketStatus.CANCELLED;
        this._prismaModel.isRefunded = true;
        this._prismaModel.cancelledAt = new Date();
    }

    toPrismaUpdate(): Prisma.TicketUpdateInput {
        return {
            status: this._prismaModel.status,
            isRefunded: this._prismaModel.isRefunded,
            cancelledAt: this._prismaModel.cancelledAt,
        };
    }
}
