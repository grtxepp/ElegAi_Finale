/**
 * Lightweight, dependency-free validation helpers.
 * Each helper throws an ApiError(400) with a readable message.
 */
import { badRequest } from './apiError.js';

export const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(value || ''));

export const isStrongPassword = (value) =>
  typeof value === 'string' && value.length >= 8 && /[A-Za-z]/.test(value) && /\d/.test(value);

export const isMoney = (value) => Number.isFinite(Number(value)) && Number(value) >= 0;

export const isJsonString = (value) => {
  try {
    JSON.parse(value);
    return true;
  } catch {
    return false;
  }
};

/** Assert required fields exist (and are non-empty strings unless allowed). */
export const requireFields = (body, fields, { allowEmpty = false } = {}) => {
  const missing = [];
  for (const f of fields) {
    const v = body?.[f];
    if (v === undefined || v === null || (!allowEmpty && String(v).trim() === '')) missing.push(f);
  }
  if (missing.length) {
    throw badRequest(`Missing required field(s): ${missing.join(', ')}`, { missing });
  }
};

/** Validate an email field. */
export const validateEmail = (body, field = 'email') => {
  if (!isEmail(body?.[field])) throw badRequest(`Please enter a valid email address.`);
};

/** Validate a password field (min 8 chars, letters + numbers). */
export const validatePassword = (body, field = 'password') => {
  const value = String(body?.[field] || '');
  if (!isStrongPassword(value)) {
    throw badRequest(
      'Password must be at least 8 characters and contain both letters and numbers.'
    );
  }
};

/** Validate a positive integer quantity. */
export const validateQuantity = (value, { max = 99 } = {}) => {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1 || n > max) {
    throw badRequest(`Quantity must be a whole number between 1 and ${max}.`);
  }
  return n;
};
