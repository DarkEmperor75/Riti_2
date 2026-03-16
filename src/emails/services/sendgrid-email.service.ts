import { Injectable, Logger } from '@nestjs/common';
import sgMail from '@sendgrid/mail';
import { ConfigService } from '@nestjs/config';

interface SendGridData {
    to: string[];
    subject: string;
    htmlBody: string;
    textBody?: string;
}

@Injectable()
export class SendGridEmailService {
    private readonly logger = new Logger(SendGridEmailService.name);

    constructor(private config: ConfigService) {
        sgMail.setApiKey(this.config.get<string>('SENDGRID_API_KEY')!);
    }

    async send(data: SendGridData): Promise<{
        success: boolean;
        messageId?: string;
        error?: string;
    }> {
        const msg = {
            to: data.to,
            from: {
                email: this.config.get<string>('SENDGRID_FROM_EMAIL')!,
                name: this.config.get<string>('SENDGRID_FROM_NAME') || 'Riti',
            },
            subject: data.subject,
            html: data.htmlBody,
            text: data.textBody || 'Please view this email in HTML mode',
        };

        try {
            const [res] = await sgMail.send(msg);
            return {
                success: true,
                messageId: res.headers['x-message-id'],
            };
        } catch (error) {
            this.logger.error('Sendgrid error', error);
            return {
                success: false,
                error: error.message,
            };
        }
    }
}
