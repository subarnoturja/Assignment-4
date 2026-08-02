import Stripe from 'stripe';
import { prisma } from '../../lib/prisma';
import { PaymentStatus, Role } from '../../../generated/prisma/enums';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2023-10-16' as any,
});

// 1. Create Payment Intent/Session
const createPaymentIntent = async (customerId: string, bookingId: string) => {
  if (!bookingId) {
    throw new Error('bookingId is required!');
  }

  // Retrieve booking along with service details
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      payment: true,
      service: true,
    },
  });

  if (!booking) {
    throw new Error('Booking not found!');
  }

  if (booking.customerId !== customerId) {
    throw new Error('Unauthorized action on this booking!');
  }

  // Booking must be accepted by technician before payment
  if (booking.status !== BookingStatus.ACCEPTED) {
    throw new Error('Payment can only be processed for ACCEPTED bookings!');
  }

  // Return existing intent if already initiated and unpaid
  if (booking.payment && booking.payment.status === PaymentStatus.PAID) {
    throw new Error('This booking has already been paid for!');
  }

  const amountInCents = Math.round(booking.totalAmount * 100);

  // Create Stripe PaymentIntent
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountInCents,
    currency: 'usd',
    metadata: {
      bookingId: booking.id,
      customerId: customerId,
    },
  });

  // Save or update payment record in DB
  const paymentRecord = await prisma.payment.upsert({
    where: { bookingId: booking.id },
    update: {
      transactionId: paymentIntent.id,
      status: PaymentStatus.PENDING,
      amount: booking.totalAmount,
    },
    create: {
      bookingId: booking.id,
      transactionId: paymentIntent.id,
      amount: booking.totalAmount,
      status: PaymentStatus.PENDING,
    },
  });

  return {
    clientSecret: paymentIntent.client_secret,
    payment: paymentRecord,
  };
};

// 2. Confirm / Verify Payment Callback (Webhook or Manual Trigger)
const confirmPayment = async (payload: { transactionId: string; status?: string }) => {
  const { transactionId } = payload;

  if (!transactionId) {
    throw new Error('transactionId is required!');
  }

  const paymentRecord = await prisma.payment.findUnique({
    where: { transactionId },
    include: { booking: true },
  });

  if (!paymentRecord) {
    throw new Error('Payment transaction record not found!');
  }

  // Retrieve latest status directly from Stripe
  const paymentIntent = await stripe.paymentIntents.retrieve(transactionId);

  let updatedStatus: PaymentStatus = PaymentStatus.PENDING;

  if (paymentIntent.status === 'succeeded') {
    updatedStatus = PaymentStatus.PAID;
  } else if (paymentIntent.status === 'canceled') {
    updatedStatus = PaymentStatus.FAILED;
  }

  // Atomic update for Payment status
  const updatedPayment = await prisma.payment.update({
    where: { transactionId },
    data: {
      status: updatedStatus,
    },
    include: {
      booking: true,
    },
  });

  return updatedPayment;
};

// 3. Get User's Payment History
const getUserPayments = async (userId: string, role: Role) => {
  let whereCondition: any = {};

  if (role === Role.CUSTOMER) {
    whereCondition = {
      booking: { customerId: userId },
    };
  } else if (role === Role.TECHNICIAN) {
    const techProfile = await prisma.technicianProfile.findUnique({
      where: { userId },
    });

    if (!techProfile) {
      throw new Error('Technician profile not found!');
    }

    whereCondition = {
      booking: { technicianProfileId: techProfile.id },
    };
  }
  // Admin role retrieves all payments without restrictions

  const payments = await prisma.payment.findMany({
    where: whereCondition,
    include: {
      booking: {
        include: {
          service: true,
          customer: {
            select: { id: true, name: true, email: true },
          },
          technicianProfile: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return payments;
};

// 4. Get Payment Details by ID
const getPaymentById = async (paymentId: string, userId: string, role: Role) => {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      booking: {
        include: {
          service: true,
          customer: {
            select: { id: true, name: true, email: true },
          },
          technicianProfile: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
        },
      },
    },
  });

  if (!payment) {
    throw new Error('Payment record not found!');
  }

  // Access validation
  if (role === Role.CUSTOMER && payment.booking.customerId !== userId) {
    throw new Error('Unauthorized access to this payment record!');
  }

  if (role === Role.TECHNICIAN) {
    const techProfile = await prisma.technicianProfile.findUnique({
      where: { userId },
    });
    if (!techProfile || payment.booking.technicianProfileId !== techProfile.id) {
      throw new Error('Unauthorized access to this payment record!');
    }
  }

  return payment;
};

export const PaymentService = {
  createPaymentIntent,
  confirmPayment,
  getUserPayments,
  getPaymentById,
};