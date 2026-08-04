import Stripe from 'stripe';
import { prisma } from '../../lib/prisma';
import { BookingStatus, PaymentProvider, PaymentStatus, Role } from '../../../prisma/generated/prisma/enums';
import config from '../../config';

const stripe = new Stripe(config.stripe_secret_key, {
  apiVersion: '2023-10-16' as any,
});

// 1. Create Stripe Checkout Session
const createCheckoutSession = async (customerId: string, bookingId: string) => {
  if (!bookingId) {
    throw new Error('bookingId is required!');
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      service: true,
      payment: true,
    },
  });

  if (!booking) {
    throw new Error('Booking not found!');
  }

  if (booking.customerId !== customerId) {
    throw new Error('Unauthorized action on this booking!');
  }

  if (booking.status !== BookingStatus.ACCEPTED) {
    throw new Error('Payment can only be made for ACCEPTED bookings!');
  }

  if (booking.payment && booking.payment.status === PaymentStatus.COMPLETED) {
    throw new Error('This booking is already paid!');
  }

  // Create Stripe Checkout Session
  const customerEmail = await reqUserEmail(customerId);

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    customer_email: customerEmail || undefined, // optional: add customer email
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: booking.service.title,
            description: `Booking for service ID: ${booking.serviceId}`,
          },
          unit_amount: Math.round(booking.totalAmount * 100), // cents
        },
        quantity: 1,
      },
    ],
    metadata: {
      bookingId: booking.id,
      customerId: customerId,
    },
    success_url: `${process.env.CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.CLIENT_URL}/payment/cancel`,
  });

  // Upsert initial PENDING payment record linked to the Stripe Session ID
  const paymentRecord = await prisma.payment.upsert({
  where: { bookingId: booking.id },
  update: {
    transactionId: session.id,
    status: PaymentStatus.PENDING,
    amount: booking.totalAmount,
  },
  create: {
    booking: { connect: { id: booking.id } }, // Connect relation directly if scalar fails
    transactionId: session.id,
    amount: booking.totalAmount,
    provider: PaymentProvider.STRIPE,
    status: PaymentStatus.PENDING,
  },
});

  return {
    checkoutUrl: session.url,
    sessionId: session.id,
    payment: paymentRecord,
  };
};

// Helper to grab customer email if needed
const reqUserEmail = async (userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  return user?.email;
};

// 2. Stripe Webhook Event Handler
const handleStripeWebhook = async (rawBody: Buffer, signature: string) => {
  const webhookSecret = config.stripe_webhook_secret;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err: any) {
    throw new Error(`Webhook Signature Verification Failed: ${err.message}`);
  }

  // Process checkout session completion
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const bookingId = session.metadata?.bookingId;

    if (bookingId) {
      await prisma.$transaction([
        // Update payment to PAID
        prisma.payment.update({
          where: { bookingId },
          data: {
            status: PaymentStatus.COMPLETED,
            transactionId: session.payment_intent as string || session.id,
          },
        }),
      ]);
    }
  }

  // Handle failed/expired payment attempts
  if (event.type === 'checkout.session.expired' || event.type === 'payment_intent.payment_failed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const bookingId = session.metadata?.bookingId;

    if (bookingId) {
      await prisma.payment.updateMany({
        where: { bookingId },
        data: { status: PaymentStatus.FAILED },
      });
    }
  }

  return true;
};

// 3. Get User Payments History
const getUserPayments = async (userId: string, role: Role) => {
  let whereCondition: any = {};

  if (role === Role.CUSTOMER) {
    whereCondition = { booking: { customerId: userId } };
  } else if (role === Role.TECHNICIAN) {
    const techProfile = await prisma.technicianProfile.findUnique({
      where: { userId },
    });
    if (!techProfile) throw new Error('Technician profile not found!');
    whereCondition = { booking: { technicianProfileId: techProfile.id } };
  }

  return await prisma.payment.findMany({
    where: whereCondition,
    include: {
      booking: {
        include: {
          service: true,
          customer: { select: { id: true, name: true, email: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
};

// 4. Get Payment Details By ID
const getPaymentById = async (paymentId: string, userId: string, role: Role) => {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      booking: {
        include: {
          service: true,
          customer: { select: { id: true, name: true, email: true } },
          technicianProfile: {
            include: { user: { select: { id: true, name: true, email: true } } },
          },
        },
      },
    },
  });

  if (!payment) throw new Error('Payment record not found!');

  if (role === Role.CUSTOMER && payment.booking.customerId !== userId) {
    throw new Error('Unauthorized access!');
  }

  return payment;
};

export const PaymentService = {
  createCheckoutSession,
  handleStripeWebhook,
  getUserPayments,
  getPaymentById,
};