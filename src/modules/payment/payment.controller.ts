import { Request, Response } from 'express';
import { catchAsync } from '../../middlewares/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { PaymentService } from './payment.service';

const createPaymentIntent = catchAsync(async (req: Request, res: Response) => {
  const customerId = req.user!.id;
  const { bookingId } = req.body;

  const result = await PaymentService.createPaymentIntent(customerId, bookingId);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Payment session/intent created successfully!',
    data: result,
  });
});

const confirmPayment = catchAsync(async (req: Request, res: Response) => {
  const result = await PaymentService.confirmPayment(req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Payment status processed successfully!',
    data: result,
  });
});

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
  createPaymentIntent,
  confirmPayment,
  getUserPayments,
  getPaymentById,
};