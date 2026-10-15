import { asyncHandler } from '../utils/asyncHandler.js';
import { notFound } from '../utils/apiError.js';
import { parseProduct } from '../utils/serialize.js';
import {
  searchProducts,
  getProductFilterOptions,
  findProductById,
  findRelatedProducts,
} from '../repositories/product.repository.js';

/** GET /api/products — validate request input and return catalog data. */
export const listProducts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 12 } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(48, Math.max(1, parseInt(limit, 10) || 12));
  const { items, total } = await searchProducts({
    ...req.query,
    page: pageNum,
    limit: limitNum,
  });
  res.json({
    items: items.map(parseProduct),
    total,
    page: pageNum,
    pages: Math.max(1, Math.ceil(total / limitNum)),
    limit: limitNum,
  });
});

/** GET /api/products/meta — filter dropdown options. */
export const getMeta = asyncHandler(async (_req, res) => {
  res.json(await getProductFilterOptions());
});

/** GET /api/products/:id — product detail + related products. */
export const getProduct = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const product = await findProductById(id);
  if (!product) throw notFound('Product not found.');
  const related = await findRelatedProducts(product.category, id);
  res.json({ product: parseProduct(product), related: related.map(parseProduct) });
});
