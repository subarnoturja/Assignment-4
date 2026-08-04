import { Router } from 'express';
import { auth } from '../../middlewares/auth';
import { Role } from '../../../prisma/generated/prisma/enums';
import { AdminController } from './admin.controller';

const router = Router();

// Protect ALL admin routes under the ADMIN role
router.use(auth(Role.ADMIN));

// User Management
router.get('/users', AdminController.getAllUsers);
router.patch('/users/:id', AdminController.updateUserStatus);

// Booking Management
router.get('/bookings', AdminController.getAllBookings);

// Category Management
router.get('/categories', AdminController.getAllCategories);
router.post('/categories', AdminController.createCategory);

export const adminRoutes = router;