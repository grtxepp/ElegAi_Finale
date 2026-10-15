import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/env.js';

/**
 * Optional authentication — attaches req.user when a valid token is present,
 * but never rejects the request. Used by the AI stylist endpoint so it can
 * pre-fill preferences from the customer's saved profile.
 */
export const optionalAuth = (req, _res, next) => {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) {
    try {
      const payload = jwt.verify(header.slice(7), JWT_SECRET);
      req.user = {
        userId: payload.sub,
        role: payload.role,
        name: payload.name,
        email: payload.email,
      };
    } catch {
      /* token invalid — treat as guest */
    }
  }
  return next();
};
