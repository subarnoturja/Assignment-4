import { Router } from 'express';
import { TechnicianController } from './technician.controller';
import { auth } from '../../middlewares/auth';
import { Role } from '../../../prisma/generated/prisma/enums';

const router = Router();

router.get('/', TechnicianController.getAllTechnicians);
router.get('/:id', TechnicianController.getTechnicianById);
router.put(
  '/profile',
  auth(Role.TECHNICIAN),
  TechnicianController.updateProfile
);

router.put(
  '/availability',
  auth(Role.TECHNICIAN),
  TechnicianController.updateAvailability
);

router.get(
  '/bookings',
  auth(Role.TECHNICIAN),
  TechnicianController.getTechnicianBookings
);

router.patch(
  '/bookings/:id',
  auth(Role.TECHNICIAN),
  TechnicianController.updateBookingStatus
);

export const technicianRoutes = router;