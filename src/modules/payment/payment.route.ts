import express, { Router } from 'express';
import { PaymentController } from './payment.controller';
import { auth } from '../../middlewares/auth';
import { Role } from '../../../generated/prisma/enums';

const router = Router();

// Create Checkout Session
router.post(
  '/create',
  auth(Role.CUSTOMER),
  PaymentController.createCheckoutSession
);

// Stripe Webhook listener (Requires raw body for signature verification)
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  PaymentController.handleStripeWebhook
);

// History routes
router.get(
  '/',
  auth(Role.CUSTOMER, Role.TECHNICIAN, Role.ADMIN),
  PaymentController.getUserPayments
);

router.get(
  '/:id',
  auth(Role.CUSTOMER, Role.TECHNICIAN, Role.ADMIN),
  PaymentController.getPaymentById
);

export const PaymentRoutes = router;