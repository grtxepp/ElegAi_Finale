import crypto from 'crypto';
import { asyncHandler } from '../utils/asyncHandler.js';
import { badRequest, notFound } from '../utils/apiError.js';
import { requireFields } from '../utils/validators.js';
import { parseProduct } from '../utils/serialize.js';
import { CATEGORIES, ORDER_STATUSES } from '../config/env.js';
import {
  getDashboardData,
  searchAllProducts,
  insertProduct,
  findProductById,
  saveProduct,
  deleteProductAndCartRows,
  setProductStock,
  listOrdersForAdmin,
  setOrderStatus,
  searchCustomers,
  findCustomerById,
} from '../repositories/admin.repository.js';
import {
  createPasswordResetToken,
  invalidatePasswordResetTokens,
} from '../repositories/auth.repository.js';

/** Admin endpoints are mounted behind authenticate + authorize('admin'). */

export const getStats = asyncHandler(async (_req, res) => {
  const data = await getDashboardData();
  res.json({
    ...data,
    revenue: Number(data.revenue),
    recentOrders: data.recentOrders.map((row) => ({ ...row, total_amount: Number(row.total_amount) })),
    revenueByDay: data.revenueByDay.map((row) => ({ day: row.day, total: Number(row.total) })),
    topProducts: data.topProducts.map((row) => ({ ...row, product_revenue: Number(row.product_revenue) })),
  });
});

export const listAllProducts = asyncHandler(async (req, res) => {
  const rows = await searchAllProducts({ q: req.query.q, category: req.query.category });
  res.json({ items: rows.map(parseProduct) });
});

export const createProduct = asyncHandler(async (req, res) => {
  const { name, description, price, category, color, availableSizes, stock } = req.body;
  requireFields(req.body, ['name', 'price', 'category', 'color', 'availableSizes']);
  if (!CATEGORIES.includes(category)) throw badRequest('Invalid category.');
  const priceNum = Number(price);
  if (!Number.isFinite(priceNum) || priceNum < 0) {
    throw badRequest('Price must be a valid non-negative number.');
  }

  let sizes = availableSizes;
  if (typeof sizes === 'string') {
    try { sizes = JSON.parse(sizes); }
    catch { throw badRequest('Available sizes must be valid JSON.'); }
  }
  if (!Array.isArray(sizes) || !sizes.length) {
    throw badRequest('Select at least one available size.');
  }

  const imageUrl = req.file ? `/uploads/${req.file.filename}` : req.body.imageUrl || '';
  const productId = await insertProduct({
    name: String(name).trim(),
    description: description || '',
    price: priceNum,
    category,
    color: String(color).trim(),
    availableSizes: sizes,
    stock: Number(stock) || 0,
    imageUrl,
  });
  res.status(201).json({ message: 'Product created.', productId });
});

export const updateProduct = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const current = await findProductById(id);
  if (!current) throw notFound('Product not found.');

  const { name, description, price, category, color, availableSizes, stock } = req.body;
  if (category !== undefined && !CATEGORIES.includes(category)) throw badRequest('Invalid category.');

  let sizes = current.available_sizes;
  if (availableSizes !== undefined) {
    if (typeof availableSizes === 'string') {
      try { sizes = JSON.stringify(JSON.parse(availableSizes)); }
      catch { throw badRequest('Available sizes must be valid JSON.'); }
    } else if (Array.isArray(availableSizes)) {
      sizes = JSON.stringify(availableSizes);
    }
  }

  const imageUrl = req.file
    ? `/uploads/${req.file.filename}`
    : req.body.imageUrl !== undefined
      ? req.body.imageUrl
      : current.image_url;

  await saveProduct(id, {
    name: name !== undefined ? String(name).trim() : current.name,
    description: description !== undefined ? description : current.description,
    price: price !== undefined ? Number(price) : Number(current.price),
    category: category !== undefined ? category : current.category,
    color: color !== undefined ? String(color).trim() : current.color,
    availableSizes: sizes,
    stock: stock !== undefined ? Number(stock) : current.stock,
    imageUrl,
  });
  res.json({ message: 'Product updated.' });
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  try {
    const result = await deleteProductAndCartRows(id);
    if (!result.affectedRows) throw notFound('Product not found.');
    res.json({ message: 'Product deleted.' });
  } catch (error) {
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      throw badRequest('This product has order history and cannot be deleted. Set its stock to 0 instead.');
    }
    throw error;
  }
});

export const updateInventory = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const { stock, delta } = req.body;
  let update;
  if (stock !== undefined) {
    const value = Number(stock);
    if (!Number.isInteger(value) || value < 0) throw badRequest('Stock must be a non-negative whole number.');
    update = { stock: value };
  } else if (delta !== undefined) {
    const value = Number(delta);
    if (!Number.isInteger(value)) throw badRequest('Delta must be a whole number.');
    update = { delta: value };
  } else {
    throw badRequest('Provide either "stock" or "delta".');
  }

  const product = await setProductStock(id, update);
  if (!product) throw notFound('Product not found.');
  res.json({ message: 'Inventory updated.', product: parseProduct(product) });
});

export const listAllOrders = asyncHandler(async (req, res) => {
  const rows = await listOrdersForAdmin(req.query.status);
  res.json({ orders: rows.map((row) => ({ ...row, total_amount: Number(row.total_amount) })) });
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body;
  requireFields(req.body, ['status']);
  if (!ORDER_STATUSES.includes(status)) {
    throw badRequest(`Status must be one of: ${ORDER_STATUSES.join(', ')}.`);
  }
  if (!(await setOrderStatus(id, status))) throw notFound('Order not found.');
  res.json({ message: `Order #${id} marked as ${status}.` });
});

export const listCustomers = asyncHandler(async (req, res) => {
  const rows = await searchCustomers(req.query.q);
  res.json({ customers: rows.map((row) => ({ ...row, total_spent: Number(row.total_spent) })) });
});

/**
 * Issue a one-time password-reset code for a customer without sending email.
 * The administrator shares the code directly; it expires in 15 minutes.
 */
export const issueCustomerResetCode = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) throw badRequest('Invalid customer id.');

  const customer = await findCustomerById(id);
  if (!customer) throw notFound('Customer not found.');

  const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
  const codeHash = crypto.createHash('sha256').update(`${customer.user_id}:${code}`).digest('hex');
  await invalidatePasswordResetTokens(customer.user_id);
  await createPasswordResetToken(customer.user_id, codeHash);

  res.json({
    message: `Reset code generated for ${customer.name}. Share it with the customer.`,
    code,
    expiresInMinutes: 15,
  });
});
