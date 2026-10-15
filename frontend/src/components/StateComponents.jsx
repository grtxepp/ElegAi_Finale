import { Inbox, AlertTriangle } from 'lucide-react';

/** Graceful empty state. */
export function EmptyState({ title = 'Nothing here yet', message, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-charcoal/15 bg-white/60 px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-ivory-dark">
        <Inbox className="h-7 w-7 text-gray-light" />
      </div>
      <h3 className="mt-4 font-display text-xl font-semibold text-charcoal">{title}</h3>
      {message && <p className="mt-2 max-w-md text-sm text-gray">{message}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

/** Friendly error state with retry. */
export function ErrorState({ message = 'Something went wrong.', onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-red-200 bg-red-50/60 px-6 py-14 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
        <AlertTriangle className="h-7 w-7 text-red-500" />
      </div>
      <h3 className="mt-4 font-display text-xl font-semibold text-charcoal">Oops</h3>
      <p className="mt-2 max-w-md text-sm text-gray">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-dark mt-6 !px-5 !py-2 text-sm">
          Try again
        </button>
      )}
    </div>
  );
}
