import { PrismaClient, NotificationType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const vendorUserId = 'cmlnqt8rp00000wplhnx0zt1p';
  const hostUserId = 'cmlnqybxf000r0wf27384m23k';
  const attendeeUserId = 'cmlnqydvs000u0wf2ty5xp6hq';
  const adminUserId = 'riti_admin';

  // Vendor – booking + space notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: vendorUserId,
        type: NotificationType.NEW_BOOKING_REQUEST,
        title: 'New booking request',
        message: 'You have a new booking request for “Downtown Studio”.',
        read: false,
        meta: {
          bookingId: 'bk_seed_1',
          spaceId: 'space_seed_vendor_1',
          startTime: new Date().toISOString(),
        },
      },
      {
        userId: vendorUserId,
        type: NotificationType.SPACE_APPROVED,
        title: 'Space approved',
        message: 'Your space “Downtown Studio” is now live and bookable.',
        read: false,
        meta: {
          spaceId: 'space_seed_vendor_1',
        },
      },
      {
        userId: vendorUserId,
        type: NotificationType.SPACE_SUSPENDED,
        title: 'Space temporarily suspended',
        message: '“Downtown Studio” has been suspended due to a policy review.',
        read: true,
        meta: {
          spaceId: 'space_seed_vendor_1',
          reason: 'Missing safety information',
        },
      },
    ],
  });

  // Host – ticket + payout + Stripe
  await prisma.notification.createMany({
    data: [
      {
        userId: hostUserId,
        type: NotificationType.TICKET_SOLD,
        title: 'Ticket sold',
        message: 'You sold 1 ticket for “FULL TEST EVENT”.',
        read: false,
        meta: {
          eventId: 'event_seed_1',
          quantity: 1,
        },
      },
      {
        userId: hostUserId,
        type: NotificationType.EVENT_SOLD_OUT,
        title: 'Event sold out',
        message: 'Your event “FULL TEST EVENT” is now sold out.',
        read: false,
        meta: {
          eventId: 'event_seed_1',
        },
      },
      {
        userId: hostUserId,
        type: NotificationType.PAYOUT_SCHEDULED,
        title: 'Payout scheduled',
        message: 'A payout of NOK 1,200 is scheduled for tomorrow.',
        read: true,
        meta: {
          amount: 1200,
          currency: 'NOK',
          payoutDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
      },
      {
        userId: hostUserId,
        type: NotificationType.STRIPE_CONNECTION_REMINDER,
        title: 'Connect Stripe to get paid',
        message: 'Connect your Stripe account to start receiving payouts.',
        read: false,
        meta: {
          cta: 'connect_stripe',
        },
      },
    ],
  });

  // Attendee – bookings + tickets
  await prisma.notification.createMany({
    data: [
      {
        userId: attendeeUserId,
        type: NotificationType.BOOKING_APPROVED,
        title: 'Booking approved',
        message: 'Your booking for “Downtown Studio” was approved.',
        read: false,
        meta: {
          bookingId: 'bk_seed_2',
          spaceId: 'space_seed_vendor_1',
          startTime: new Date().toISOString(),
        },
      },
      {
        userId: attendeeUserId,
        type: NotificationType.BOOKING_REJECTED,
        title: 'Booking rejected',
        message: 'Your booking request for “Conference Room” was rejected.',
        read: true,
        meta: {
          bookingId: 'bk_seed_3',
          spaceId: 'space_seed_vendor_2',
        },
      },
      {
        userId: attendeeUserId,
        type: NotificationType.TICKET_CONFIRMED,
        title: 'Ticket confirmed',
        message: 'Your ticket for “FULL TEST EVENT” is confirmed.',
        read: false,
        meta: {
          ticketId: 'ticket_seed_1',
          eventId: 'event_seed_1',
        },
      },
      {
        userId: attendeeUserId,
        type: NotificationType.EVENT_CANCELLED,
        title: 'Event cancelled',
        message: '“FULL TEST EVENT” has been cancelled. A refund will be processed.',
        read: false,
        meta: {
          eventId: 'event_seed_1',
        },
      },
      {
        userId: attendeeUserId,
        type: NotificationType.REFUND_PROCESSED,
        title: 'Refund processed',
        message: 'Your refund for “FULL TEST EVENT” has been processed.',
        read: true,
        meta: {
          eventId: 'event_seed_1',
          amount: 300,
          currency: 'NOK',
        },
      },
    ],
  });

  // Admin – admin/system notices, seed as generic inbox
  await prisma.notification.createMany({
    data: [
      {
        userId: adminUserId,
        type: NotificationType.ADMIN_NOTICE,
        title: 'High booking volume',
        message: 'Bookings have spiked by 40% in the last 24 hours.',
        read: false,
        meta: {
          metric: 'bookings',
          increasePercent: 40,
        },
      },
      {
        userId: adminUserId,
        type: NotificationType.ADMIN_NOTICE,
        title: 'New spaces awaiting review',
        message: '3 new spaces are pending admin review.',
        read: false,
        meta: {
          pendingSpaces: 3,
        },
      },
      {
        userId: adminUserId,
        type: NotificationType.ONBOARDING_REMINDER,
        title: 'Vendor onboarding reminders',
        message: '5 vendors have not completed onboarding.',
        read: true,
        meta: {
          pendingVendors: 5,
        },
      },
    ],
  });

  console.log('Seeded notifications for vendor, host, attendee, admin');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
