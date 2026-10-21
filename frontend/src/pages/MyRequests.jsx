import { Fragment, useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Check,
  ImageIcon,
  MessageSquare,
  RefreshCw,
  Ruler,
  Sparkles,
  XCircle,
} from 'lucide-react';
import api, { errMsg } from '../api/client.js';
import { formatDateTime } from '../utils/format.js';
import StatusBadge from '../components/StatusBadge.jsx';
import Spinner from '../components/Spinner.jsx';
import { EmptyState, ErrorState } from '../components/StateComponents.jsx';

const STEPS = [
  { key: 'New', label: 'Submitted' },
  { key: 'In Review', label: 'In review' },
  { key: 'Fulfilled', label: 'Fulfilled' },
];

function Progress({ status }) {
  if (status === 'Declined') {
    return (
      <div className="flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
        <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
        <span>This request was declined. Contact the boutique if you need more details.</span>
      </div>
    );
  }

  const index = Math.max(0, STEPS.findIndex((step) => step.key === status));

  return (
    <div className="flex items-start">
      {STEPS.map((step, i) => (
        <Fragment key={step.key}>
          {i > 0 && (
            <div className={`mt-3 h-0.5 flex-1 ${i <= index ? 'bg-gold' : 'bg-charcoal/10'}`} />
          )}
          <div className="flex w-20 shrink-0 flex-col items-center gap-1.5">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${
                i <= index ? 'bg-gold text-white' : 'bg-ivory-dark text-gray'
              } ${i === index ? 'ring-4 ring-gold/15' : ''}`}
            >
              {i < index ? <Check className="h-3 w-3" /> : i + 1}
            </span>
            <span className={`text-center text-[11px] ${i <= index ? 'font-semibold text-charcoal' : 'text-gray-light'}`}>
              {step.label}
            </span>
          </div>
        </Fragment>
      ))}
    </div>
  );
}

export default function MyRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    api
      .get('/look-requests')
      .then(({ data }) => setRequests(data.requests))
      .catch((e) => setError(errMsg(e)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  return (
    <div className="container-app py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Style requests</p>
          <h1 className="mt-2 font-display text-4xl font-semibold text-charcoal">My requests</h1>
          <p className="mt-2 max-w-xl text-gray">
            Follow each look you sent to the boutique and read updates from our stylists.
          </p>
        </div>
        <button type="button" onClick={load} className="btn-outline !px-4 !py-2 text-xs" disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="mt-8">
        {error ? (
          <ErrorState message={error} onRetry={load} />
        ) : loading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : requests.length === 0 ? (
          <EmptyState
            title="No style requests yet"
            message="When you send a generated look to the boutique, you can track its progress here."
            action={
              <Link to="/stylist" className="btn-gold !px-5 !py-2 text-sm">
                <Sparkles className="h-4 w-4" /> Ask the AI Stylist
              </Link>
            }
          />
        ) : (
          <div className="space-y-5">
            {requests.map((r) => (
              <article key={r.request_id} className="card p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="font-display text-xl font-semibold text-charcoal">
                        Request #{r.request_id}
                      </h2>
                      <StatusBadge status={r.status} />
                    </div>
                    <p className="mt-1 text-xs text-gray-light">Sent {formatDateTime(r.created_at)}</p>
                  </div>
                  {(r.admin_note || r.status !== 'New') && r.updated_at && (
                    <p className="text-xs text-gray-light">Last updated {formatDateTime(r.updated_at)}</p>
                  )}
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-[140px_1fr]">
                  <div className="flex h-[140px] w-full items-center justify-center overflow-hidden rounded-xl bg-ivory-dark/60">
                    {r.image_data ? (
                      <img src={r.image_data} alt="Requested look" className="h-full w-full object-cover" />
                    ) : (
                      <ImageIcon className="h-7 w-7 text-gray-light" />
                    )}
                  </div>
                  <div className="space-y-2 text-sm text-gray">
                    {r.prompt && <p className="leading-relaxed">{r.prompt}</p>}
                    {r.sizing && (
                      <p className="flex items-center gap-1.5 text-charcoal">
                        <Ruler className="h-4 w-4 text-gold-dark" /> Size: {r.sizing}
                      </p>
                    )}
                    {r.measurements && (
                      <p>
                        <span className="font-medium text-charcoal">Measurements:</span> {r.measurements}
                      </p>
                    )}
                    {r.notes && (
                      <p className="flex items-start gap-1.5">
                        <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-gold-dark" />
                        {r.notes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-5 border-t border-charcoal/10 pt-4">
                  <Progress status={r.status} />
                </div>

                {r.admin_note && (
                  <div className="mt-4 rounded-xl border border-gold/30 bg-gold/5 p-4">
                    <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-gold-dark">
                      <MessageSquare className="h-3.5 w-3.5" /> Update from the boutique
                    </p>
                    <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-charcoal">
                      {r.admin_note}
                    </p>
                  </div>
                )}

                {!r.admin_note && r.status === 'New' && (
                  <p className="mt-4 text-xs text-gray-light">
                    We&apos;ve received your request. Updates from the boutique will appear here.
                  </p>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
