import { execute, withTransaction } from './database.repository.js';

/** Create an order and reserve stock as one atomic database operation. */
export const placeOrderFromCart = ({ userId, shippingAddress, paymentMethod, notes }) =>
  withTransaction(async (connection) => {
    const [cartRows] = await connection.query(
      `SELECT c.quantity, p.product_id, p.price, p.stock, p.name
       FROM cart c JOIN products p ON p.product_id = c.product_id
       WHERE c.user_id = ?
       FOR UPDATE`,
      [userId]
    );
    if (!cartRows.length) return { error: 'empty-cart' };

    const insufficient = cartRows.find((item) => item.quantity > item.stock);
    if (insufficient) {
      return {
        error: 'insufficient-stock',
        productName: insufficient.name,
        stock: insufficient.stock,
      };
    }

    const total = cartRows.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
    const [order] = await connection.query(
      'INSERT INTO orders (user_id, total_amount, status, shipping_address, payment_method) VALUES (?, ?, ?, ?, ?)',
      [userId, total, 'Pending', JSON.stringify({ ...shippingAddress, notes: notes || '' }), paymentMethod]
    );

    for (const item of cartRows) {
      await connection.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
        [order.insertId, item.product_id, item.quantity, item.price]
      );
      await connection.query(
        'UPDATE products SET stock = stock - ? WHERE product_id = ? AND stock >= ?',
        [item.quantity, item.product_id, item.quantity]
      );
    }

    await connection.query('DELETE FROM cart WHERE user_id = ?', [userId]);
    return { orderId: order.insertId, totalAmount: total };
  });

export const listCustomerOrders = async (userId) => {
  const [rows] = await execute(
    `SELECT o.*, (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.order_id) AS item_count
     FROM orders o WHERE o.user_id = ? ORDER BY o.created_at DESC`,
    [userId]
  );
  return rows;
};

export const findCustomerOrder = async (orderId, userId) => {
  const [rows] = await execute('SELECT * FROM orders WHERE order_id = ? AND user_id = ?', [orderId, userId]);
  return rows[0] || null;
};

export const listOrderItems = async (orderId) => {
  const [rows] = await execute(
    `SELECT oi.order_item_id, oi.product_id, oi.quantity, oi.price, p.name, p.image_url, p.color, p.category
     FROM order_items oi JOIN products p ON p.product_id = oi.product_id
     WHERE oi.order_id = ?`,
    [orderId]
  );
  return rows;
};

/** Cancel/restock only a pending order, atomically. */
export const cancelCustomerOrder = ({ orderId, userId }) =>
  withTransaction(async (connection) => {
    const [orders] = await connection.query(
      'SELECT order_id, status FROM orders WHERE order_id = ? AND user_id = ? FOR UPDATE',
      [orderId, userId]
    );
    const order = orders[0];
    if (!order) return { state: 'not-found' };
    if (order.status !== 'Pending') return { state: 'not-pending' };

    const [items] = await connection.query(
      'SELECT product_id, quantity FROM order_items WHERE order_id = ?',
      [orderId]
    );
    await connection.query('UPDATE orders SET status = ? WHERE order_id = ?', ['Cancelled', orderId]);
    for (const item of items) {
      await connection.query('UPDATE products SET stock = stock + ? WHERE product_id = ?', [
        item.quantity,
        item.product_id,
      ]);
    }
    return { state: 'cancelled' };
  });
