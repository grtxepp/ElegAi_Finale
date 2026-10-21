const styles = {
  Pending: 'bg-amber-100 text-amber-800',
  Confirmed: 'bg-blue-100 text-blue-800',
  Processing: 'bg-violet-100 text-violet-800',
  Shipped: 'bg-cyan-100 text-cyan-800',
  Delivered: 'bg-emerald-100 text-emerald-800',
  Cancelled: 'bg-red-100 text-red-700',
  New: 'bg-gold/15 text-gold-dark',
  'In Review': 'bg-amber-100 text-amber-800',
  Fulfilled: 'bg-emerald-100 text-emerald-800',
  Declined: 'bg-red-100 text-red-700',
};

const dots = {
  Pending: 'bg-amber-500',
  Confirmed: 'bg-blue-500',
  Processing: 'bg-violet-500',
  Shipped: 'bg-cyan-500',
  Delivered: 'bg-emerald-500',
  Cancelled: 'bg-red-500',
  New: 'bg-gold',
  'In Review': 'bg-amber-500',
  Fulfilled: 'bg-emerald-500',
  Declined: 'bg-red-500',
};

export default function StatusBadge({ status }) {
  return (
    <span className={`badge ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dots[status] || 'bg-gray-400'}`} />
      {status}
    </span>
  );
}
