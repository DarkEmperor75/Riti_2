import { EmailType } from '@prisma/client';
import {
    welcome_en,
    welcome_no,
    forgot_password_en,
    forgot_password_no,
    booking_confirmation_en,
    booking_confirmation_no,
    booking_cancellation_en,
    booking_cancellation_no,
} from './user-emails.template';
import {
    attendee_event_reminder_en,
    attendee_event_reminder_no,
    attendee_refund_confirmation_en,
    attendee_refund_confirmation_no,
} from './attendee-emails.template';
import {
    host_event_cancellation_en,
    host_event_cancellation_no,
    host_refund_processed_en,
    host_refund_processed_no,
    host_event_payout_en,
    host_event_payout_no,
} from './host-emails.template';
import {
    vendor_space_booking_confirmed_en,
    vendor_space_booking_confirmed_no,
    vendor_space_booking_cancelled_en,
    vendor_space_booking_cancelled_no,
    vendor_space_payout_en,
    vendor_space_payout_no,
} from './vendor-emails.template';

export type EmailTemplate = {
    subject: string;
    htmlContent: string;
    textContent: string;
};

type TemplateMap = Record<EmailType, { en: EmailTemplate; no: EmailTemplate }>;

export const EMAIL_TEMPLATE_MAP: TemplateMap = {
    [EmailType.WELCOME]: { en: welcome_en, no: welcome_no },
    [EmailType.FORGOT_PASSWORD]: {
        en: forgot_password_en,
        no: forgot_password_no,
    },
    [EmailType.BOOKING_CONFIRMATION]: {
        en: booking_confirmation_en,
        no: booking_confirmation_no,
    },
    [EmailType.BOOKING_CANCELLATION]: {
        en: booking_cancellation_en,
        no: booking_cancellation_no,
    },
    [EmailType.EVENT_REMINDER]: {
        en: attendee_event_reminder_en,
        no: attendee_event_reminder_no,
    },
    [EmailType.EVENT_REFUND_CONFIRMATION]: {
        en: attendee_refund_confirmation_en,
        no: attendee_refund_confirmation_no,
    },
    [EmailType.EVENT_CANCELLATION]: {
        en: host_event_cancellation_en,
        no: host_event_cancellation_no,
    },
    [EmailType.SPACE_REFUND_CONFIRMATION]: {
        en: host_refund_processed_en,
        no: host_refund_processed_no,
    },
    [EmailType.EVENT_PAYOUT]: {
        en: host_event_payout_en,
        no: host_event_payout_no,
    },
    [EmailType.SPACE_BOOKING_CONFIRMED]: {
        en: vendor_space_booking_confirmed_en,
        no: vendor_space_booking_confirmed_no,
    },
    [EmailType.SPACE_BOOKING_CANCELLED]: {
        en: vendor_space_booking_cancelled_en,
        no: vendor_space_booking_cancelled_no,
    },
    [EmailType.SPACE_BOOKING_PAYOUT]: {
        en: vendor_space_payout_en,
        no: vendor_space_payout_no,
    },
};

export * from './base.template';
export * from './user-emails.template';
export * from './attendee-emails.template';
export * from './host-emails.template';
export * from './vendor-emails.template';
