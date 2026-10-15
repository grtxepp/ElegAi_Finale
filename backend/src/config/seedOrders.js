/**
 * Inserts a handful of sample orders (with consistent totals) so the admin
 * dashboard, sales statistics and order management screens have data to show.
 * Totals are computed from the actual product prices.
 */
export async function seedSampleOrders(conn) {
  const [users] = await conn.query(
    `SELECT user_id FROM users WHERE role = 'customer' ORDER BY user_id LIMIT 3`
  );
  const [products] = await conn.query(
    'SELECT product_id, price FROM products ORDER BY product_id'
  );
  if (!users.length || !products.length) return;

  const byId = new Map(products.map((p) => [p.product_id, p]));

  // [customerIndex, daysAgo, status, payment, [ [productId, qty], … ]]
  const spec = [
    [0, 21, 'Delivered', 'Cash on Delivery', [[1, 1], [7, 1], [22, 1]]],
    [1, 14, 'Shipped', 'GCash', [[14, 1], [24, 2]]],
    [2, 9, 'Confirmed', 'GCash', [[2, 1], [21, 1]]],
    [0, 6, 'Processing', 'Cash on Delivery', [[10, 1], [12, 1]]],
    [1, 3, 'Pending', 'Card', [[18, 1], [23, 1]]],
    [2, 1, 'Pending', 'GCash', [[6, 1]]],
    [0, 35, 'Delivered', 'Cash on Delivery', [[9, 1], [22, 1]]],
    [1, 28, 'Cancelled', 'GCash', [[17, 1]]],
  ];

  const address = JSON.stringify({
    line1: '123 Sample Street',
    city: 'San Pablo',
    province: 'Laguna',
    postal: '4000',
    phone: '0917 000 0000',
  });

  for (const [userIdx, daysAgo, status, payment, items] of spec) {
    const userId = users[userIdx].user_id;
    let total = 0;
    const lines = [];
    for (const [pid, qty] of items) {
      const p = byId.get(pid);
      if (!p) continue;
      const price = Number(p.price);
      total += price * qty;
      lines.push([pid, qty, price]);
    }
    if (!lines.length) continue;

    const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
    const [o] = await conn.query(
      `INSERT INTO orders (user_id, total_amount, status, shipping_address, payment_method, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, total, status, address, payment, createdAt]
    );
    for (const [pid, qty, price] of lines) {
      await conn.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
        [o.insertId, pid, qty, price]
      );
    }
  }
}
