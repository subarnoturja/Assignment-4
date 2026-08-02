import { Request, Response } from 'express';
import { catchAsync } from '../../middlewares/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { TechnicianService } from './technician.service';

const getAllTechnicians = catchAsync(async (req: Request, res: Response) => {
  const result = await TechnicianService.getAllTechnicians(req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Technicians retrieved successfully!',
    data: result,
  });
});

const getTechnicianById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await TechnicianService.getTechnicianById(id as string);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Technician profile retrieved successfully!',
    data: result,
  });
});

const updateProfile = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const result = await TechnicianService.updateProfile(userId, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Profile updated successfully!',
    data: result,
  });
});

const updateAvailability = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const result = await TechnicianService.updateAvailability(userId, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Availability updated successfully!',
    data: result,
  });
});

const getTechnicianBookings = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const result = await TechnicianService.getTechnicianBookings(userId, req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Technician bookings retrieved successfully!',
    data: result,
  });
});

const updateBookingStatus = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { id: bookingId } = req.params;
  const { status } = req.body;

  const result = await TechnicianService.updateBookingStatus(userId, bookingId as string, status);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: `Booking status updated to ${status}!`,
    data: result,
  });
  }
)

export const TechnicianController = {
  getAllTechnicians,
  getTechnicianById,
  updateProfile,
  updateAvailability,
  getTechnicianBookings,
  updateBookingStatus,
};