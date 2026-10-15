import { Router } from 'express';
import { listProducts, getProduct, getMeta } from '../controllers/product.controller.js';

const router = Router();

router.get('/', listProducts);
router.get('/meta', getMeta);
router.get('/:id', getProduct);

export default router;
