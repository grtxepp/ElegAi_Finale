import { asyncHandler } from '../utils/asyncHandler.js';
import { badRequest, notFound } from '../utils/apiError.js';
import { requireFields } from '../utils/validators.js';
import { safeJson } from '../utils/serialize.js';
import {
  placeOrderFromCart,
  listCustomerOrders,
  findCustomerOrder,
  listOrderItems,
  cancelCustomerOrder,
} from '../repositories/order.repository.js';

const PAYMENT_METHODS = ['Cash on Delivery', 'GCash', 'Card'];

/** POST /api/orders — validate checkout input, then delegate atomic persistence. */
export const createOrder = asyncHandler(async (req, res) => {
  requireFields(req.body, ['shippingAddress', 'paymentMethod']);
  const { shippingAddress, paymentMethod, notes } = req.body;
  if (
    !shippingAddress ||
    typeof shippingAddress !== 'object' ||
    !shippingAddress.line1 ||
    !shippingAddress.city ||
    !shippingAddress.province
  ) {
    throw badRequest('Please provide a complete shipping address (line1, city, province).');
  }
  if (!PAYMENT_METHODS.includes(paymentMethod)) {
    throw badRequest(`Payment method must be one of: ${PAYMENT_METHODS.join(', ')}.`);
  }

  const result = await placeOrderFromCart({
    userId: req.user.userId,
    shippingAddress,
    paymentMethod,
    notes,
  });
  if (result.error === 'empty-cart') throw badRequest('Your cart is empty.');
  if (result.error === 'insufficient-stock') {
    throw badRequest(`Insufficient stock for "${result.productName}". Please adjust your cart.`);
  }

  res.status(201).json({
    orderId: result.orderId,
    totalAmount: result.totalAmount,
    status: 'Pending',
    message: 'Order placed successfully.',
  });
});

/** GET /api/orders — customer order history. */
export const listOrders = asyncHandler(async (req, res) => {
  const rows = await listCustomerOrders(req.user.userId);
  res.json({
    orders: rows.map((row) => ({
      ...row,
      total_amount: Number(row.total_amount),
      shipping_address: safeJson(row.shipping_address, {}),
    })),
  });
});

/** GET /api/orders/:id — order detail with line items. */
export const getOrder = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const order = await findCustomerOrder(id, req.user.userId);
  if (!order) throw notFound('Order not found.');
  const items = await listOrderItems(id);
  res.json({
    order: {
      ...order,
      total_amount: Number(order.total_amount),
      shipping_address: safeJson(order.shipping_address, {}),
      items: items.map((item) => ({ ...item, price: Number(item.price) })),
    },
  });
});

/** POST /api/orders/:id/cancel — atomically cancel a pending order and restock. */
export const cancelOrder = asyncHandler(async (req, res) => {
  const result = await cancelCustomerOrder({
    orderId: Number(req.params.id),
    userId: req.user.userId,
  });
  if (result.state === 'not-found') throw notFound('Order not found.');
  if (result.state === 'not-pending') throw badRequest('Only pending orders can be cancelled.');
  res.json({ message: 'Order cancelled and items restocked.' });
});
