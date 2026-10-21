import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, ShoppingBag, Sparkles, Palette, ArrowRight, ClipboardList } from 'lucide-react';
import api, { errMsg } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { formatPeso, formatDate } from '../utils/format.js';
import StatusBadge from '../components/StatusBadge.jsx';
import { EmptyState, ErrorState } from '../components/StateComponents.jsx';

export default function Dashboard() {
  const { user } = useAuth();
  const { cart } = useCart();
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/orders')
      .then(({ data }) => setOrders(data.orders))
      .catch((e) => setError(errMsg(e)))
      .finally(() => setLoading(false));
  }, []);

  const stats = [
    { label: 'Total orders', value: String(orders.length), icon: Package },
    { label: 'Items in cart', value: String(cart.count), icon: ShoppingBag },
    { label: 'Saved style', value: user?.profile?.preferredStyle || '—', icon: Palette },
  ];

  return (
    <div className="container-app py-12">
      <p className="eyebrow">Welcome back</p>
      <h1 className="mt-2 font-display text-4xl font-semibold text-charcoal">
        Hello, {user?.name?.split(' ')[0] || 'there'} 👋
      </h1>
      <p className="mt-2 text-gray">
        Here is a snapshot of your ElegAI journey. Your style profile powers the AI stylist.
      </p>

      {/* Quick actions */}
      <div className="mt-8 flex flex-wrap gap-3">
        <Link to="/stylist" className="btn-gold">
          <Sparkles className="h-4 w-4" /> Get AI recommendations
        </Link>
        <Link to="/catalog" className="btn-outline">
          Browse the collection <ArrowRight className="h-4 w-4" />
        </Link>
        <Link to="/requests" className="btn-outline">
          <ClipboardList className="h-4 w-4" /> My requests
        </Link>
        <Link to="/profile" className="btn-ghost text-sm">
          Edit style profile
        </Link>
      </div>

      {/* Stats */}
      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="card flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold/15 text-gold-dark">
              <s.icon className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-gray">{s.label}</div>
              <div className="font-display text-xl font-semibold text-charcoal">{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Style profile summary */}
      {user?.profile && (
        <div className="card mt-6 flex flex-wrap items-center gap-x-8 gap-y-3 p-6">
          <h3 className="font-display text-lg font-semibold text-charcoal">Your style profile</h3>
          {[
            ['Style', user.profile.preferredStyle],
            ['Color', user.profile.preferredColor],
            ['Fit', user.profile.preferredFit],
            ['Height', user.profile.heightCm ? `${user.profile.heightCm} cm` : null],
          ]
            .filter(([, v]) => v)
            .map(([k, v]) => (
              <div key={k}>
                <div className="text-xs uppercase tracking-wider text-gray">{k}</div>
                <div className="font-semibold text-charcoal">{v}</div>
              </div>
            ))}
        </div>
      )}

      {/* Recent orders */}
      <section className="mt-12">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-semibold text-charcoal">Recent orders</h2>
          <Link to="/orders" className="text-sm font-semibold text-gold-dark hover:underline">
            View all →
          </Link>
        </div>
        <div className="mt-5">
          {error ? (
            <ErrorState message={error} />
          ) : loading ? (
            <p className="text-sm text-gray">Loading orders…</p>
          ) : orders.length === 0 ? (
            <EmptyState
              title="No orders yet"
              message="When you place your first order, it will show up here."
              action={<Link to="/catalog" className="btn-gold !px-5 !py-2 text-sm">Start shopping</Link>}
            />
          ) : (
            <div className="space-y-3">
              {orders.slice(0, 4).map((o) => (
                <Link key={o.order_id} to={`/orders/${o.order_id}`} className="card flex flex-wrap items-center justify-between gap-3 p-5 transition hover:shadow-lift">
                  <div>
                    <div className="font-semibold text-charcoal">Order #{o.order_id}</div>
                    <div className="mt-0.5 text-sm text-gray">
                      {formatDate(o.created_at)} · {o.item_count} item{o.item_count === 1 ? '' : 's'}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-display text-lg font-semibold text-gold-dark">
                      {formatPeso(o.total_amount)}
                    </span>
                    <StatusBadge status={o.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
