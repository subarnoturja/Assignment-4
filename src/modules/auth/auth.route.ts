import { Router } from 'express';
import { AuthController } from './auth.controller';
import { auth } from '../../middlewares/auth';
import { Role } from '../../../prisma/generated/prisma/enums';

const router = Router();

router.post('/register', AuthController.registerUser);
router.post('/login', AuthController.loginUser);
router.get('/me', auth(Role.CUSTOMER, Role.TECHNICIAN, Role.ADMIN), AuthController.getMe);

export const authRoutes = router;