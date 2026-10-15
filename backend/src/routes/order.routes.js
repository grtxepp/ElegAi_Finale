import { Router } from 'express';
import { createOrder, listOrders, getOrder, cancelOrder } from '../controllers/order.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.get('/', listOrders);
router.post('/', createOrder);
router.post('/:id/cancel', cancelOrder);
router.get('/:id', getOrder);

export default router;
