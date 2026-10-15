import { query } from '../config/db.js';

/**
 * ElegAI Style Engine — the deterministic, rule-based recommendation engine.
 * It scores every product in the database against the customer's occasion,
 * style, color, fit and size preferences and explains WHY each piece is
 * recommended. This engine is the always-available fallback and is also used
 * when no cloud LLM key is configured.
 */

export const OCCASIONS = [
  'Wedding',
  'Cocktail Party',
  'Gala / Formal Ball',
  'Corporate Event',
  'Graduation',
  'Debut / Quinceañera',
  'Engagement',
  'Garden Party',
  'Date Night',
];

export const STYLES = [
  'Elegant',
  'Classic',
  'Modern',
  'Romantic',
  'Vintage',
  'Minimalist',
  'Bold / Statement',
  'Traditional',
];

export const COLORS = [
  'Ivory', 'White', 'Gold', 'Black', 'Navy', 'Red', 'Green',
  'Pink', 'Champagne', 'Charcoal', 'Gray',
];

export const FITS = [
  'A-Line', 'Mermaid', 'Ball Gown', 'Sheath', 'Fit & Flare', 'Slim Fit', 'Tailored', 'Relaxed Fit',
];

export const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

/** How strongly each occasion points toward each category. */
const OCCASION_CATEGORY_WEIGHTS = {
  'Wedding': { 'Bridal Gowns': 0.95, 'Suits': 0.75, 'Barongs': 0.6, 'Accessories': 0.55, 'Formal Dresses': 0.4, 'Evening Gowns': 0.35 },
  'Gala / Formal Ball': { 'Evening Gowns': 0.95, 'Suits': 0.85, 'Formal Dresses': 0.55, 'Accessories': 0.5, 'Barongs': 0.4, 'Bridal Gowns': 0.35 },
  'Cocktail Party': { 'Formal Dresses': 0.9, 'Evening Gowns': 0.6, 'Suits': 0.55, 'Accessories': 0.45, 'Barongs': 0.35, 'Bridal Gowns': 0.15 },
  'Corporate Event': { 'Suits': 0.9, 'Formal Dresses': 0.75, 'Barongs': 0.55, 'Accessories': 0.4, 'Evening Gowns': 0.3, 'Bridal Gowns': 0.1 },
  'Graduation': { 'Formal Dresses': 0.85, 'Suits': 0.6, 'Evening Gowns': 0.55, 'Barongs': 0.5, 'Accessories': 0.5, 'Bridal Gowns': 0.1 },
  'Debut / Quinceañera': { 'Evening Gowns': 0.85, 'Formal Dresses': 0.8, 'Suits': 0.5, 'Accessories': 0.5, 'Barongs': 0.45, 'Bridal Gowns': 0.3 },
  'Engagement': { 'Evening Gowns': 0.7, 'Bridal Gowns': 0.6, 'Formal Dresses': 0.6, 'Suits': 0.6, 'Accessories': 0.6, 'Barongs': 0.5 },
  'Garden Party': { 'Formal Dresses': 0.8, 'Evening Gowns': 0.5, 'Barongs': 0.5, 'Accessories': 0.45, 'Suits': 0.4, 'Bridal Gowns': 0.2 },
  'Date Night': { 'Formal Dresses': 0.8, 'Evening Gowns': 0.6, 'Suits': 0.4, 'Accessories': 0.5, 'Bridal Gowns': 0.1, 'Barongs': 0.3 },
};

/** Keywords that indicate each style in product names/descriptions. */
const STYLE_KEYWORDS = {
  'Elegant': ['elegant', 'timeless', 'refined', 'satin', 'silk', 'classic', 'drape'],
  'Classic': ['classic', 'timeless', 'traditional', 'two-button', 'essential', 'bateau'],
  'Modern': ['modern', 'contemporary', 'slim-fit', 'slim', 'structured', 'statement', 'sharp'],
  'Romantic': ['romantic', 'lace', 'delicate', 'blush', 'soft', 'sweetheart', 'chiffon', 'illusion'],
  'Vintage': ['vintage', 'retro', 'heirloom', 'brooch'],
  'Minimalist': ['minimal', 'clean', 'simple', 'slip', 'sheath', 'bateau', 'bias'],
  'Bold / Statement': ['bold', 'statement', 'sequin', 'brocade', 'dramatic', 'crystal', 'velvet', 'scarlet'],
  'Traditional': ['traditional', 'barong', 'heritage', 'national', 'juspol', 'piña', 'pina'],
};

/** Related colors — soft matches get partial credit. */
const COLOR_GROUPS = {
  'Ivory': ['ivory', 'white', 'champagne', 'cream'],
  'White': ['white', 'ivory', 'champagne', 'cream'],
  'Gold': ['gold', 'champagne', 'ivory'],
  'Champagne': ['champagne', 'gold', 'ivory'],
  'Black': ['black', 'charcoal', 'navy', 'midnight'],
  'Navy': ['navy', 'black', 'midnight', 'charcoal'],
  'Charcoal': ['charcoal', 'gray', 'black', 'navy'],
  'Red': ['red', 'scarlet', 'burgundy'],
  'Green': ['green', 'emerald'],
  'Pink': ['pink', 'blush', 'rose'],
  'Gray': ['gray', 'charcoal'],
};

const FIT_KEYWORDS = {
  'A-Line': ['a-line', 'aline', 'a line'],
  'Mermaid': ['mermaid', 'column', 'fit-and-flare', 'fit & flare'],
  'Ball Gown': ['ball gown', 'ballgown', 'full tulle', 'princess', 'corseted'],
  'Sheath': ['sheath', 'slip', 'column', 'bias'],
  'Fit & Flare': ['fit-and-flare', 'fit & flare', 'mermaid'],
  'Slim Fit': ['slim-fit', 'slim', 'tapered', 'contemporary'],
  'Tailored': ['tailored', 'two-piece', 'canvassed', 'sharp'],
  'Relaxed Fit': ['relaxed', 'comfortable', 'breathable', 'lightweight'],
};

const normalize = (s) => String(s || '').toLowerCase().trim();
const hasAny = (haystack, words) => {
  const h = normalize(haystack);
  return words.some((w) => h.includes(normalize(w)));
};

/** All in-stock products from the real product database. */
export async function getCatalog() {
  const [rows] = await query('SELECT * FROM products WHERE stock > 0');
  return rows;
}

/**
 * Score and rank the catalog for a customer preference object.
 * Returns [{ product, score, reasons }] sorted best-first.
 */
export function localRecommend(prefs, products, limit = 6) {
  const occasion = prefs.occasion || '';
  const style = prefs.style || '';
  const color = prefs.color || '';
  const fit = prefs.fit || '';
  const size = prefs.size || '';
  const weights = OCCASION_CATEGORY_WEIGHTS[occasion] || {};

  const scored = [];
  for (const p of products) {
    const reasons = [];
    let score = 0;
    const text = `${p.name} ${p.description || ''}`;

    // Occasion → category fit
    const catWeight = weights[p.category];
    if (occasion && catWeight !== undefined) {
      score += catWeight * 10;
      if (catWeight >= 0.65) reasons.push(`Suitable for ${occasion} occasions`);
    }

    // Style
    if (style) {
      const kws = STYLE_KEYWORDS[style] || [];
      if (kws.length && hasAny(text, kws)) {
        score += 5;
        reasons.push(`Matches your ${style} style`);
      }
    }

    // Color
    if (color) {
      const productColor = normalize(p.color);
      if (productColor === normalize(color)) {
        score += 8;
        reasons.push(`Available in your preferred color (${p.color})`);
      } else if ((COLOR_GROUPS[color] || [color]).some((c) => productColor === normalize(c))) {
        score += 3;
        reasons.push(`Pairs beautifully with your preferred color ${color}`);
      }
    }

    // Fit / silhouette
    if (fit) {
      const kws = FIT_KEYWORDS[fit] || [];
      if (kws.length && hasAny(text, kws)) {
        score += 4;
        reasons.push(`Offers the ${fit} fit you prefer`);
      }
    }

    // Size availability
    if (size) {
      let sizes = [];
      try { sizes = JSON.parse(p.available_sizes); } catch { /* ignore */ }
      if (sizes.includes(size)) reasons.push(`Available in your selected size (${size})`);
      else if (sizes.includes('One Size')) reasons.push('Available as one-size-fits-all');
    }

    if (!reasons.length) reasons.push('A versatile piece for many formal occasions');

    scored.push({ product: p, score: Math.round(score), reasons });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}
