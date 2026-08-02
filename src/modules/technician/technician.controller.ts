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

export const TechnicianController = {
  getAllTechnicians,
  getTechnicianById,
};