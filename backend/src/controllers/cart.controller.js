import { asyncHandler } from '../utils/asyncHandler.js';
import { badRequest, notFound } from '../utils/apiError.js';
import { requireFields } from '../utils/validators.js';
import { parseProduct } from '../utils/serialize.js';
import {
  getCartRows,
  findProductStock,
  addCartItem,
  findCartItem,
  updateCartItemQuantity,
  deleteCartItem,
} from '../repositories/cart.repository.js';

/** GET /api/cart — the signed-in customer's cart with product details. */
export const getCart = asyncHandler(async (req, res) => {
  const rows = await getCartRows(req.user.userId);
  const items = rows.map((row) => {
    const price = Number(row.price);
    return {
      cartId: row.cart_id,
      quantity: row.quantity,
      product: parseProduct(row),
      lineTotal: price * row.quantity,
    };
  });
  res.json({
    items,
    count: items.reduce((sum, item) => sum + item.quantity, 0),
    total: items.reduce((sum, item) => sum + item.lineTotal, 0),
  });
});

/** POST /api/cart — add a product (merge quantity if already in cart). */
export const addItem = asyncHandler(async (req, res) => {
  requireFields(req.body, ['productId', 'quantity']);
  const productId = Number(req.body.productId);
  const quantity = Number(req.body.quantity);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
    throw badRequest('Quantity must be between 1 and 99.');
  }

  const product = await findProductStock(productId);
  if (!product) throw notFound('Product not found.');
  if (quantity > product.stock) throw badRequest(`Only ${product.stock} in stock.`);
  await addCartItem(req.user.userId, productId, quantity, product.stock);
  res.status(201).json({ message: 'Added to cart.' });
});

/** PATCH /api/cart/:cartId — change quantity (0 removes the line). */
export const updateItem = asyncHandler(async (req, res) => {
  const cartId = Number(req.params.cartId);
  const quantity = Number(req.body.quantity);
  if (!Number.isInteger(quantity) || quantity < 0 || quantity > 99) {
    throw badRequest('Quantity must be between 0 and 99.');
  }

  const item = await findCartItem(cartId, req.user.userId);
  if (!item) throw notFound('Cart item not found.');
  if (quantity === 0) {
    await deleteCartItem(cartId, req.user.userId);
  } else {
    const product = await findProductStock(item.product_id);
    if (!product) throw notFound('Product not found.');
    if (quantity > product.stock) throw badRequest(`Only ${product.stock} in stock.`);
    await updateCartItemQuantity(cartId, req.user.userId, quantity);
  }
  res.json({ message: 'Cart updated.' });
});

/** DELETE /api/cart/:cartId — remove a line. */
export const removeItem = asyncHandler(async (req, res) => {
  const [result] = await deleteCartItem(Number(req.params.cartId), req.user.userId);
  if (!result.affectedRows) throw notFound('Cart item not found.');
  res.json({ message: 'Removed from cart.' });
});
