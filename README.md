# Riti Backend

Backend services for **Riti**, a web-based marketplace for discovering events, booking physical spaces, and hosting community experiences across Scandinavia.

The backend powers authentication, role management, event hosting, space bookings, payments, and administrative moderation.

---

# Overview

Riti is a **multi-role marketplace platform** where users can:

- Discover and attend events
- Host and sell tickets for events
- Book physical spaces
- List spaces as vendors
- Manage bookings and payouts

The backend supports a **unified user account system** where a single account can operate in different modes (Attend Mode, Host Mode, Vendor).

---

# Core Platform Capabilities

## Event Marketplace

Users can:

- Browse events
- Purchase tickets
- Receive refunds
- View upcoming and past activities
- Receive event notifications

---

## Event Hosting

Hosts can:

- Create and publish events
- Set event capacity and pricing
- Offer student discounts
- Track ticket sales
- View attendee lists
- Export attendee data (CSV)
- Cancel events and trigger refunds

Revenue is handled via **Stripe Connect**, with payouts released **24 hours after event completion**.

---

## Space Marketplace

Users can:

- Discover physical venues
- Request bookings
- Pay after vendor approval
- View booking history
- Cancel bookings before the cutoff window

Vendors can:

- List spaces
- Set pricing and booking rules
- Approve or reject booking requests
- Manage availability calendars
- Receive payouts through Stripe

---

## Vendor System

Space vendors can:

- Create and manage space listings
- Upload media and space details
- Set hourly pricing and booking constraints
- View booking requests
- Track earnings and payouts

New spaces require **admin approval before becoming publicly visible**.

---

## Admin Platform

Platform administrators can:

- Approve or reject space listings
- Monitor events and bookings
- Suspend vendors or spaces
- Cancel events for safety or compliance
- Monitor commissions and transaction logs
- Investigate disputes

Admins have **read-only access to Stripe transactions**.

---

# Authentication & Roles

Authentication supports:

- Email & Password
- Google OAuth

The system determines a user's capabilities dynamically based on actions rather than fixed roles.

Possible roles include:

- **Attendee (Consumer)**
- **Host (Event Organizer)**
- **Space Vendor**
- **Admin**

A single account can switch between **Attend Mode and Host Mode without re-registration**.

---

# Payments

Payments are handled through **Stripe Connect**.

### Event Tickets

- Paid during checkout
- Funds held until **24h after event completion**
- Automatic refunds on cancellation

### Space Bookings

- Payment occurs **after vendor approval**
- Funds held until **24h after booking completion**

### Revenue Split

| Type | Host | Vendor | Platform |
|-----|-----|-----|-----|
| Event Ticket | 100% | — | Platform fee optional |
| Space Booking | — | 90% | 10% commission |

---

# Booking Lifecycle

1. User submits booking request
2. Vendor reviews request
3. Vendor approves or rejects
4. User completes payment
5. Booking confirmed
6. Payout released 24h after completion

---

# Event Lifecycle

1. Host creates event draft
2. Host selects venue
3. Host sets ticket pricing
4. Event is published
5. Tickets go on sale
6. Event occurs
7. Stripe payout triggered after 24h

---

# Notifications

The backend supports in-app notifications for:

- Ticket confirmations
- Event cancellations
- Booking approvals or rejections
- Payment confirmations
- Payout updates
- Space approval status

---

# Backend Source Code Architecture

```
└── 📁src
    └── 📁admin
        └── 📁controllers
            ├── admin.controller.ts
            ├── index.ts
        └── 📁dto
            ├── admin-booking.dto.ts
            ├── admin-comission-res.dto.ts
            ├── admin-event-cancel.dto.ts
            ├── admin-finance.dto.ts
            ├── admin-list-spaces.dto.ts
            ├── admin-suspend.dto.ts
            ├── admin-tickets.dto.ts
            ├── admin-users.dto.ts
            ├── index.ts
            ├── space-status-update-response.dto.ts
            ├── update-space-status.dto.ts
        └── 📁entities
            ├── admin.entity.ts
            ├── event-update.entity.ts
            ├── index.ts
            ├── space-update.entity.ts
        └── 📁services
            ├── admin.service.ts
            ├── index.ts
        ├── admin.module.ts
        ├── index.ts
    └── 📁auth
        └── 📁controllers
            ├── auth.controller.ts
            ├── index.ts
        └── 📁decorators
            ├── get-user.decorator.ts
            ├── index.ts
            ├── public.decorator.ts
        └── 📁dto
            ├── auth-response.dto.ts
            ├── create-user.dto.ts
            ├── forgot-password.dto.ts
            ├── index.ts
            ├── login.dto.ts
            ├── refresh-token.dto.ts
            ├── reset-password.dto.ts
            ├── update-auth.dto.ts
        └── 📁guards
            ├── index.ts
            ├── jwt-auth.guard.ts
            ├── jwt-refresh.guard.ts
            ├── suspended.guard.ts
        └── 📁interfaces
            ├── google-profile.interface.ts
            ├── index.ts
            ├── jwt-payload.interface.ts
            ├── user-for-token.interface.dto.ts
        └── 📁services
            ├── auth.service.ts
            ├── index.ts
        └── 📁strategies
            ├── google.strategy.ts
            ├── index.ts
            ├── jwt-refresh.strategy.ts
            ├── jwt.strategy.ts
        ├── auth.module.ts
        ├── index.ts
    └── 📁common
        └── 📁constants
            ├── auth.constants.ts
            ├── index.ts
        └── 📁filters
            ├── http-exception.filter.ts
            ├── index.ts
        └── 📁services
            ├── index.ts
            ├── storage.service.ts
        └── 📁types
            ├── api.type.ts
            ├── index.ts
            ├── paigination.type.ts
        ├── common.module.ts
        ├── index.ts
    └── 📁database
        ├── database.module.ts
        ├── database.service.ts
        ├── index.ts
    └── 📁emails
        └── 📁dto
            ├── index.ts
            ├── send-email.dto.ts
        └── 📁processors
            ├── email.processor.ts
            ├── index.ts
        └── 📁services
            ├── emails.service.ts
            ├── index.ts
            ├── sendgrid-email.service.ts
        └── 📁templates
            ├── attendee-emails.template.ts
            ├── base.template.ts
            ├── host-emails.template.ts
            ├── index.ts
            ├── user-emails.template.ts
            ├── vendor-emails.template.ts
        ├── .DS_Store
        ├── emails.module.ts
        ├── index.ts
    └── 📁events
        └── 📁constants
            ├── events.constants.ts
            ├── index.ts
        └── 📁controllers
            ├── events.controller.ts
            ├── index.ts
        └── 📁dto
            ├── create-event.dto.ts
            ├── event-response.dto.ts
            ├── host-event-attendee.dto.ts
            ├── host-event-attendees-response.dto.ts
            ├── host-event-stats.dto.ts
            ├── index.ts
            ├── update-event.dto.ts
        └── 📁services
            ├── event.cron.service.ts
            ├── events.service.ts
            ├── index.ts
        └── 📁types
            ├── events.types.ts
            ├── index.ts
        ├── events.module.ts
        ├── index.ts
    └── 📁financials
        └── 📁services
            ├── financials.service.ts
            ├── index.ts
        ├── financials.module.ts
        ├── index.ts
    └── 📁notifications
        └── 📁controllers
            ├── index.ts
            ├── notifications.controller.ts
        └── 📁dto
            ├── index.ts
            ├── notifications-query.dto.ts
            ├── notifications-response.dto.ts
        └── 📁processors
            ├── index.ts
            ├── notifications.processor.ts
        └── 📁services
            ├── index.ts
            ├── notifications.service.ts
        ├── index.ts
        ├── notifications.module.ts
    └── 📁payments
        └── 📁controllers
            ├── index.ts
            ├── payments.controller.ts
        └── 📁dto
            ├── create-payment.dto.ts
            ├── index.ts
            ├── update-payment.dto.ts
        └── 📁entities
            ├── index.ts
            ├── payment.entity.ts
            ├── payments-bookings.entity.ts
        └── 📁services
            ├── index.ts
            ├── payments.cron.service.ts
            ├── payments.service.ts
            ├── stripe.service.ts
        ├── index.ts
        ├── payments.module.ts
    └── 📁spaces
        └── 📁controllers
            ├── index.ts
            ├── space-bookings.controller.ts
            ├── spaces.controller.ts
        └── 📁dto
            ├── block-days.dto.ts
            ├── calendar.dto.ts
            ├── create-booking.dto.ts
            ├── create-space.dto.ts
            ├── discover-spaces.dto.ts
            ├── find-space-query.dto.ts
            ├── index.ts
            ├── replace-space-files.dto.ts
            ├── space-public.dto.ts
            ├── space-response.dto.ts
            ├── update-booking-status.dto.ts
            ├── update-space.dto.ts
            ├── user-bookings.dto.ts
            ├── vendor-bookings.dto.ts
        └── 📁entities
            ├── booking.entity.ts
            ├── index.ts
            ├── space.entity.ts
            ├── vendor.entity.ts
        └── 📁services
            ├── index.ts
            ├── space-bookings.service.ts
            ├── space.cron.service.ts
            ├── spaces.service.ts
        ├── index.ts
        ├── spaces.module.ts
    └── 📁tests
        ├── days-blocked.sh
    └── 📁tickets
        └── 📁controllers
            ├── index.ts
            ├── tickets.controller.ts
        └── 📁dto
            ├── index.ts
            ├── purchase-ticket.dto.ts
            ├── ticket-response.dto.ts
        └── 📁entities
            ├── index.ts
            ├── ticket.entity.ts
        └── 📁processors
            ├── index.ts
            ├── refund.processor.ts
        └── 📁services
            ├── index.ts
            ├── ticket-pricing.service.ts
            ├── tickets.service.ts
        ├── index.ts
        ├── tickets.module.ts
    └── 📁users
        └── 📁controllers
            ├── index.ts
            ├── users.controller.ts
        └── 📁dto
            ├── attendee-response.dto.ts
            ├── create-host.dto.ts
            ├── create-vendor.dto.ts
            ├── host-response.dto.ts
            ├── index.ts
            ├── update-attendee.dto.ts
            ├── update-host.dto.ts
            ├── update-user-profile.dto.ts
            ├── update-vendor.dto.ts
            ├── user-response.dto.ts
            ├── vendor-response.dto.ts
        └── 📁guards
            ├── admin-profile.guard.ts
            ├── attendee-profile.guard.ts
            ├── host-profile.guard.ts
            ├── index.ts
            ├── vendor-profile.guard.ts
        └── 📁interfaces
            ├── index.ts
            ├── pfp-upload-response.interface.ts
        └── 📁services
            ├── index.ts
            ├── users.service.ts
        ├── index.ts
        ├── users.module.ts
    ├── app.controller.ts
    ├── app.module.ts
    └── main.ts
```
****