/** Format a number as Philippine pesos. */
export const formatPeso = (value) => {
  const n = Number(value || 0);
  return `₱${n.toLocaleString('en-PH', { maximumFractionDigits: 2 })}`;
};

/** Format an ISO/UTC date string to a friendly local date. */
export const formatDate = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateTime = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/** Build a stable image URL (relative works through the Vite proxy). */
export const imgUrl = (url) => url || '/images/cat-formal.jpg';
