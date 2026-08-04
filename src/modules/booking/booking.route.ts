import { Router } from 'express';
import { auth } from '../../middlewares/auth';
import { Role } from '../../../prisma/generated/prisma/enums';
import { BookingController } from './booking.controller';

const router = Router();

// Create new booking (Customer only)
router.post(
  '/',
  auth(Role.CUSTOMER),
  BookingController.createBooking
);

// Get user's bookings (Customer or Technician)
router.get(
  '/',
  auth(Role.CUSTOMER, Role.TECHNICIAN, Role.ADMIN),
  BookingController.getUserBookings
);

// Get booking details by ID
router.get(
  '/:id',
  auth(Role.CUSTOMER, Role.TECHNICIAN, Role.ADMIN),
  BookingController.getBookingById
);

export const bookingRoutes = router;