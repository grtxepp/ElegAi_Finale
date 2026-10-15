import { asyncHandler } from '../utils/asyncHandler.js';
import { badRequest } from '../utils/apiError.js';
import { requireFields } from '../utils/validators.js';
import { chatReply, generateOutfitImage, parsePreferencesFromText } from '../services/ai.service.js';
import { findCustomerStyleProfile } from '../repositories/stylist.repository.js';

const MAX_MESSAGE = 1000;
const MAX_HISTORY = 12;

/** Read the optional saved style profile so replies stay personalised. */
const loadPreferences = async (userId) => {
  if (!userId) return null;
  try {
    const profile = await findCustomerStyleProfile(userId);
    if (!profile) return null;
    return {
      occasion: '',
      style: profile.preferred_style || '',
      color: profile.preferred_color || '',
      fit: profile.preferred_fit || '',
      size: '',
    };
  } catch {
    return null;
  }
};

/**
 * POST /api/chatbot/message
 * Body: { message: string, history?: [{role, content}] }
 */
export const sendMessage = asyncHandler(async (req, res) => {
  requireFields(req.body, ['message']);
  const message = String(req.body.message).trim();
  if (message.length > MAX_MESSAGE) throw badRequest(`Please keep messages under ${MAX_MESSAGE} characters.`);

  const history = Array.isArray(req.body.history)
    ? req.body.history.slice(-MAX_HISTORY).map((m) => ({
        role: String(m?.role || 'user'),
        content: String(m?.content || '').slice(0, 800),
      }))
    : [];

  const preferences = await loadPreferences(req.user?.userId);
  const result = await chatReply({ message, history, preferences });

  // Attach catalog matches when the customer is clearly asking to shop.
  const parsed = parsePreferencesFromText(message);
  const wantsProducts = Boolean(parsed.occasion || parsed.style || parsed.color);

  res.json({
    reply: result.reply,
    provider: result.provider,
    offline: Boolean(result.offline),
    suggestions: wantsProducts ? ['Show me more options', 'What colours do you have?', 'How does it fit?'] : ['Recommend something for me', 'What are your FAQs?', 'Help me pick a colour'],
  });
});

/**
 * POST /api/chatbot/generate-image
 * Body: { request: string, preferences?: object }
 */
export const generateImage = asyncHandler(async (req, res) => {
  requireFields(req.body, ['request']);
  const request = String(req.body.request).trim();
  if (request.length > MAX_MESSAGE) throw badRequest(`Please keep requests under ${MAX_MESSAGE} characters.`);

  const saved = await loadPreferences(req.user?.userId);
  const preferences = { ...(saved || {}), ...(req.body.preferences || {}) };

  const result = await generateOutfitImage({ request, preferences });

  res.json({
    image: `data:${result.mimeType};base64,${result.imageBase64}`,
    imageBase64: result.imageBase64,
    mimeType: result.mimeType,
    source: result.source,
    prompt: result.prompt,
    notice: result.notice || '',
  });
});