/** Safely JSON-parse a value (DB stores JSON columns as strings). */
export const safeJson = (value, fallback = null) => {
  if (value === null || value === undefined) return fallback;
  try {
    return typeof value === 'string' ? JSON.parse(value) : value;
  } catch {
    return fallback;
  }
};

/** Serialise a product row for the API (numbers + parsed sizes). */
export const parseProduct = (p) => ({
  ...p,
  price: Number(p.price),
  available_sizes: safeJson(p.available_sizes, []),
});
