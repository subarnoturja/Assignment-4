import { Router } from 'express';
import { auth } from '../../middlewares/auth';
import { Role } from '../../../generated/prisma/enums';
import { PaymentController } from './payment.controller';

const router = Router();

// Create Payment Session / Intent (Customer only)
router.post(
  '/create',
  auth(Role.CUSTOMER),
  PaymentController.createPaymentIntent
);

// Verify/Confirm Payment (Webhook / Manual Callback Verification)
// Note: Webhooks usually run unauthenticated or using raw body verification
router.post(
  '/confirm',
  PaymentController.confirmPayment
);

// Get User Payment History (Customer, Technician, or Admin)
router.get(
  '/',
  auth(Role.CUSTOMER, Role.TECHNICIAN, Role.ADMIN),
  PaymentController.getUserPayments
);

// Get Specific Payment Details
router.get(
  '/:id',
  auth(Role.CUSTOMER, Role.TECHNICIAN, Role.ADMIN),
  PaymentController.getPaymentById
);

export const PaymentRoutes = router;