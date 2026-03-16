import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { EmailStatus } from '@prisma/client';
import { DatabaseService } from 'src/database/database.service';
import { SendGridEmailService } from '../services/sendgrid-email.service';

@Processor('emails')
export class EmailProcessor extends WorkerHost {
    private readonly logger = new Logger(EmailProcessor.name);

    constructor(
        private readonly db: DatabaseService,
        private readonly sendGrid: SendGridEmailService,
    ) {
        super();
    }

    async process(job: Job<{ emailId: string }>): Promise<void> {
        const { emailId } = job.data;
        this.logger.log(`Processing email job [${emailId}]`);

        const email = await this.db.email.findUnique({
            where: { id: emailId },
        });

        if (!email) {
            this.logger.error(`Email [${emailId}] not found in DB`);
            return;
        }

        if (email.status !== EmailStatus.QUEUED) {
            this.logger.warn(
                `Email [${emailId}] is not QUEUED (status: ${email.status}), skipping`,
            );
            return;
        }

        const result = await this.sendGrid.send({
            to: email.to,
            subject: email.subject,
            htmlBody: email.htmlBody,
            textBody: email.textBody ?? undefined,
        });

        if (result.success) {
            await this.db.email.update({
                where: { id: emailId },
                data: { status: EmailStatus.SENT },
            });
            this.logger.log(`Email [${emailId}] sent successfully`);
        } else {
            await this.db.email.update({
                where: { id: emailId },
                data: {
                    status: EmailStatus.FAILED,
                    error: result.error ?? 'Unknown SendGrid error',
                },
            });
            this.logger.error(`Email [${emailId}] failed: ${result.error}`);
            throw new Error(result.error); 
        }
    }
}
