import { Request, Response } from 'express';
import { catchAsync } from '../../middlewares/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { PaymentService } from './payment.service';

const createCheckoutSession = catchAsync(async (req: Request, res: Response) => {
  const customerId = req.user!.id;
  const { bookingId } = req.body;

  const result = await PaymentService.createCheckoutSession(customerId, bookingId);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Stripe Checkout Session created successfully!',
    data: result,
  });
});

const handleStripeWebhook = async (req: Request, res: Response) => {
  const signature = req.headers['stripe-signature'] as string;

  try {
    // Pass raw body (req.body as Buffer) to verify signature
    await PaymentService.handleStripeWebhook(req.body, signature);
    res.status(200).json({ received: true });
  } catch (error: any) {
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
};

const getUserPayments = catchAsync(async (req: Request, res: Response) => {
  const user = req.user!;
  const result = await PaymentService.getUserPayments(user.id, user.role);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Payment history retrieved successfully!',
    data: result,
  });
});

const getPaymentById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = req.user!;
  const result = await PaymentService.getPaymentById(id as string, user.id, user.role);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Payment details retrieved successfully!',
    data: result,
  });
});

export const PaymentController = {
  createCheckoutSession,
  handleStripeWebhook,
  getUserPayments,
  getPaymentById,
};