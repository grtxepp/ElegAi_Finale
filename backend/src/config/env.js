import 'dotenv/config';

/**
 * Centralised environment configuration.
 * All secrets live in environment variables (.env) — never in the frontend.
 */

const parseBool = (v, fallback = false) => {
  if (v === undefined || v === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(v).toLowerCase());
};

export const NODE_ENV = process.env.NODE_ENV || 'development';
export const IS_PROD = NODE_ENV === 'production';

export const PORT = Number(process.env.PORT) || 5000;

const configuredJwtSecret = String(process.env.JWT_SECRET || '').trim();
const developmentJwtSecret = 'elegai-insecure-dev-secret-do-not-use-in-prod';
const weakProductionJwtSecret =
  !configuredJwtSecret ||
  configuredJwtSecret.length < 32 ||
  /change-me|replace-me|insecure|example/i.test(configuredJwtSecret);

if (IS_PROD && weakProductionJwtSecret) {
  throw new Error('Set JWT_SECRET to a strong random value (at least 32 characters) in production.');
}

export const JWT_SECRET = configuredJwtSecret || developmentJwtSecret;
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Cloudflare Turnstile provides a free server-verified bot check. Development
// falls back to Cloudflare's official public test key pair. Production enables
// the check when a real secret is configured (or when CAPTCHA_ENABLED=true).
export const TURNSTILE_SITE_KEY =
  process.env.TURNSTILE_SITE_KEY || (IS_PROD ? '' : '1x00000000000000000000AA');
export const TURNSTILE_SECRET_KEY =
  process.env.TURNSTILE_SECRET_KEY || (IS_PROD ? '' : '1x0000000000000000000000000000000AA');
export const CAPTCHA_ENABLED = parseBool(
  process.env.CAPTCHA_ENABLED,
  !IS_PROD || Boolean(TURNSTILE_SECRET_KEY)
);

export const DB = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'elegai',
  password: process.env.DB_PASSWORD || 'elegai_pass',
  database: process.env.DB_NAME || 'elegai',
};

/** Enable TLS for cloud MySQL providers that require it (e.g. TiDB Serverless). */
export const DB_SSL = (process.env.DB_SSL || 'false') === 'true';

// ── AI provider auto-detection: gemini -> openai -> local ──────────
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
export const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
export const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

// Image generation models. Gemini image models require billing enabled on the
// API project (free tier quota is 0); the OpenAI image models are used as a
// second real provider when a key with credits is configured.
export const GEMINI_IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || 'gemini-3-pro-image';
export const OPENAI_IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1-mini';

// Optional Pollinations key (free tier: the `flux` model is always free). With a
// token the app uses the reliable gen.pollinations.ai endpoint; without one it
// falls back to the anonymous legacy endpoint (heavily rate-limited).
export const POLLINATIONS_TOKEN = process.env.POLLINATIONS_TOKEN || '';

// Stable Horde (aihorde.net) — a free, community-run GPU network. The anonymous
// key "0000000000" works with no signup; set HORDE_API_KEY to your own (free)
// key for faster queues and higher priority.
export const HORDE_API_KEY = process.env.HORDE_API_KEY || '0000000000';

export const AI_PROVIDER = (process.env.AI_PROVIDER || '').toLowerCase() || (() => {
  if (GEMINI_API_KEY) return 'gemini';
  if (OPENAI_API_KEY) return 'openai';
  return 'local';
})();

export const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';
export const MAX_UPLOAD_MB = Number(process.env.MAX_UPLOAD_MB) || 5;

export const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

/**
 * When true, the Express server also serves the built frontend (frontend/dist)
 * with SPA fallback — a single process serves both API and UI. Great for
 * low-RAM machines and simple deployments. Usage:
 *   cd frontend && npm run build
 *   cd ../backend && SERVE_FRONTEND=true npm start   →  http://localhost:5000
 */
export const SERVE_FRONTEND = (process.env.SERVE_FRONTEND || 'false') === 'true';

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export const ALLOWED_IMAGE_EXT = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

export const ORDER_STATUSES = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

export const CATEGORIES = [
  'Bridal Gowns',
  'Evening Gowns',
  'Formal Dresses',
  'Suits',
  'Barongs',
  'Accessories',
];
