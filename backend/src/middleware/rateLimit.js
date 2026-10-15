import rateLimit from 'express-rate-limit';

const limiter = ({ windowMs, max, message, ...options }) => rateLimit({
  windowMs,
  limit: max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message },
  ...options,
});

/** Broad safety net for API traffic. */
export const apiLimiter = limiter({
  windowMs: 60 * 1000,
  max: 300,
  message: 'Too many requests. Please slow down and try again shortly.',
});

/** Failed sign-in attempts are limited per client IP. Successful sign-ins do not count. */
export const loginLimiter = limiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  message: 'Too many sign-in attempts. Please wait 15 minutes and try again.',
});

/** Prevent automated account creation. */
export const registerLimiter = limiter({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: 'Too many account-creation attempts. Please try again later.',
});

/** Shared limit for requesting or consuming password-reset links. */
export const passwordResetLimiter = limiter({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: 'Too many password-reset attempts. Please try again later.',
});

/** Keep the optional paid AI provider from being abused through the public stylist endpoint. */
export const aiLimiter = limiter({
  windowMs: 60 * 60 * 1000,
  max: 30,
  message: 'You have reached the stylist request limit. Please try again later.',
});

/** Image generation is expensive — allow only a few per hour. */
export const imageLimiter = limiter({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: 'You have reached the image generation limit (10 per hour). Please try again later.',
});
