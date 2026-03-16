import { wrapBase } from './base.template';

// ─── EVENT REMINDER ──────────────────────────────────────────────────────────

export const attendee_event_reminder_en = {
    subject: `Reminder: {{ eventTitle }} is tomorrow!`,
    htmlContent: wrapBase(
        `Reminder: {{ eventTitle }} is tomorrow!`,
        `
    <h1>Your event is tomorrow!</h1>
    <p>Hey <strong>{{ name }}</strong>, just a reminder that you have an event coming up:</p>
    <div class="detail-box">
      <p><span class="detail-label">Event</span><br><strong>{{ eventTitle }}</strong></p>
      <p><span class="detail-label">Date & Time</span><br><strong>{{ startTime }}</strong></p>
      <p><span class="detail-label">Location</span><br><strong>{{ location }}</strong></p>
    </div>
    <p>See you there!</p>
    <div style="margin-top:24px;padding:16px 18px;background:#F2EFF3;border-radius:8px;text-align:center;">
      <p style="margin:0;font-size:13px;color:#84828E;">Need help?</p>
      <p style="margin:4px 0 0 0;font-size:15px;font-weight:600;color:#111;">
        <a href="mailto:hello@riti.no" style="color:#0057FF;text-decoration:none;">
          hello@riti.no
        </a>
      </p>
    </div>
  `,
    ),
    textContent: `Reminder: {{ eventTitle }} is tomorrow at {{ startTime }} at {{ location }}. View: {{ eventUrl }}`,
};

export const attendee_event_reminder_no = {
    subject: `Påminnelse: {{ eventTitle }} er i morgen!`,
    htmlContent: wrapBase(
        `Påminnelse: {{ eventTitle }} er i morgen!`,
        `
    <h1>Arrangementet ditt er i morgen!</h1>
    <p>Hei <strong>{{ name }}</strong>, bare en påminnelse om at du har et arrangement som nærmer seg:</p>
    <div class="detail-box">
      <p><span class="detail-label">Arrangement</span><br><strong>{{ eventTitle }}</strong></p>
      <p><span class="detail-label">Dato og tid</span><br><strong>{{ startTime }}</strong></p>
      <p><span class="detail-label">Sted</span><br><strong>{{ location }}</strong></p>
    </div>
    <p>Vi sees der!</p>
     <div style="margin-top:24px;padding:16px 18px;background:#F2EFF3;border-radius:8px;text-align:center;">
      <p style="margin:0;font-size:13px;color:#84828E;">Trenger hjelp?</p>
      <p style="margin:4px 0 0 0;font-size:15px;font-weight:600;color:#111;">
        <a href="mailto:hello@riti.no" style="color:#0057FF;text-decoration:none;">
          hello@riti.no
        </a>
      </p>
    </div>
  `,
    ),
    textContent: `Påminnelse: {{ eventTitle }} er i morgen kl. {{ startTime }} på {{ location }}. Se: {{ eventUrl }}`,
};

// ─── REFUND CONFIRMATION ─────────────────────────────────────────────────────

export const attendee_refund_confirmation_en = {
    subject: `Refund Processed - {{ bookingId }}`,
    htmlContent: wrapBase(
        `Refund Processed - {{ bookingId }}`,
        `
    <h1>Your refund has been processed</h1>
    <p>Hey <strong>{{ name }}</strong>, your refund is on its way:</p>
    <div class="detail-box">
      <p><span class="detail-label">Booking ID</span><br><strong>{{ bookingId }}</strong></p>
      <p><span class="detail-label">Refund Amount</span><br><strong>{{ amount }}</strong></p>
      <p><span class="detail-label">Processed On</span><br><strong>{{ refundDate }}</strong></p>
    </div>
    <p>Please allow 5-7 business days for the refund to appear in your account.</p>
    <div style="margin-top:24px;padding:16px 18px;background:#F2EFF3;border-radius:8px;text-align:center;">
      <p style="margin:0;font-size:13px;color:#84828E;">Need help?</p>
      <p style="margin:4px 0 0 0;font-size:15px;font-weight:600;color:#111;">
        <a href="mailto:hello@riti.no" style="color:#0057FF;text-decoration:none;">
          hello@riti.no
        </a>
      </p>
    </div>
  `,
    ),
    textContent: `Refund of {{ amount }} for booking {{ bookingId }} has been processed on {{ refundDate }}.`,
};

export const attendee_refund_confirmation_no = {
    subject: `Refusjon behandlet - {{ bookingId }}`,
    htmlContent: wrapBase(
        `Refusjon behandlet - {{ bookingId }}`,
        `
    <h1>Refusjonen din er behandlet</h1>
    <p>Hei <strong>{{ name }}</strong>, refusjonen din er på vei:</p>
    <div class="detail-box">
      <p><span class="detail-label">Booking-ID</span><br><strong>{{ bookingId }}</strong></p>
      <p><span class="detail-label">Refusjonsbeløp</span><br><strong>{{ amount }}</strong></p>
      <p><span class="detail-label">Behandlet den</span><br><strong>{{ refundDate }}</strong></p>
    </div>
    <p>Det kan ta 5-7 virkedager før refusjonen vises på kontoen din.</p>
    <div style="margin-top:24px;padding:16px 18px;background:#F2EFF3;border-radius:8px;text-align:center;">
      <p style="margin:0;font-size:13px;color:#84828E;">Trenger hjelp?</p>
      <p style="margin:4px 0 0 0;font-size:15px;font-weight:600;color:#111;">
        <a href="mailto:hello@riti.no" style="color:#0057FF;text-decoration:none;">
          hello@riti.no
        </a>
      </p>
    </div>
  `,
    ),
    textContent: `Refusjon på {{ amount }} for booking {{ bookingId }} ble behandlet den {{ refundDate }}.`,
};
