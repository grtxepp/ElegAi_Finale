import { API_BASE } from './config';

/** Format a number as Philippine pesos. */
export const formatPeso = (value) => {
  const n = Number(value || 0);
  return `₱${n.toLocaleString('en-PH', { maximumFractionDigits: 2 })}`;
};

/** Friendly short date. */
export const formatDate = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
};

export const formatDateTime = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString('en-PH', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
};

/** Absolute URL for a product image (backend serves /images and /uploads). */
export const imgUrl = (url) =>
  url ? `${API_BASE}${url}` : `${API_BASE}/images/cat-formal.jpg`;
