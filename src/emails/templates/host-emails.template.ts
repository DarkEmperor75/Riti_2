import { wrapBase } from './base.template';

// ─── EVENT CANCELLATION ──────────────────────────────────────────────────────

export const host_event_cancellation_en = {
    subject: `Event Cancelled - {{ eventTitle }}`,
    htmlContent: wrapBase(
        `Event Cancelled - {{ eventTitle }}`,
        `
    <h1>Your event has been cancelled</h1>
    <p>Hey <strong>{{ name }}</strong>, your event has been cancelled:</p>
    <div class="detail-box">
      <p><span class="detail-label">Event</span><br><strong>{{ eventTitle }}</strong></p>
      <p><span class="detail-label">Scheduled Date</span><br><strong>{{ eventDate }}</strong></p>
    </div>
    <p>All attendees will be notified and refunded where applicable.</p>
    <div style="margin-top:24px;padding:16px 18px;background:#F2EFF3;border-radius:8px;text-align:center;">
      <p style="margin:0;font-size:13px;color:#84828E;">Need help?</p>
      <p style="margin:4px 0 0 0;font-size:15px;font-weight:600;color:#111;">
        <a href="mailto:partners@riti.no" style="color:#0057FF;text-decoration:none;">
          partners@riti.no
        </a>
      </p>
    </div>
  `,
    ),
    textContent: `Your event {{ eventTitle }} scheduled for {{ eventDate }} has been cancelled.`,
};

export const host_event_cancellation_no = {
    subject: `Arrangement avlyst - {{ eventTitle }}`,
    htmlContent: wrapBase(
        `Arrangement avlyst - {{ eventTitle }}`,
        `
    <h1>Arrangementet ditt er avlyst</h1>
    <p>Hei <strong>{{ name }}</strong>, arrangementet ditt er avlyst:</p>
    <div class="detail-box">
      <p><span class="detail-label">Arrangement</span><br><strong>{{ eventTitle }}</strong></p>
      <p><span class="detail-label">Planlagt dato</span><br><strong>{{ eventDate }}</strong></p>
    </div>
    <p>Alle deltakere vil bli varslet og refundert der det er aktuelt.</p>
    <div style="margin-top:24px;padding:16px 18px;background:#F2EFF3;border-radius:8px;text-align:center;">
      <p style="margin:0;font-size:13px;color:#84828E;">Trenger hjelp?</p>
      <p style="margin:4px 0 0 0;font-size:15px;font-weight:600;color:#111;">
        <a href="mailto:partners@riti.no" style="color:#0057FF;text-decoration:none;">
          partners@riti.no
        </a>
      </p>
    </div>
  `,
    ),
    textContent: `Arrangementet ditt {{ eventTitle }} planlagt til {{ eventDate }} er avlyst.`,
};

// ─── REFUND PROCESSED ────────────────────────────────────────────────────────

export const host_refund_processed_en = {
    subject: `Refund Processed - {{ bookingId }}`,
    htmlContent: wrapBase(
        `Refund Processed - {{ bookingId }}`,
        `
    <h1>A refund has been processed</h1>
    <p>Hey <strong>{{ name }}</strong>, a refund has been issued for one of your bookings:</p>
    <div class="detail-box">
      <p><span class="detail-label">Booking ID</span><br><strong>{{ bookingId }}</strong></p>
      <p><span class="detail-label">Customer</span><br><strong>{{ customerName }}</strong></p>
      <p><span class="detail-label">Refund Amount</span><br><strong>{{ amount }}</strong></p>
      <p><span class="detail-label">Processed On</span><br><strong>{{ refundDate }}</strong></p>
      <div style="margin-top:24px;padding:16px 18px;background:#F2EFF3;border-radius:8px;text-align:center;">
      <p style="margin:0;font-size:13px;color:#84828E;">Need help?</p>
      <p style="margin:4px 0 0 0;font-size:15px;font-weight:600;color:#111;">
        <a href="mailto:partners@riti.no" style="color:#0057FF;text-decoration:none;">
          partners@riti.no
        </a>
      </p>
    </div>
    </div>
  `,
    ),
    textContent: `Refund of {{ amount }} for booking {{ bookingId }} ({{ customerName }}) was processed on {{ refundDate }}.`,
};

export const host_refund_processed_no = {
    subject: `Refusjon behandlet - {{ bookingId }}`,
    htmlContent: wrapBase(
        `Refusjon behandlet - {{ bookingId }}`,
        `
    <h1>En refusjon er behandlet</h1>
    <p>Hei <strong>{{ name }}</strong>, en refusjon er utstedt for en av bookingene dine:</p>
    <div class="detail-box">
      <p><span class="detail-label">Booking-ID</span><br><strong>{{ bookingId }}</strong></p>
      <p><span class="detail-label">Kunde</span><br><strong>{{ customerName }}</strong></p>
      <p><span class="detail-label">Refusjonsbeløp</span><br><strong>{{ amount }}</strong></p>
      <p><span class="detail-label">Behandlet den</span><br><strong>{{ refundDate }}</strong></p>
    </div>
    <div style="margin-top:24px;padding:16px 18px;background:#F2EFF3;border-radius:8px;text-align:center;">
      <p style="margin:0;font-size:13px;color:#84828E;">Trenger hjelp?</p>
      <p style="margin:4px 0 0 0;font-size:15px;font-weight:600;color:#111;">
        <a href="mailto:partners@riti.no" style="color:#0057FF;text-decoration:none;">
          partners@riti.no
        </a>
      </p>
    </div>
  `,
    ),
    textContent: `Refusjon på {{ amount }} for booking {{ bookingId }} ({{ customerName }}) ble behandlet den {{ refundDate }}.`,
};

// ─── EVENT PAYOUT ────────────────────────────────────────────────────────────

export const host_event_payout_en = {
    subject: `Payout Processed - {{ eventTitle }}`,
    htmlContent: wrapBase(
        `Payout Processed - {{ eventTitle }}`,
        `
    <h1>Your payout is on its way!</h1>
    <p>Hey <strong>{{ name }}</strong>, your payout for the following event has been processed:</p>
    <div class="detail-box">
      <p><span class="detail-label">Event</span><br><strong>{{ eventTitle }}</strong></p>
      <p><span class="detail-label">Payout Amount</span><br><strong>{{ amount }}</strong></p>
      <p><span class="detail-label">Processed On</span><br><strong>{{ payoutDate }}</strong></p>
    </div>
    <p>Funds will appear in your connected bank account within 2-5 business days.</p>
    <div style="margin-top:24px;padding:16px 18px;background:#F2EFF3;border-radius:8px;text-align:center;">
      <p style="margin:0;font-size:13px;color:#84828E;">Need Help?</p>
      <p style="margin:4px 0 0 0;font-size:15px;font-weight:600;color:#111;">
        <a href="mailto:partners@riti.no" style="color:#0057FF;text-decoration:none;">
          partners@riti.no
        </a>
      </p>
    </div>
  `,
    ),
    textContent: `Payout of {{ amount }} for event {{ eventTitle }} was processed on {{ payoutDate }}.`,
};

export const host_event_payout_no = {
    subject: `Utbetaling behandlet - {{ eventTitle }}`,
    htmlContent: wrapBase(
        `Utbetaling behandlet - {{ eventTitle }}`,
        `
    <h1>Utbetalingen din er på vei!</h1>
    <p>Hei <strong>{{ name }}</strong>, utbetalingen din for følgende arrangement er behandlet:</p>
    <div class="detail-box">
      <p><span class="detail-label">Arrangement</span><br><strong>{{ eventTitle }}</strong></p>
      <p><span class="detail-label">Utbetalingsbeløp</span><br><strong>{{ amount }}</strong></p>
      <p><span class="detail-label">Behandlet den</span><br><strong>{{ payoutDate }}</strong></p>
    </div>
    <p>Midlene vil vises på din tilknyttede bankkonto innen 2-5 virkedager.</p>
    <div style="margin-top:24px;padding:16px 18px;background:#F2EFF3;border-radius:8px;text-align:center;">
      <p style="margin:0;font-size:13px;color:#84828E;">Trenger hjelp?</p>
      <p style="margin:4px 0 0 0;font-size:15px;font-weight:600;color:#111;">
        <a href="mailto:partners@riti.no" style="color:#0057FF;text-decoration:none;">
          partners@riti.no
        </a>
      </p>
    </div>
  `,
    ),
    textContent: `Utbetaling på {{ amount }} for arrangement {{ eventTitle }} ble behandlet den {{ payoutDate }}.`,
};
