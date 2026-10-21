import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { listMyRequests } from '../controllers/lookRequest.controller.js';

const router = Router();

router.get('/', authenticate, listMyRequests);

export default router;
