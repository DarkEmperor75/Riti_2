import { wrapBase } from './base.template';

// ─── SPACE BOOKING CONFIRMED ─────────────────────────────────────────────────

export const vendor_space_booking_confirmed_en = {
  subject: `Space Booked - {{ spaceName }}`,
  htmlContent: wrapBase(`Space Booked - {{ spaceName }}`, `
    <h1>Your space has been booked!</h1>
    <p>Hey <strong>{{ name }}</strong>, a new booking has been made for your space:</p>
    <div class="detail-box">
      <p><span class="detail-label">Space</span><br><strong>{{ spaceName }}</strong></p>
      <p><span class="detail-label">Booked By</span><br><strong>{{ customerName }}</strong></p>
      <p><span class="detail-label">Date</span><br><strong>{{ date }}</strong></p>
      <p><span class="detail-label">Time</span><br><strong>{{ startTime }} - {{ endTime }}</strong></p>
      <p><span class="detail-label">Amount</span><br><strong>{{ amount }}</strong></p>
      <p><span class="detail-label">Booking ID</span><br><strong>{{ bookingId }}</strong></p>
    </div>
    <div style="margin-top:24px;padding:16px 18px;background:#F2EFF3;border-radius:8px;text-align:center;">
      <p style="margin:0;font-size:13px;color:#84828E;">Need help?</p>
      <p style="margin:4px 0 0 0;font-size:15px;font-weight:600;color:#111;">
        <a href="mailto:partners@riti.no" style="color:#0057FF;text-decoration:none;">
          partners@riti.no
        </a>
      </p>
    </div>
  `),
  textContent: `New booking for {{ spaceName }} by {{ customerName }} on {{ date }} from {{ startTime }} to {{ endTime }}. Amount: {{ amount }}. Booking ID: {{ bookingId }}`,
};

export const vendor_space_booking_confirmed_no = {
  subject: `Lokale booket - {{ spaceName }}`,
  htmlContent: wrapBase(`Lokale booket - {{ spaceName }}`, `
    <h1>Lokalet ditt er booket!</h1>
    <p>Hei <strong>{{ name }}</strong>, det er gjort en ny booking for lokalet ditt:</p>
    <div class="detail-box">
      <p><span class="detail-label">Lokale</span><br><strong>{{ spaceName }}</strong></p>
      <p><span class="detail-label">Booket av</span><br><strong>{{ customerName }}</strong></p>
      <p><span class="detail-label">Dato</span><br><strong>{{ date }}</strong></p>
      <p><span class="detail-label">Tid</span><br><strong>{{ startTime }} - {{ endTime }}</strong></p>
      <p><span class="detail-label">Beløp</span><br><strong>{{ amount }}</strong></p>
      <p><span class="detail-label">Booking-ID</span><br><strong>{{ bookingId }}</strong></p>
    </div>
    <div style="margin-top:24px;padding:16px 18px;background:#F2EFF3;border-radius:8px;text-align:center;">
      <p style="margin:0;font-size:13px;color:#84828E;">Trenger hjelp?</p>
      <p style="margin:4px 0 0 0;font-size:15px;font-weight:600;color:#111;">
        <a href="mailto:partners@riti.no" style="color:#0057FF;text-decoration:none;">
          partners@riti.no
        </a>
      </p>
    </div>
  `),
  textContent: `Ny booking for {{ spaceName }} av {{ customerName }} den {{ date }} fra {{ startTime }} til {{ endTime }}. Beløp: {{ amount }}. Booking-ID: {{ bookingId }}`,
};

// ─── SPACE BOOKING CANCELLED ─────────────────────────────────────────────────

export const vendor_space_booking_cancelled_en = {
  subject: `Booking Cancelled - {{ spaceName }}`,
  htmlContent: wrapBase(`Booking Cancelled - {{ spaceName }}`, `
    <h1>A booking has been cancelled</h1>
    <p>Hey <strong>{{ name }}</strong>, the following booking for your space has been cancelled:</p>
    <div class="detail-box">
      <p><span class="detail-label">Space</span><br><strong>{{ spaceName }}</strong></p>
      <p><span class="detail-label">Booked By</span><br><strong>{{ customerName }}</strong></p>
      <p><span class="detail-label">Date</span><br><strong>{{ date }}</strong></p>
      <p><span class="detail-label">Booking ID</span><br><strong>{{ bookingId }}</strong></p>
    </div>
    <div style="margin-top:24px;padding:16px 18px;background:#F2EFF3;border-radius:8px;text-align:center;">
      <p style="margin:0;font-size:13px;color:#84828E;">Need help?</p>
      <p style="margin:4px 0 0 0;font-size:15px;font-weight:600;color:#111;">
        <a href="mailto:partners@riti.no" style="color:#0057FF;text-decoration:none;">
          partners@riti.no
        </a>
      </p>
    </div>
  `),
  textContent: `Booking for {{ spaceName }} by {{ customerName }} on {{ date }} has been cancelled. Booking ID: {{ bookingId }}`,
};

export const vendor_space_booking_cancelled_no = {
  subject: `Booking avbestilt - {{ spaceName }}`,
  htmlContent: wrapBase(`Booking avbestilt - {{ spaceName }}`, `
    <h1>En booking er avbestilt</h1>
    <p>Hei <strong>{{ name }}</strong>, følgende booking for lokalet ditt er avbestilt:</p>
    <div class="detail-box">
      <p><span class="detail-label">Lokale</span><br><strong>{{ spaceName }}</strong></p>
      <p><span class="detail-label">Booket av</span><br><strong>{{ customerName }}</strong></p>
      <p><span class="detail-label">Dato</span><br><strong>{{ date }}</strong></p>
      <p><span class="detail-label">Booking-ID</span><br><strong>{{ bookingId }}</strong></p>
    </div>
    <div style="margin-top:24px;padding:16px 18px;background:#F2EFF3;border-radius:8px;text-align:center;">
      <p style="margin:0;font-size:13px;color:#84828E;">Trenger hjelp?</p>
      <p style="margin:4px 0 0 0;font-size:15px;font-weight:600;color:#111;">
        <a href="mailto:partners@riti.no" style="color:#0057FF;text-decoration:none;">
          partners@riti.no
        </a>
      </p>
    </div>
  `),
  textContent: `Booking for {{ spaceName }} av {{ customerName }} den {{ date }} er avbestilt. Booking-ID: {{ bookingId }}`,
};

// ─── SPACE PAYOUT ────────────────────────────────────────────────────────────

export const vendor_space_payout_en = {
  subject: `Payout Processed - {{ spaceName }}`,
  htmlContent: wrapBase(`Payout Processed - {{ spaceName }}`, `
    <h1>Your payout is on its way!</h1>
    <p>Hey <strong>{{ name }}</strong>, your payout for the following space booking has been processed:</p>
    <div class="detail-box">
      <p><span class="detail-label">Space</span><br><strong>{{ spaceName }}</strong></p>
      <p><span class="detail-label">Payout Amount</span><br><strong>{{ amount }}</strong></p>
      <p><span class="detail-label">Processed On</span><br><strong>{{ payoutDate }}</strong></p>
    </div>
    <p>Funds will appear in your connected bank account within 2-5 business days.</p>
    <div style="margin-top:24px;padding:16px 18px;background:#F2EFF3;border-radius:8px;text-align:center;">
      <p style="margin:0;font-size:13px;color:#84828E;">Need help?</p>
      <p style="margin:4px 0 0 0;font-size:15px;font-weight:600;color:#111;">
        <a href="mailto:partners@riti.no" style="color:#0057FF;text-decoration:none;">
          partners@riti.no
        </a>
      </p>
    </div>
  `),
  textContent: `Payout of {{ amount }} for space {{ spaceName }} was processed on {{ payoutDate }}.`,
};

export const vendor_space_payout_no = {
  subject: `Utbetaling behandlet - {{ spaceName }}`,
  htmlContent: wrapBase(`Utbetaling behandlet - {{ spaceName }}`, `
    <h1>Utbetalingen din er på vei!</h1>
    <p>Hei <strong>{{ name }}</strong>, utbetalingen din for følgende lokale-booking er behandlet:</p>
    <div class="detail-box">
      <p><span class="detail-label">Lokale</span><br><strong>{{ spaceName }}</strong></p>
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
  `),
  textContent: `Utbetaling på {{ amount }} for lokale {{ spaceName }} ble behandlet den {{ payoutDate }}.`,
};
