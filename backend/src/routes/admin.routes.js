import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { uploadDisk } from '../middleware/upload.js';
import {
  getStats,
  listAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  updateInventory,
  listAllOrders,
  updateOrderStatus,
  listCustomers,
  issueCustomerResetCode,
} from '../controllers/admin.controller.js';
import { listRequests, updateRequestStatus } from '../controllers/lookRequest.controller.js';

const router = Router();

// All admin routes require an authenticated administrator.
router.use(authenticate, authorize('admin'));

router.get('/stats', getStats);

router.get('/products', listAllProducts);
router.post('/products', uploadDisk.single('image'), createProduct);
router.put('/products/:id', uploadDisk.single('image'), updateProduct);
router.delete('/products/:id', deleteProduct);

router.put('/inventory/:id', updateInventory);

router.get('/orders', listAllOrders);
router.put('/orders/:id/status', updateOrderStatus);

router.get('/customers', listCustomers);
router.post('/customers/:id/reset-code', issueCustomerResetCode);

router.get('/look-requests', listRequests);
router.put('/look-requests/:id', updateRequestStatus);
router.put('/look-requests/:id/status', updateRequestStatus);

export default router;
