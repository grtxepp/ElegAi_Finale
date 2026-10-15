import { ApiError, badRequest } from '../utils/apiError.js';
import { CAPTCHA_ENABLED, TURNSTILE_SECRET_KEY } from '../config/env.js';

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

/**
 * Verify a Cloudflare Turnstile token on the server. Never trust the browser's
 * token by itself; the secret key stays in backend environment variables.
 */
export const verifyCaptcha = async (req, _res, next) => {
  if (!CAPTCHA_ENABLED) return next();

  const token = String(req.body?.captchaToken || '').trim();
  if (!token) return next(badRequest('Please complete the CAPTCHA check and try again.'));
  if (!TURNSTILE_SECRET_KEY) {
    return next(new ApiError(503, 'CAPTCHA verification is not configured on the server.'));
  }

  try {
    const form = new URLSearchParams({ secret: TURNSTILE_SECRET_KEY, response: token });
    if (req.ip) form.set('remoteip', req.ip);

    const response = await fetch(SITEVERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form,
      signal: AbortSignal.timeout(6000),
    });
    if (!response.ok) throw new Error(`Turnstile returned HTTP ${response.status}`);

    const result = await response.json();
    if (!result.success) {
      return next(new ApiError(403, 'CAPTCHA verification failed. Please try again.'));
    }
    return next();
  } catch (error) {
    // Fail closed: if Turnstile cannot be reached, do not process a protected
    // login/registration/password request without verification.
    console.error('[captcha] Verification service unavailable:', error.message);
    return next(new ApiError(503, 'CAPTCHA verification is temporarily unavailable. Please try again.'));
  }
};
