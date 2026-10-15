import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { CAPTCHA_ENABLED, TURNSTILE_SITE_KEY } from '../config/env.js';
import {
  createCustomerAccount,
  findUserByEmail,
  findUserById,
  findProfileByUserId,
  findUserIdByEmail,
  createPasswordResetToken,
  consumePasswordResetToken,
} from '../repositories/auth.repository.js';
import { signToken, publicUser } from '../utils/tokens.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError, badRequest, unauthorized } from '../utils/apiError.js';
import { requireFields, validateEmail, validatePassword } from '../utils/validators.js';

/** Public widget settings only; the Turnstile secret is never returned. */
export const getCaptchaConfig = (_req, res) => {
  res.json({ enabled: CAPTCHA_ENABLED, siteKey: TURNSTILE_SITE_KEY });
};

/** POST /api/auth/register — create a customer account. */
export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  requireFields(req.body, ['name', 'email', 'password']);
  validateEmail(req.body);
  validatePassword(req.body);

  const normalizedEmail = String(email).toLowerCase().trim();
  if (await findUserByEmail(normalizedEmail)) {
    throw new ApiError(409, 'An account with this email already exists.');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const { user, profile } = await createCustomerAccount({
    name: String(name).trim(),
    email: normalizedEmail,
    passwordHash,
  });
  res.status(201).json({ token: signToken(user), user: publicUser(user, profile) });
});

/** POST /api/auth/login — issue a signed JWT access token. */
export const login = asyncHandler(async (req, res) => {
  requireFields(req.body, ['email', 'password']);
  const email = String(req.body.email).toLowerCase().trim();
  const user = await findUserByEmail(email);
  if (!user || !(await bcrypt.compare(String(req.body.password), user.password))) {
    throw unauthorized('Invalid email or password.');
  }
  const profile = await findProfileByUserId(user.user_id);
  res.json({ token: signToken(user), user: publicUser(user, profile) });
});

/** GET /api/auth/me — current user + profile. */
export const me = asyncHandler(async (req, res) => {
  const user = await findUserById(req.user.userId);
  if (!user) throw unauthorized('Account no longer exists.');
  const profile = await findProfileByUserId(req.user.userId);
  res.json({ user: publicUser(user, profile) });
});

/**
 * POST /api/auth/forgot-password
 * Creates a single-use, hashed reset token. In development the reset link is
 * returned because the demo has no mail provider configured.
 */
export const forgotPassword = asyncHandler(async (req, res) => {
  requireFields(req.body, ['email']);
  validateEmail(req.body);
  const email = String(req.body.email).toLowerCase().trim();
  const userId = await findUserIdByEmail(email);

  if (userId) {
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    await createPasswordResetToken(userId, tokenHash);
    if (process.env.NODE_ENV !== 'production') {
      return res.json({
        message: 'A password reset link has been generated.',
        resetUrl: `${req.protocol}://${req.get('host')}/reset-password/${token}`,
      });
    }
  }
  // Keep the same response whether or not the email exists.
  res.json({ message: 'If an account exists for that email, a reset link has been sent.' });
});

/** POST /api/auth/reset-password — consume a one-time token + set password. */
export const resetPassword = asyncHandler(async (req, res) => {
  requireFields(req.body, ['token', 'password']);
  validatePassword(req.body);
  const tokenHash = crypto.createHash('sha256').update(String(req.body.token)).digest('hex');
  const passwordHash = await bcrypt.hash(String(req.body.password), 10);
  const record = await consumePasswordResetToken(tokenHash, passwordHash);
  if (!record) throw badRequest('This reset link is invalid or has expired.');
  res.json({ message: 'Your password has been updated. You can now sign in.' });
});
