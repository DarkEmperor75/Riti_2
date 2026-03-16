import { EmailType } from '@prisma/client';
import {
    IsString,
    IsEnum,
    IsArray,
    IsEmail,
    IsOptional,
    IsObject,
    ArrayNotEmpty,
} from 'class-validator';

export class SendEmailDto {
    @IsString()
    userId: string;

    @IsEnum(EmailType)
    type: EmailType;

    @IsArray()
    @ArrayNotEmpty()
    @IsEmail({}, { each: true })
    to: string[];

    @IsString()
    subject: string;

    @IsString()
    htmlBody: string;

    @IsOptional()
    @IsString()
    textBody?: string;

    @IsEnum(['en', 'no'])
    language: 'en' | 'no';

    @IsOptional()
    @IsObject()
    metadata?: Record<string, any>;
}

export interface EmailQueueJob {
    emailId: string;
    data: SendEmailDto;
}
