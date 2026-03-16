import { wrapBase } from './base.template';

// ─── WELCOME ────────────────────────────────────────────────────────────────

export const welcome_en = {
    subject: `Welcome to Riti, {{ name }}!`,
    htmlContent: wrapBase(
        `Welcome to Riti, {{ name }}!`,
        `
          <h1>Welcome to Riti!</h1>
          <p>Hey <strong>{{ name }}</strong>, we're glad you're here.</p>
          <p>Riti is your go-to marketplace for booking spaces and attending events across Scandinavia.</p>
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
    textContent: `Welcome to Riti, {{ name }}! Get started: {{ loginUrl }}`,
};

export const welcome_no = {
    subject: `Velkommen til Riti, {{ name }}!`,
    htmlContent: wrapBase(
        `Velkommen til Riti, {{ name }}!`,
        `
    <h1>Velkommen til Riti!</h1>
    <p>Hei <strong>{{ name }}</strong>, vi er glade for at du er her.</p>
    <p>Riti er din markedsplass for å booke lokaler og delta på arrangementer i Skandinavia.</p>
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
    textContent: `Velkommen til Riti, {{ name }}! Kom i gang: {{ loginUrl }}`,
};

// ─── FORGOT PASSWORD ────────────────────────────────────────────────────────

export const forgot_password_en = {
    subject: `Reset your Riti password`,
    htmlContent: wrapBase(
        `Reset your Riti password`,
        `
    <h1>Password Reset</h1>
    <p>Hey <strong>{{ name }}</strong>,</p>
    <p>We received a request to reset your password. Click below to choose a new one:</p>
    <a href="{{ resetUrl }}" class="btn">Reset Password</a>
    <p>This link expires in <strong>{{ expiresIn }}</strong>.</p>
    <p>If you didn't request this, you can safely ignore this email.</p>
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
    textContent: `Reset your password: {{ resetUrl }} (expires in {{ expiresIn }})`,
};

export const forgot_password_no = {
    subject: `Tilbakestill Riti-passordet ditt`,
    htmlContent: wrapBase(
        `Tilbakestill Riti-passordet ditt`,
        `
    <h1>Tilbakestill passord</h1>
    <p>Hei <strong>{{ name }}</strong>,</p>
    <p>Vi mottok en forespørsel om å tilbakestille passordet ditt. Klikk nedenfor for å velge et nytt:</p>
    <a href="{{ resetUrl }}" class="btn">Tilbakestill passord</a>
    <p>Lenken utløper om <strong>{{ expiresIn }}</strong>.</p>
    <p>Hvis du ikke ba om dette, kan du trygt ignorere denne e-posten.</p>
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
    textContent: `Tilbakestill passord: {{ resetUrl }} (utløper om {{ expiresIn }})`,
};

// ─── BOOKING CONFIRMATION (shared: attendee + host as attendee) ──────────────

export const booking_confirmation_en = {
    subject: `Booking Confirmed - {{ spaceName }}`,
    htmlContent: wrapBase(
        `Booking Confirmed - {{ spaceName }}`,
        `
    <h1>Your booking is confirmed!</h1>
    <p>Hey <strong>{{ name }}</strong>, you're all set. Here are your booking details:</p>
    <div class="detail-box">
      <p><span class="detail-label">Space</span><br><strong>{{ spaceName }}</strong></p>
      <p><span class="detail-label">Date</span><br><strong>{{ date }}</strong></p>
      <p><span class="detail-label">Time</span><br><strong>{{ startTime }} - {{ endTime }}</strong></p>
      <p><span class="detail-label">Amount Paid</span><br><strong>{{ amount }}</strong></p>
      <p><span class="detail-label">Booking ID</span><br><strong>{{ bookingId }}</strong></p>
    </div>
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
    textContent: `Booking confirmed for {{ spaceName }} on {{ date }} from {{ startTime }} to {{ endTime }}. Amount: {{ amount }}. Booking ID: {{ bookingId }}`,
};

export const booking_confirmation_no = {
    subject: `Booking bekreftet - {{ spaceName }}`,
    htmlContent: wrapBase(
        `Booking bekreftet - {{ spaceName }}`,
        `
    <h1>Bookingen din er bekreftet!</h1>
    <p>Hei <strong>{{ name }}</strong>, alt er klart. Her er detaljene for bookingen din:</p>
    <div class="detail-box">
      <p><span class="detail-label">Lokale</span><br><strong>{{ spaceName }}</strong></p>
      <p><span class="detail-label">Dato</span><br><strong>{{ date }}</strong></p>
      <p><span class="detail-label">Tid</span><br><strong>{{ startTime }} - {{ endTime }}</strong></p>
      <p><span class="detail-label">Betalt beløp</span><br><strong>{{ amount }}</strong></p>
      <p><span class="detail-label">Booking-ID</span><br><strong>{{ bookingId }}</strong></p>
    </div>
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
    textContent: `Booking bekreftet for {{ spaceName }} den {{ date }} fra {{ startTime }} til {{ endTime }}. Beløp: {{ amount }}. Booking-ID: {{ bookingId }}`,
};

// ─── BOOKING CANCELLATION (shared: attendee + host as attendee) ──────────────

export const booking_cancellation_en = {
    subject: `Booking Cancelled - {{ spaceName }}`,
    htmlContent: wrapBase(
        `Booking Cancelled - {{ spaceName }}`,
        `
    <h1>Your booking has been cancelled</h1>
    <p>Hey <strong>{{ name }}</strong>, your booking has been cancelled. Here's a summary:</p>
    <div class="detail-box">
      <p><span class="detail-label">Space</span><br><strong>{{ spaceName }}</strong></p>
      <p><span class="detail-label">Date</span><br><strong>{{ date }}</strong></p>
      <p><span class="detail-label">Booking ID</span><br><strong>{{ bookingId }}</strong></p>
    </div>
    <p>If a refund is applicable, it will be processed within 5-7 business days.</p>
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
    textContent: `Your booking for {{ spaceName }} on {{ date }} has been cancelled. Booking ID: {{ bookingId }}`,
};

export const booking_cancellation_no = {
    subject: `Booking avbestilt - {{ spaceName }}`,
    htmlContent: wrapBase(
        `Booking avbestilt - {{ spaceName }}`,
        `
    <h1>Bookingen din er avbestilt</h1>
    <p>Hei <strong>{{ name }}</strong>, bookingen din er avbestilt. Her er en oppsummering:</p>
    <div class="detail-box">
      <p><span class="detail-label">Lokale</span><br><strong>{{ spaceName }}</strong></p>
      <p><span class="detail-label">Dato</span><br><strong>{{ date }}</strong></p>
      <p><span class="detail-label">Booking-ID</span><br><strong>{{ bookingId }}</strong></p>
    </div>
    <p>Hvis refusjon er aktuelt, vil det bli behandlet innen 5-7 virkedager.</p>
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
    textContent: `Bookingen din for {{ spaceName }} den {{ date }} er avbestilt. Booking-ID: {{ bookingId }}`,
};
