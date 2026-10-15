import { IS_PROD } from '../config/env.js';

/** 404 handler for unknown API routes. */
export const notFoundHandler = (req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.originalUrl} not found.` });
};

/**
 * Central error handler. Normalises unknown errors (e.g. MySQL error codes)
 * into clean JSON responses and never leaks stack traces in production.
 */
export const errorHandler = (err, _req, res, _next) => {
  let status = err.status || 500;
  let message = err.message || 'Internal server error';
  let details = err.details;

  if (err.code === 'ER_DUP_ENTRY') {
    status = 409;
    message = 'That record already exists.';
  }
  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    status = 400;
    message = 'The referenced record does not exist.';
  }
  if (err.code === 'ER_ROW_IS_REFERENCED_2') {
    status = 400;
    message = 'This record cannot be deleted because it is referenced by other records.';
  }

  if (status >= 500) console.error('[error]', err);
  res.status(status).json({ message, details });
};
