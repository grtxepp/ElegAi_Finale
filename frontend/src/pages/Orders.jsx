import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package } from 'lucide-react';
import api, { errMsg } from '../api/client.js';
import { formatPeso, formatDateTime } from '../utils/format.js';
import StatusBadge from '../components/StatusBadge.jsx';
import { EmptyState, ErrorState } from '../components/StateComponents.jsx';
import Spinner from '../components/Spinner.jsx';

const STATUS_FILTERS = ['All', 'Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/orders')
      .then(({ data }) => setOrders(data.orders))
      .catch((e) => setError(errMsg(e)))
      .finally(() => setLoading(false));
  }, []);

  const visible = filter === 'All' ? orders : orders.filter((o) => o.status === filter);

  return (
    <div className="container-app py-12">
      <p className="eyebrow">Order history</p>
      <h1 className="mt-2 font-display text-4xl font-semibold text-charcoal">My orders</h1>

      <div className="mt-6 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
              filter === s
                ? 'border-charcoal bg-charcoal text-white'
                : 'border-charcoal/15 bg-white text-charcoal hover:border-gold'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {error ? (
          <ErrorState message={error} onRetry={() => window.location.reload()} />
        ) : loading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : visible.length === 0 ? (
          <EmptyState
            title={filter === 'All' ? 'No orders yet' : `No ${filter.toLowerCase()} orders`}
            message="Your orders will appear here once you check out."
            action={<Link to="/catalog" className="btn-gold !px-5 !py-2 text-sm">Browse catalog</Link>}
          />
        ) : (
          <div className="space-y-4">
            {visible.map((o) => (
              <Link key={o.order_id} to={`/orders/${o.order_id}`} className="card block p-5 transition hover:shadow-lift">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold/15 text-gold-dark">
                      <Package className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-charcoal">Order #{o.order_id}</div>
                      <div className="text-sm text-gray">
                        {formatDateTime(o.created_at)} · {o.item_count} item{o.item_count === 1 ? '' : 's'} ·{' '}
                        {o.payment_method}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-display text-lg font-semibold text-gold-dark">
                      {formatPeso(o.total_amount)}
                    </span>
                    <StatusBadge status={o.status} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
