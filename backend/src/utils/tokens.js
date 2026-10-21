import jwt from 'jsonwebtoken';
import { JWT_SECRET, JWT_EXPIRES_IN } from '../config/env.js';

/** Sign a JWT for a user. */
export const signToken = (user) =>
  jwt.sign(
    {
      sub: user.user_id,
      role: user.role,
      name: user.name,
      email: user.email,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN, algorithm: 'HS256' }
  );

/** Shape a user row into the public payload. */
export const publicUser = (user, profile = null) => ({
  userId: user.user_id,
  name: user.name,
  email: user.email,
  role: user.role,
  createdAt: user.created_at,
  profile: profile
    ? {
        heightCm: profile.height_cm,
        measurements: profile.measurements,
        preferredStyle: profile.preferred_style,
        preferredColor: profile.preferred_color,
        preferredFit: profile.preferred_fit,
        preferredSize: profile.preferred_size,
      }
    : null,
});
