import { asyncHandler } from '../utils/asyncHandler.js';
import { badRequest } from '../utils/apiError.js';
import { requireFields } from '../utils/validators.js';
import { getRecommendations } from '../services/ai.service.js';
import {
  OCCASIONS, STYLES, COLORS, FITS, SIZES,
} from '../services/recommendation.service.js';
import { findCustomerStyleProfile } from '../repositories/stylist.repository.js';

/**
 * POST /api/stylist/recommend (multipart/form-data; optional photo file).
 * Input normalization happens here; customer profile and AI work are delegated.
 */
export const recommend = asyncHandler(async (req, res) => {
  requireFields(req.body, ['occasion']);
  const occasion = String(req.body.occasion || '').trim();
  if (!OCCASIONS.includes(occasion)) {
    throw badRequest(`Occasion must be one of: ${OCCASIONS.join(', ')}.`);
  }

  const pick = (field, allowed) => {
    const value = req.body[field];
    if (!value) return '';
    const cleaned = String(value).trim();
    if (allowed && !allowed.includes(cleaned)) throw badRequest(`Invalid value for "${field}".`);
    return cleaned;
  };

  let preferences = {
    occasion,
    style: pick('style', STYLES),
    color: pick('color', COLORS),
    fit: pick('fit', FITS),
    size: pick('size', SIZES),
    heightCm: req.body.heightCm ? Number(req.body.heightCm) : null,
    measurements: null,
    notes: String(req.body.notes || '').trim(),
  };

  if (req.body.measurements) {
    try { preferences.measurements = JSON.parse(req.body.measurements); }
    catch { throw badRequest('Measurements must be valid JSON, e.g. {"bust":88,"waist":66}.'); }
  }

  if (req.user) {
    const profile = await findCustomerStyleProfile(req.user.userId);
    if (profile) {
      preferences = {
        ...preferences,
        style: preferences.style || profile.preferred_style || '',
        color: preferences.color || profile.preferred_color || '',
        fit: preferences.fit || profile.preferred_fit || '',
        heightCm: preferences.heightCm || profile.height_cm || null,
        measurements: preferences.measurements || profile.measurements,
      };
    }
  }

  if (req.file) {
    preferences.photoBase64 = req.file.buffer.toString('base64');
    preferences.photoMime = req.file.mimetype;
  }

  const result = await getRecommendations(preferences);
  res.json(result);
});
