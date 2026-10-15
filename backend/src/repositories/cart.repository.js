import { execute } from './database.repository.js';

export const getCartRows = async (userId) => {
  const [rows] = await execute(
    `SELECT c.cart_id, c.quantity, p.product_id, p.name, p.price, p.image_url, p.stock, p.color, p.category, p.available_sizes
     FROM cart c
     JOIN products p ON p.product_id = c.product_id
     WHERE c.user_id = ?
     ORDER BY c.cart_id`,
    [userId]
  );
  return rows;
};

export const findProductStock = async (productId) => {
  const [rows] = await execute('SELECT stock FROM products WHERE product_id = ?', [productId]);
  return rows[0] || null;
};

export const addCartItem = (userId, productId, quantity, maxStock) =>
  execute(
    'INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE quantity = LEAST(quantity + VALUES(quantity), ?)',
    [userId, productId, quantity, maxStock]
  );

export const findCartItem = async (cartId, userId) => {
  const [rows] = await execute('SELECT * FROM cart WHERE cart_id = ? AND user_id = ?', [cartId, userId]);
  return rows[0] || null;
};

export const updateCartItemQuantity = (cartId, userId, quantity) =>
  execute('UPDATE cart SET quantity = ? WHERE cart_id = ? AND user_id = ?', [quantity, cartId, userId]);

export const deleteCartItem = (cartId, userId) =>
  execute('DELETE FROM cart WHERE cart_id = ? AND user_id = ?', [cartId, userId]);
