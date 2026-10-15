export default function Spinner({ className = '' }) {
  return (
    <div className={`flex items-center justify-center ${className}`} role="status">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold/30 border-t-gold" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
