import { Request, Response } from 'express';
import { catchAsync } from '../../middlewares/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { ServiceService } from './service.service';

const getAllServices = catchAsync(async (req: Request, res: Response) => {
  const result = await ServiceService.getAllServices(req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Services retrieved successfully!',
    data: result,
  });
});

export const ServiceController = {
  getAllServices,
};