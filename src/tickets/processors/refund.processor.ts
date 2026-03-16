import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PaymentsService } from 'src/payments/services';

@Processor('refunds')
export class RefundProcessor extends WorkerHost {
    constructor(private paymentsService: PaymentsService) {
        super();
    }

    async process(job: Job) {
        switch (job.name) {
            case 'refund-ticket':
                return this.refundTicket(job);
        }
    }

    async refundTicket(job: Job<{ ticketId: string }>) {
        const { ticketId } = job.data;

        return this.paymentsService.refundTicketById(ticketId);
    }
}
