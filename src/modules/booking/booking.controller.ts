import { Request, Response } from 'express';
import { catchAsync } from '../../middlewares/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { BookingService } from './booking.service';

const createBooking = catchAsync(async (req: Request, res: Response) => {
  const customerId = req.user!.id;
  const result = await BookingService.createBooking(customerId, req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Booking created successfully!',
    data: result,
  });
});

const getUserBookings = catchAsync(async (req: Request, res: Response) => {
  const user = req.user!;
  const result = await BookingService.getUserBookings(user.id, user.role);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Bookings retrieved successfully!',
    data: result,
  });
});

const getBookingById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = req.user!;
  const result = await BookingService.getBookingById(id as string, user.id, user.role);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Booking details retrieved successfully!',
    data: result,
  });
});

export const BookingController = {
  createBooking,
  getUserBookings,
  getBookingById,
};