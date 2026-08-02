import { Request, Response } from 'express';
import { catchAsync } from '../../middlewares/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { AdminService } from './admin.service';

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminService.getAllUsers(req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Users retrieved successfully!',
    data: result,
  });
});

const updateUserStatus = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  
  const result = await AdminService.updateUserStatus(id as string, status);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: `User status successfully updated to ${status}!`,
    data: result,
  });
});

const getAllBookings = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminService.getAllBookings(req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'All platform bookings retrieved successfully!',
    data: result,
  });
});

const getAllCategories = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminService.getAllCategories();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Categories retrieved successfully!',
    data: result,
  });
});

const createCategory = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminService.createCategory(req.body);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Service category created successfully!',
    data: result,
  });
});

export const AdminController = {
  getAllUsers,
  updateUserStatus,
  getAllBookings,
  getAllCategories,
  createCategory,
};