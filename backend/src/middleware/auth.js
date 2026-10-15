import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/env.js';
import { unauthorized, forbidden } from '../utils/apiError.js';

/**
 * JWT authentication middleware. Verifies the Bearer token and attaches
 * the authenticated user to req.user.
 */
export const authenticate = (req, _res, next) => {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return next(unauthorized());

  try {
    const token = header.slice(7).trim();
    const payload = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    if (!payload.sub || !['customer', 'admin'].includes(payload.role)) {
      return next(unauthorized('Invalid or expired session. Please sign in again.'));
    }
    req.user = {
      userId: payload.sub,
      role: payload.role,
      name: payload.name,
      email: payload.email,
    };
    return next();
  } catch {
    return next(unauthorized('Invalid or expired session. Please sign in again.'));
  }
};

/**
 * Role-based authorization. Usage: authorize('admin') or authorize('customer','admin').
 */
export const authorize = (...roles) => (req, _res, next) => {
  if (!req.user) return next(unauthorized());
  if (!roles.includes(req.user.role)) return next(forbidden());
  return next();
};
