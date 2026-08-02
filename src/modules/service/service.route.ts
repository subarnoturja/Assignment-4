import { Router } from 'express';
import { ServiceController } from './service.controller';

const router = Router();

router.get('/', ServiceController.getAllServices);

export const ServiceRoutes = router;