import express, { Router } from 'express';
import { PaymentController } from './payment.controller';
import { auth } from '../../middlewares/auth';
import { Role } from '../../../prisma/generated/prisma/enums';

const router = Router();

router.post(
  '/create',
  auth(Role.CUSTOMER),
  PaymentController.createCheckoutSession
);

router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  PaymentController.handleStripeWebhook
);

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