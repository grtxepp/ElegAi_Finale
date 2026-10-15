import { execute } from './database.repository.js';

const SORT_SQL = Object.freeze({
  price_asc: 'price ASC',
  price_desc: 'price DESC',
  newest: 'created_at DESC, product_id DESC',
  name: 'name ASC',
});

/** Database-specific catalog search stays isolated in this repository. */
export const searchProducts = async ({
  category, color, size, q, minPrice, maxPrice, sort, inStock, page, limit,
}) => {
  const where = [];
  const params = [];
  if (category) { where.push('category = ?'); params.push(category); }
  if (color) { where.push('LOWER(color) = LOWER(?)'); params.push(color); }
  if (size) { where.push('JSON_CONTAINS(available_sizes, JSON_QUOTE(?))'); params.push(size); }
  if (q) {
    where.push('(name LIKE ? OR description LIKE ?)');
    params.push(`%${q}%`, `%${q}%`);
  }
  if (minPrice !== undefined && minPrice !== '') {
    where.push('price >= ?');
    params.push(Number(minPrice));
  }
  if (maxPrice !== undefined && maxPrice !== '') {
    where.push('price <= ?');
    params.push(Number(maxPrice));
  }
  if (inStock === 'true' || inStock === '1') where.push('stock > 0');

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const orderSql = SORT_SQL[sort] || 'product_id ASC';
  const [counts] = await execute(`SELECT COUNT(*) AS total FROM products ${whereSql}`, params);
  const [items] = await execute(
    `SELECT * FROM products ${whereSql} ORDER BY ${orderSql} LIMIT ? OFFSET ?`,
    [...params, limit, (page - 1) * limit]
  );
  return { items, total: Number(counts[0]?.total || 0) };
};

export const getProductFilterOptions = async () => {
  const [categories] = await execute(
    'SELECT category, COUNT(*) AS count FROM products GROUP BY category ORDER BY category'
  );
  const [colors] = await execute('SELECT DISTINCT color FROM products ORDER BY color');
  return { categories, colors: colors.map((row) => row.color) };
};

export const findProductById = async (productId) => {
  const [rows] = await execute('SELECT * FROM products WHERE product_id = ?', [productId]);
  return rows[0] || null;
};

export const findRelatedProducts = async (category, excludedProductId) => {
  const [rows] = await execute(
    'SELECT * FROM products WHERE category = ? AND product_id <> ? AND stock > 0 ORDER BY RAND() LIMIT 4',
    [category, excludedProductId]
  );
  return rows;
};
