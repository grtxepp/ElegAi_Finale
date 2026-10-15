import { Router } from 'express';
import { getCart, addItem, updateItem, removeItem } from '../controllers/cart.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.get('/', getCart);
router.post('/', addItem);
router.patch('/:cartId', updateItem);
router.delete('/:cartId', removeItem);

export default router;
