import bcrypt from 'bcryptjs';
import {
  findUserById,
  findProfileByUserId,
  isEmailUsedByAnotherUser,
  updateCustomerProfile,
  updatePassword,
} from '../repositories/user.repository.js';
import { publicUser } from '../utils/tokens.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError, badRequest, unauthorized } from '../utils/apiError.js';
import { requireFields, isEmail, isJsonString, validatePassword } from '../utils/validators.js';

/** GET /api/profile — current account and saved style profile. */
export const getProfile = asyncHandler(async (req, res) => {
  const user = await findUserById(req.user.userId);
  if (!user) throw unauthorized('Account no longer exists.');
  const profile = await findProfileByUserId(req.user.userId);
  res.json({ user: publicUser(user, profile) });
});

/** PUT /api/profile — validate input and delegate persistence to the repository. */
export const updateProfile = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    heightCm,
    measurements,
    preferredStyle,
    preferredColor,
    preferredFit,
  } = req.body;

  if (name !== undefined && String(name).trim() === '') throw badRequest('Name cannot be empty.');
  if (email !== undefined) {
    if (!isEmail(email)) throw badRequest('Please enter a valid email address.');
    const normalizedEmail = String(email).toLowerCase().trim();
    if (await isEmailUsedByAnotherUser(normalizedEmail, req.user.userId)) {
      throw new ApiError(409, 'That email address is already in use.');
    }
  }
  if (heightCm !== undefined && heightCm !== null && heightCm !== '') {
    const height = Number(heightCm);
    if (!Number.isFinite(height) || height < 100 || height > 250) {
      throw badRequest('Height must be between 100 and 250 cm.');
    }
  }

  let measurementsJson = measurements;
  if (measurements !== undefined && measurements !== null && measurements !== '') {
    if (typeof measurements === 'string') {
      if (!isJsonString(measurements)) {
        throw badRequest('Measurements must be valid JSON, e.g. {"bust":88,"waist":66}.');
      }
    } else {
      measurementsJson = JSON.stringify(measurements);
    }
  }

  await updateCustomerProfile(req.user.userId, {
    name: name !== undefined ? String(name).trim() : null,
    email: email !== undefined ? String(email).toLowerCase().trim() : null,
    heightCm: heightCm || null,
    measurements: measurementsJson || null,
    preferredStyle: preferredStyle || null,
    preferredColor: preferredColor || null,
    preferredFit: preferredFit || null,
  });

  const user = await findUserById(req.user.userId);
  const profile = await findProfileByUserId(req.user.userId);
  res.json({ message: 'Profile updated.', user: publicUser(user, profile) });
});

/** POST /api/profile/change-password — verify current password before updating. */
export const changePassword = asyncHandler(async (req, res) => {
  requireFields(req.body, ['currentPassword', 'newPassword']);
  validatePassword(req.body, 'newPassword');
  const user = await findUserById(req.user.userId);
  if (!user) throw unauthorized();
  if (!(await bcrypt.compare(String(req.body.currentPassword), user.password))) {
    throw badRequest('Your current password is incorrect.');
  }
  const passwordHash = await bcrypt.hash(String(req.body.newPassword), 10);
  await updatePassword(req.user.userId, passwordHash);
  res.json({ message: 'Your password has been updated.' });
});
