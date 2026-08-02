import { Router } from 'express';
import { auth } from '../../middlewares/auth';
import { ReviewController } from './review.controller';
import { Role } from '../../../generated/prisma/enums';

const router = Router();

// Create review (Customer only)
router.post(
  '/',
  auth(Role.CUSTOMER),
  ReviewController.createReview
);

export const reviewRoutes = router;