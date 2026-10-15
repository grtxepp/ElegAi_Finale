/**
 * ElegAI AI Service
 * ─────────────────
 * 1. Text chat  — Gemini, with an automatic model fallback chain so the chatbot
 *                 keeps answering even when one model is busy or retired.
 * 2. Recommendations — catalog matching (local engine + Gemini enrichment).
 * 3. Image generation — Gemini image models first, then a free no-key provider.
 *
 * All cloud credentials stay on the server; the frontend only ever talks to
 * this service through the REST API.
 */
import {
  GEMINI_API_KEY,
  GEMINI_MODEL,
  GEMINI_IMAGE_MODEL,
  OPENAI_API_KEY,
  OPENAI_IMAGE_MODEL,
  POLLINATIONS_TOKEN,
  HORDE_API_KEY,
} from '../config/env.js';
import { localRecommend, getCatalog, OCCASIONS, STYLES, COLORS, FITS, SIZES } from './recommendation.service.js';

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const OPENAI_BASE = 'https://api.openai.com/v1';
const HORDE_BASE = 'https://aihorde.net/api/v2';
const HORDE_CLIENT = 'ElegAI:1.0:https://github.com/elegai';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Text models are tried in order. Entries are real models exposed on the
 * v1beta endpoint (verified against the live model list); the chain keeps the
 * chatbot answering even when one model is briefly overloaded (HTTP 503).
 */
const TEXT_MODEL_CHAIN = [
  GEMINI_MODEL,
  'gemini-3.8-flash',
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-3.7-flash',
  'gemini-flash-latest',
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
].filter((m, i, arr) => m && arr.indexOf(m) === i);

/**
 * Gemini image-capable models, best first. These are the real image models on
 * the v1beta endpoint. NOTE: image generation is a *paid* Gemini API feature —
 * the free tier reports `limit: 0`, so these activate as soon as billing is
 * enabled on the API project.
 */
const GEMINI_IMAGE_CHAIN = [
  GEMINI_IMAGE_MODEL,
  'gemini-3-pro-image',
  'gemini-3.1-flash-image',
  'gemini-nano-banana-2.1',
  'gemini-2.5-flash-image',
  'gemini-3.1-flash-lite-image',
].filter((m, i, arr) => m && arr.indexOf(m) === i);

/** Chat conversations are kept short to stay well inside free-tier limits. */
const MAX_HISTORY = 10;

const CHAT_SYSTEM_PROMPT = `You are ElegAI, a warm, inclusive fashion assistant for a bridal and formal-wear boutique in the Philippines.

WHAT YOU DO
- Help customers find pieces from the ElegAI catalog.
- Give honest, kind styling advice for their occasion.
- Answer shop questions (sizing, shipping, returns, payment, appointments).

HOW YOU BEHAVE
- Warm, concise and practical. Two or three short paragraphs at most.
- Talk about clothing: silhouette, fabric, colour, occasion, fit and availability.
- NEVER comment on the customer's body, weight, height, skin tone or measurements, and never imply a negative. Compliment taste, style and occasion — never appearance.
- Use the customer's stated preferences (occasion, style, colour, fit, budget).
- When you suggest a piece, describe it the way it appears in the catalog.
- Prices are in Philippine pesos (₱).

CATALOG OPTIONS
Occasions: ${OCCASIONS.join(', ')}
Styles: ${STYLES.join(', ')}
Colours: ${COLORS.join(', ')}
Fits: ${FITS.join(', ')}
Sizes: ${SIZES.join(', ')}

If a customer asks you to draw or design an outfit, tell them you can generate a
visual for them and that they should press the "Generate outfit image" button.`;

const PREFERENCES_SYSTEM_PROMPT = `You are ElegAI, a formal-wear stylist.

Recommend ONLY products that exist in the catalog you are given. Never invent
product ids, names or prices.

RULES
- NEVER comment on the customer's body, weight, skin tone or measurements.
- Focus only on clothing: silhouette, fit, colour, occasion, availability.
- Return ONLY valid JSON, no markdown, no commentary, in exactly this shape:
{"summary":"one or two warm sentences","recommendations":[{"product_id":1,"reasons":["reason 1","reason 2"]}]}
- Choose up to 6 products, best match first.`;

const formatPeso = (amount) =>
  `₱${Number(amount).toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

/* ── helpers ──────────────────────────────────────────────────────────── */

/** Pull the generated text out of a Gemini response, tolerating refusals. */
const readGeminiText = (data) => {
  const parts = data?.candidates?.[0]?.content?.parts || [];
  const text = parts.map((p) => p.text || '').join('').trim();
  if (text) return text;
  const blocked = data?.promptFeedback?.blockReason || data?.candidates?.[0]?.finishReason;
  throw new Error(blocked ? `Gemini returned no text (${blocked}).` : 'Gemini returned an empty response.');
};

/** Read a human-readable error message out of a failed Gemini response. */
const readGeminiError = async (res) => {
  try {
    const data = await res.json();
    return data?.error?.message || `Gemini responded with HTTP ${res.status}`;
  } catch {
    return `Gemini responded with HTTP ${res.status}`;
  }
};

/** True when the failure is worth retrying with another model. */
const isRetryable = (message) =>
  /high demand|unavailable|no longer available|not found for API version|is not found|not supported|overloaded|429|500|502|503|504|deadline|timed out/i.test(
    message
  );

const geminiRequest = async (model, body, { timeout = 30000 } = {}) => {
  const res = await fetch(`${GEMINI_BASE}/${model}:generateContent?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeout),
  });
  if (!res.ok) throw new Error(await readGeminiError(res));
  return res.json();
};

/** Best-effort JSON extraction from a model response. */
const extractJson = (text) => {
  const t = String(text || '').trim();
  try {
    return JSON.parse(t);
  } catch {
    /* fall through */
  }
  const fenced = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) {
    try {
      return JSON.parse(fenced[1].trim());
    } catch {
      /* fall through */
    }
  }
  const match = t.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      return JSON.parse(match[0]);
    } catch {
      /* fall through */
    }
  }
  return null;
};

/* ── catalog brief ─────────────────────────────────────────────────────── */

const buildCatalogBrief = (products) =>
  products.slice(0, 60).map((p) => ({
    id: p.product_id,
    name: p.name,
    category: p.category,
    color: p.color,
    price: Number(p.price),
    sizes: (() => {
      try {
        return JSON.parse(p.available_sizes || '[]');
      } catch {
        return [];
      }
    })(),
    stock: p.stock,
    blurb: (p.description || '').slice(0, 160),
  }));

/* ── 1. text chat ──────────────────────────────────────────────────────── */

/** Offline replies so the chatbot is never dead, even with no API access. */
const localChatReply = (message, products) => {
  const q = String(message || '').toLowerCase();

  if (/\b(hi|hello|hey|kumusta|good (morning|afternoon|evening))\b/.test(q)) {
    return "Hello! I'm ElegAI, your styling assistant. Tell me the occasion you're dressing for — wedding, gala, cocktail party, corporate event, debut or graduation — plus the colour and style you love, and I'll suggest pieces from our catalog.";
  }

  if (/\b(return|refund|exchange)\b/.test(q)) {
    return 'You can return or exchange any unworn piece with its tags attached within 30 days of delivery. Bring your order receipt or quote the order number and our team at the counter will process it on the spot.';
  }

  if (/\b(shipping|delivery|deliver|courier)\b/.test(q)) {
    return 'We deliver nationwide. Metro Manila orders arrive in 2–3 working days, Luzon and Visayas in 3–5, and Mindanao in 5–7. Delivery is free on orders over ₱10,000; below that it is a flat ₱150.';
  }

  if (/\b(size|sizing|fit|measure|measurement)\b/.test(q)) {
    return 'Our bridal and formal pieces come in XS to XXL. If you are between two sizes, we usually suggest sizing up for a more comfortable drape — or our stylists can advise on the silhouette that suits your comfort best. Bring your measurements to the counter and we will help you match them to the catalog.';
  }

  if (/\b(price|cost|how much|budget|payment|pay)\b/.test(q)) {
    const cheapest = [...products].sort((a, b) => Number(a.price) - Number(b.price))[0];
    return cheapest
      ? `Our pieces start at ${formatPeso(cheapest.price)} for the ${cheapest.name}. Bridal gowns range up to around ${formatPeso(
          Math.max(...products.map((p) => Number(p.price)))
        )}. We accept GCash, Maya, bank transfer and cards in store.`
      : 'We accept GCash, Maya, bank transfer and cards in store.';
  }

  const categories = [...new Set(products.map((p) => p.category))];
  return `Happy to help. We carry ${categories.join(', ')}. Tell me the occasion and what you love — colour, style, fit — and I'll pull real pieces from our catalog for you. You can also ask me about sizing, delivery, returns or payment.`;
};

/**
 * Chat with the customer, walking the model chain until one answers.
 * Falls back to a helpful offline reply so the UI never shows a dead end.
 */
export async function chatReply({ message, history = [], preferences = null }) {
  const text = String(message || '').trim().slice(0, 1000);
  if (!text) throw new Error('Message is required.');

  let products = [];
  try {
    products = await getCatalog();
  } catch {
    products = [];
  }

  if (!GEMINI_API_KEY) {
    return { reply: localChatReply(text, products), provider: 'ElegAI offline stylist', offline: true };
  }

  const catalogContext = products.length
    ? `\n\nCURRENT CATALOG (name · category · colour · price):\n${buildCatalogBrief(products)
        .map((p) => `- ${p.name} · ${p.category} · ${p.color} · ${formatPeso(p.price)}`)
        .join('\n')}`
    : '';

  const prefContext = preferences?.occasion
    ? `\n\nSAVED CUSTOMER PREFERENCES\noccasion: ${preferences.occasion}${preferences.style ? `\nstyle: ${preferences.style}` : ''}${preferences.color ? `\ncolour: ${preferences.color}` : ''}${preferences.fit ? `\nfit: ${preferences.fit}` : ''}${preferences.size ? `\nsize: ${preferences.size}` : ''}`
    : '';

  const pastTurns = history
    .filter((m) => m && m.role && m.content)
    .slice(-MAX_HISTORY)
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: String(m.content).slice(0, 800) }],
    }));

  const failures = [];

  for (const model of TEXT_MODEL_CHAIN) {
    try {
      const data = await geminiRequest(model, {
        systemInstruction: { parts: [{ text: CHAT_SYSTEM_PROMPT + catalogContext + prefContext }] },
        contents: [
          ...pastTurns,
          { role: 'user', parts: [{ text }] },
        ],
        generationConfig: { temperature: 0.7, maxOutputTokens: 900 },
      }, { timeout: 15000 });
      return { reply: readGeminiText(data), provider: `Gemini (${model})` };
    } catch (err) {
      failures.push(`${model}: ${err.message}`);
      if (!isRetryable(err.message)) break;
    }
  }

  console.warn('[AI] chat models unavailable →', failures.join(' | '));
  return {
    reply: localChatReply(text, products),
    provider: 'ElegAI offline stylist',
    offline: true,
  };
}

/* ── 2. recommendations ────────────────────────────────────────────────── */

/** Turn a free-text chat message into structured preferences. */
export const parsePreferencesFromText = (message) => {
  const q = String(message || '').toLowerCase();
  const find = (map) => {
    for (const [needle, value] of Object.entries(map)) {
      if (q.includes(needle)) return value;
    }
    return '';
  };

  return {
    occasion: find({
      wedding: 'Wedding',
      cocktail: 'Cocktail Party',
      gala: 'Gala / Formal Ball',
      corporate: 'Corporate Event',
      graduation: 'Graduation',
      debut: 'Debut / Quinceañera',
      quinceanera: 'Debut / Quinceañera',
      engagement: 'Engagement',
      garden: 'Garden Party',
      'date night': 'Date Night',
      prom: 'Cocktail Party',
    }),
    style: find({
      elegant: 'Elegant',
      classic: 'Classic',
      modern: 'Modern',
      romantic: 'Romantic',
      vintage: 'Vintage',
      minimalist: 'Minimalist',
      bold: 'Bold / Statement',
      statement: 'Bold / Statement',
      traditional: 'Traditional',
    }),
    color: find({
      ivory: 'Ivory',
      white: 'White',
      gold: 'Gold',
      black: 'Black',
      navy: 'Navy',
      red: 'Red',
      green: 'Green',
      pink: 'Pink',
      champagne: 'Champagne',
      charcoal: 'Charcoal',
      gray: 'Gray',
      grey: 'Gray',
      emerald: 'Green',
      sapphire: 'Navy',
    }),
    fit: find({
      'a-line': 'A-Line',
      aline: 'A-Line',
      mermaid: 'Mermaid',
      'ball gown': 'Ball Gown',
      sheath: 'Sheath',
      'fit & flare': 'Fit & Flare',
      'fit-and-flare': 'Fit & Flare',
      'slim fit': 'Slim Fit',
      tailored: 'Tailored',
      'relaxed fit': 'Relaxed Fit',
    }),
    size: find({
      xs: 'XS',
      ' size s': 'S',
      ' size m': 'M',
      ' size l': 'L',
      xl: 'XL',
      xxl: 'XXL',
    }),
  };
};

/**
 * Product recommendations for a set of preferences. Uses Gemini when the
 * catalog is known, otherwise the deterministic ElegAI Style Engine.
 */
export async function getRecommendations(prefs) {
  const products = await getCatalog();
  if (!products.length) {
    return {
      provider: 'ElegAI Style Engine',
      summary: 'Our collection is being refreshed — please check back soon.',
      recommendations: [],
    };
  }

  if (GEMINI_API_KEY) {
    const prompt = [
      PREFERENCES_SYSTEM_PROMPT,
      '',
      'CATALOG:',
      JSON.stringify(buildCatalogBrief(products)),
      '',
      'CUSTOMER PREFERENCES:',
      JSON.stringify(
        {
          occasion: prefs.occasion || '',
          style: prefs.style || '',
          color: prefs.color || '',
          fit: prefs.fit || '',
          size: prefs.size || '',
          notes: prefs.notes || '',
        },
        null,
        2
      ),
    ].join('\n');

    for (const model of ['gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-3.1-flash-lite', GEMINI_MODEL].filter(Boolean)) {
      try {
        const data = await geminiRequest(model, {
          systemInstruction: { parts: [{ text: PREFERENCES_SYSTEM_PROMPT }] },
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.6, maxOutputTokens: 1600 },
        }, { timeout: 20000 });
        const raw = extractJson(readGeminiText(data));
        if (raw && Array.isArray(raw.recommendations) && raw.recommendations.length) {
          const byId = new Map(products.map((p) => [Number(p.product_id), p]));
          const recs = raw.recommendations
            .slice(0, 6)
            .map((r) => {
              const product = byId.get(Number(r.product_id));
              if (!product) return null;
              return {
                product,
                reasons: Array.isArray(r.reasons) ? r.reasons.slice(0, 4) : [],
                score: 0,
              };
            })
            .filter(Boolean);
          if (recs.length) {
            return {
              provider: `Gemini (${model})`,
              summary: raw.summary || '',
              recommendations: recs,
            };
          }
        }
      } catch (err) {
        if (!isRetryable(err.message)) break;
      }
    }
  }

  const recs = localRecommend(prefs, products);
  const summary = recs.length
    ? `Based on your preferences for a ${prefs.occasion || 'formal'} occasion, here are the pieces our stylists would reach for first.`
    : 'We could not find strong matches — try adjusting your preferences.';
  return { provider: 'ElegAI Style Engine', summary, recommendations: recs };
}

/* ── 3. image generation ───────────────────────────────────────────────── */

/** Turn a customer request into a rich, safe fashion-visual prompt. */
export const buildImagePrompt = (request, preferences = {}) => {
  const detail = [
    preferences.occasion ? `${preferences.occasion} occasion` : '',
    preferences.style ? `${preferences.style} style` : '',
    preferences.color ? `${preferences.color} colour` : '',
    preferences.fit ? `${preferences.fit} silhouette` : '',
  ]
    .filter(Boolean)
    .join(', ');

  return [
    'High-end fashion editorial photograph of an elegant formal outfit.',
    detail,
    String(request || '').slice(0, 400),
    'Full-length, model in a bright elegant boutique, soft natural studio lighting, clean neutral background, tasteful and modest, no text, no watermark.',
  ]
    .filter(Boolean)
    .join(' ');
};

/** True when the Gemini image failure means the whole key set is capped. */
const GEMINI_IMAGE_BLOCKED = /limit:\s*0|exceeded your current quota|RESOURCE_EXHAUSTED|\b429\b/i;
/** Specifically the "free tier has no image quota" case (billing not enabled). */
const GEMINI_IMAGE_BILLING = /limit:\s*0/i;

/** Try every Gemini image model (paid feature). Throws with the failure list. */
const geminiImage = async (prompt) => {
  if (!GEMINI_API_KEY) throw new Error('No Gemini key configured.');
  const failures = [];

  for (const model of GEMINI_IMAGE_CHAIN) {
    try {
      const data = await geminiRequest(
        model,
        {
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { responseModalities: ['IMAGE'] },
        },
        { timeout: 90000 }
      );

      const parts = data?.candidates?.[0]?.content?.parts || [];
      const image = parts.find((p) => p.inlineData?.data || p.inline_data?.data);
      if (image) {
        const payload = image.inlineData || image.inline_data;
        return {
          imageBase64: payload.data,
          mimeType: payload.mimeType || payload.mime_type || 'image/png',
          source: `Gemini · ${model}`,
        };
      }
      failures.push(`${model}: no image in response`);
    } catch (err) {
      failures.push(`${model}: ${err.message}`);
      // A hard cap (billing/quota) applies to every image model on this key.
      if (GEMINI_IMAGE_BLOCKED.test(err.message)) break;
    }
  }

  const error = new Error(failures.join(' | ') || 'No Gemini image model is available.');
  error.gemini = true;
  throw error;
};

/** Real image generation through OpenAI (needs an API key with credits). */
const openaiImage = async (prompt) => {
  if (!OPENAI_API_KEY) throw new Error('No OpenAI key configured.');
  const res = await fetch(`${OPENAI_BASE}/images/generations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_IMAGE_MODEL,
      prompt: prompt.slice(0, 4000),
      size: '1024x1024',
      n: 1,
    }),
    signal: AbortSignal.timeout(120000),
  });

  if (!res.ok) {
    let detail = `OpenAI responded with HTTP ${res.status}`;
    try {
      const data = await res.json();
      detail = data?.error?.message || detail;
    } catch {
      /* keep the status message */
    }
    throw new Error(detail);
  }

  const data = await res.json();
  const b64 = data?.data?.[0]?.b64_json;
  if (!b64) throw new Error('OpenAI returned no image.');
  return {
    imageBase64: b64,
    mimeType: 'image/png',
    source: `OpenAI · ${OPENAI_IMAGE_MODEL}`,
  };
};

/** Free, no-key image provider — keeps the feature alive without billing. */
const pollinationsImage = async (prompt) => {
  const encoded = encodeURIComponent(prompt.slice(0, 480));
  const seed = Date.now() % 100000;

  // With a token, use the reliable endpoint (the `flux` model is free).
  // Without one, fall back to the anonymous legacy endpoint (rate-limited).
  const url = POLLINATIONS_TOKEN
    ? `https://gen.pollinations.ai/image/${encoded}?model=flux&width=1024&height=1024&nologo=true&seed=${seed}`
    : `https://image.pollinations.ai/prompt/${encoded}?width=768&height=768&nologo=true&seed=${seed}`;

  const res = await fetch(url, {
    headers: POLLINATIONS_TOKEN ? { Authorization: `Bearer ${POLLINATIONS_TOKEN}` } : {},
    signal: AbortSignal.timeout(90000),
  });
  if (!res.ok) throw new Error(`Free provider responded with HTTP ${res.status}`);
  const contentType = res.headers.get('content-type') || 'image/jpeg';
  if (!contentType.startsWith('image/')) throw new Error('Free provider returned a non-image response.');
  const buffer = Buffer.from(await res.arrayBuffer());
  return {
    imageBase64: buffer.toString('base64'),
    mimeType: contentType,
    source: `ElegAI free renderer (Flux${POLLINATIONS_TOKEN ? '' : ' · anonymous'})`,
  };
};

/** Sniff an image MIME type from a content-type header and/or the bytes. */
const detectImageMime = (contentType, buffer) => {
  const ct = String(contentType || '').toLowerCase();
  if (ct.includes('webp')) return 'image/webp';
  if (ct.includes('png')) return 'image/png';
  if (ct.includes('jpeg') || ct.includes('jpg')) return 'image/jpeg';
  if (buffer.length > 8 && buffer[0] === 0x89 && buffer[1] === 0x50) return 'image/png';
  if (buffer.length > 12 && buffer.subarray(8, 12).toString('ascii') === 'WEBP') return 'image/webp';
  if (buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8) return 'image/jpeg';
  return 'image/jpeg';
};

/**
 * Stable Horde (aihorde.net) — a free, community-run GPU network that needs no
 * signup (anonymous key "0000000000"). Jobs are queued, so it can take 30s to a
 * couple of minutes; we poll until done or the wait limit is reached.
 */
const hordeImage = async (prompt, { maxWaitMs = 180000 } = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    apikey: HORDE_API_KEY || '0000000000',
    'Client-Agent': HORDE_CLIENT,
  };

  const submitRes = await fetch(`${HORDE_BASE}/generate/async`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      prompt: prompt.slice(0, 1500),
      params: { width: 512, height: 768, steps: 25, cfg_scale: 7, sampler_name: 'k_euler', n: 1 },
      models: ['Dreamshaper', 'Juggernaut XL', 'Realistic Vision', 'stable_diffusion'],
      nsfw: false,
      censor_nsfw: true,
      trusted_workers: false,
      slow_workers: true,
    }),
    signal: AbortSignal.timeout(20000),
  });

  if (!submitRes.ok) {
    const text = await submitRes.text().catch(() => '');
    throw new Error(`Horde rejected the job (HTTP ${submitRes.status}) ${text.slice(0, 120)}`);
  }
  const { id, message } = await submitRes.json();
  if (!id) throw new Error(message || 'Horde did not return a job id.');

  const deadline = Date.now() + maxWaitMs;
  while (Date.now() < deadline) {
    await sleep(4000);
    const check = await (
      await fetch(`${HORDE_BASE}/generate/check/${id}`, { headers, signal: AbortSignal.timeout(15000) })
    ).json();
    if (check?.faulted) throw new Error('Horde job faulted.');
    if (!check?.done) continue;

    const status = await (
      await fetch(`${HORDE_BASE}/generate/status/${id}`, { headers, signal: AbortSignal.timeout(20000) })
    ).json();
    const gen = (status?.generations || [])[0];
    if (!gen?.img) throw new Error('Horde returned no image.');
    if (gen.censored) throw new Error('Horde censored the result.');

    let buffer;
    let mimeType;
    const img = String(gen.img);
    if (img.startsWith('http')) {
      const imgRes = await fetch(img, { signal: AbortSignal.timeout(30000) });
      if (!imgRes.ok) throw new Error(`Could not download Horde image (HTTP ${imgRes.status}).`);
      buffer = Buffer.from(await imgRes.arrayBuffer());
      mimeType = detectImageMime(imgRes.headers.get('content-type'), buffer);
    } else {
      buffer = Buffer.from(img.replace(/^data:image\/\w+;base64,/, ''), 'base64');
      mimeType = detectImageMime('', buffer);
    }

    return {
      imageBase64: buffer.toString('base64'),
      mimeType,
      source: `Stable Horde · ${gen.model || 'community model'}`,
    };
  }

  throw new Error('Horde queue was too long — no image within the time limit.');
};

/** Explain, once, that the premium (paid) path is what's gated. */
const freeTierNotice = (failures) =>
  failures.some((f) => GEMINI_IMAGE_BILLING.test(f))
    ? 'Rendered with a free provider. Gemini image generation needs billing enabled on your Google AI Studio project — the free tier allows 0 images (limit: 0). Enable billing at https://ai.google.dev/gemini-api/docs/billing to use the premium on-brand models.'
    : 'The premium image models were unavailable, so this look was rendered with a free provider.';

/**
 * Generate an outfit image using a provider ladder (best → free):
 *   1. Gemini image models   — highest quality, requires billing enabled.
 *   2. OpenAI gpt-image      — real provider, requires API credits.
 *   3. Pollinations (Flux)   — fast free renderer, no key needed (token optional).
 *   4. Stable Horde          — free community GPUs, no signup, but slower.
 * The response always reports which provider rendered the image, plus an
 * actionable notice when a free provider stepped in.
 */
export async function generateOutfitImage({ request, preferences = {} }) {
  const prompt = buildImagePrompt(request, preferences);
  const failures = [];

  // 1. Gemini (best quality — needs billing).
  try {
    return { ...(await geminiImage(prompt)), prompt, provider: 'gemini' };
  } catch (err) {
    failures.push(`Gemini: ${err.message}`);
    console.warn('[AI] Gemini image unavailable →', err.message.split('\n')[0]);
  }

  // 2. OpenAI gpt-image (needs credits).
  if (OPENAI_API_KEY) {
    try {
      return { ...(await openaiImage(prompt)), prompt, provider: 'openai' };
    } catch (err) {
      failures.push(`OpenAI: ${err.message}`);
      console.warn('[AI] OpenAI image unavailable →', err.message.split('\n')[0]);
    }
  }

  // 3. Pollinations — fast and free (anonymous or with a free token).
  try {
    return { ...(await pollinationsImage(prompt)), prompt, provider: 'pollinations', notice: freeTierNotice(failures) };
  } catch (err) {
    failures.push(`Pollinations: ${err.message}`);
    console.warn('[AI] Pollinations unavailable →', err.message.split('\n')[0]);
  }

  // 4. Stable Horde — free community GPUs, no signup, but queued.
  try {
    const horde = await hordeImage(prompt);
    return {
      ...horde,
      prompt,
      provider: 'horde',
      notice: `${freeTierNotice(failures)} Stable Horde is a free community GPU network, so it can take a minute or two.`,
    };
  } catch (err) {
    failures.push(`Stable Horde: ${err.message}`);
    console.warn('[AI] Stable Horde unavailable →', err.message.split('\n')[0]);
  }

  const error = new Error(
    'Image generation is temporarily unavailable. Enable billing on your Google AI Studio project for ' +
      'Gemini images, or try again in a moment — the free renderers are busy.'
  );
  error.status = 503;
  error.details = failures;
  throw error;
}