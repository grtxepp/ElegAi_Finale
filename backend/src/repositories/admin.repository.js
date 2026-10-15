import { execute, withTransaction } from './database.repository.js';

export const getDashboardData = async () => {
  const [[{ revenue }]] = await execute(
    `SELECT COALESCE(SUM(total_amount), 0) AS revenue FROM orders WHERE status <> 'Cancelled'`
  );
  const [[{ orders }]] = await execute('SELECT COUNT(*) AS orders FROM orders');
  const [[{ customers }]] = await execute(`SELECT COUNT(*) AS customers FROM users WHERE role = 'customer'`);
  const [[{ products }]] = await execute('SELECT COUNT(*) AS products FROM products');
  const [[{ lowStock }]] = await execute('SELECT COUNT(*) AS lowStock FROM products WHERE stock <= 5');
  const [recentOrders] = await execute(
    `SELECT o.order_id, o.total_amount, o.status, o.created_at, u.name AS customer
     FROM orders o JOIN users u ON u.user_id = o.user_id
     ORDER BY o.created_at DESC LIMIT 8`
  );
  const [byStatus] = await execute('SELECT status, COUNT(*) AS count FROM orders GROUP BY status');
  const [revenueByDay] = await execute(
    `SELECT DATE(created_at) AS day, SUM(total_amount) AS total
     FROM orders WHERE status <> 'Cancelled'
       AND created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
     GROUP BY DATE(created_at) ORDER BY day`
  );
  const [topProducts] = await execute(
    `SELECT p.product_id, p.name, p.image_url, SUM(oi.quantity) AS sold,
            SUM(oi.quantity * oi.price) AS product_revenue
     FROM order_items oi
     JOIN products p ON p.product_id = oi.product_id
     JOIN orders o ON o.order_id = oi.order_id
     WHERE o.status <> 'Cancelled'
     GROUP BY p.product_id ORDER BY sold DESC LIMIT 5`
  );
  return { revenue, orders, customers, products, lowStock, recentOrders, byStatus, revenueByDay, topProducts };
};

export const searchAllProducts = async ({ q, category }) => {
  const where = [];
  const params = [];
  if (q) {
    where.push('(name LIKE ? OR description LIKE ?)');
    params.push(`%${q}%`, `%${q}%`);
  }
  if (category) { where.push('category = ?'); params.push(category); }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const [rows] = await execute(
    `SELECT * FROM products ${whereSql} ORDER BY product_id DESC`,
    params
  );
  return rows;
};

export const insertProduct = async (product) => {
  const [result] = await execute(
    'INSERT INTO products (name, description, price, category, color, available_sizes, stock, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [
      product.name,
      product.description,
      product.price,
      product.category,
      product.color,
      JSON.stringify(product.availableSizes),
      product.stock,
      product.imageUrl,
    ]
  );
  return result.insertId;
};

export const findProductById = async (productId) => {
  const [rows] = await execute('SELECT * FROM products WHERE product_id = ?', [productId]);
  return rows[0] || null;
};

export const saveProduct = (productId, product) =>
  execute(
    `UPDATE products SET name = ?, description = ?, price = ?, category = ?, color = ?,
            available_sizes = ?, stock = ?, image_url = ? WHERE product_id = ?`,
    [
      product.name,
      product.description,
      product.price,
      product.category,
      product.color,
      product.availableSizes,
      product.stock,
      product.imageUrl,
      productId,
    ]
  );

export const deleteProductAndCartRows = (productId) =>
  withTransaction(async (connection) => {
    await connection.query('DELETE FROM cart WHERE product_id = ?', [productId]);
    const [result] = await connection.query('DELETE FROM products WHERE product_id = ?', [productId]);
    return result;
  });

export const setProductStock = async (productId, { stock, delta }) => {
  if (stock !== undefined) {
    await execute('UPDATE products SET stock = ? WHERE product_id = ?', [stock, productId]);
  } else {
    await execute('UPDATE products SET stock = GREATEST(stock + ?, 0) WHERE product_id = ?', [delta, productId]);
  }
  return findProductById(productId);
};

export const listOrdersForAdmin = async (status) => {
  const where = status ? 'WHERE o.status = ?' : '';
  const params = status ? [status] : [];
  const [rows] = await execute(
    `SELECT o.order_id, o.total_amount, o.status, o.created_at, o.payment_method, o.user_id,
            u.name AS customer, u.email AS email,
            (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.order_id) AS item_count
     FROM orders o JOIN users u ON u.user_id = o.user_id
     ${where} ORDER BY o.created_at DESC`,
    params
  );
  return rows;
};

export const setOrderStatus = async (orderId, status) => {
  await execute('UPDATE orders SET status = ? WHERE order_id = ?', [status, orderId]);
  const [rows] = await execute('SELECT order_id FROM orders WHERE order_id = ?', [orderId]);
  return rows.length > 0;
};

export const searchCustomers = async (q) => {
  const where = `WHERE u.role = 'customer'` + (q ? ' AND (u.name LIKE ? OR u.email LIKE ?)' : '');
  const params = q ? [`%${q}%`, `%${q}%`] : [];
  const [rows] = await execute(
    `SELECT u.user_id, u.name, u.email, u.created_at,
            (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.user_id) AS order_count,
            (SELECT COALESCE(SUM(total_amount), 0) FROM orders o
              WHERE o.user_id = u.user_id AND o.status <> 'Cancelled') AS total_spent
     FROM users u ${where} ORDER BY u.created_at DESC`,
    params
  );
  return rows;
};
