import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Banknote, ShoppingCart, Users, Package, AlertTriangle } from 'lucide-react';
import api, { errMsg } from '../../api/client.js';
import { formatPeso, formatDate, imgUrl } from '../../utils/format.js';
import StatusBadge from '../../components/StatusBadge.jsx';
import Spinner from '../../components/Spinner.jsx';
import { ErrorState } from '../../components/StateComponents.jsx';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/admin/stats')
      .then(({ data }) => setStats(data))
      .catch((e) => setError(errMsg(e)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex justify-center py-24"><Spinner /></div>;
  }
  if (error || !stats) {
    return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  }

  const cards = [
    { label: 'Total revenue', value: formatPeso(stats.revenue), icon: Banknote },
    { label: 'Orders', value: stats.orders, icon: ShoppingCart },
    { label: 'Customers', value: stats.customers, icon: Users },
    { label: 'Products', value: stats.products, icon: Package },
  ];

  // Bar chart data: last 14 days
  const days = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const row = stats.revenueByDay.find((r) => String(r.day).slice(0, 10) === key);
    days.push({ label: d.toLocaleDateString('en-PH', { day: 'numeric', month: 'short' }), total: row ? row.total : 0 });
  }
  const maxDay = Math.max(...days.map((d) => d.total), 1);

  const statusColors = {
    Pending: 'bg-amber-500', Confirmed: 'bg-blue-500', Processing: 'bg-violet-500',
    Shipped: 'bg-cyan-500', Delivered: 'bg-emerald-500', Cancelled: 'bg-red-500',
  };

  return (
    <div className="space-y-8">
      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="card flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold/15 text-gold-dark">
              <c.icon className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-gray">{c.label}</div>
              <div className="font-display text-2xl font-semibold text-charcoal">{c.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Revenue chart */}
        <div className="card p-6">
          <h2 className="font-display text-lg font-semibold text-charcoal">Revenue — last 14 days</h2>
          <div className="mt-6 flex h-48 items-end gap-1.5">
            {days.map((d, i) => (
              <div key={i} className="group relative flex flex-1 flex-col items-center justify-end" title={`${d.label}: ${formatPeso(d.total)}`}>
                <div
                  className="w-full rounded-t-md bg-gradient-to-t from-gold-dark to-gold-light transition-all group-hover:opacity-80"
                  style={{ height: `${Math.max((d.total / maxDay) * 100, 2)}%` }}
                />
                {i % 2 === 0 && <span className="mt-1.5 hidden text-[10px] text-gray-light sm:block">{d.label}</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Orders by status */}
        <div className="card p-6">
          <h2 className="font-display text-lg font-semibold text-charcoal">Orders by status</h2>
          <div className="mt-5 space-y-3">
            {stats.byStatus.map((s) => (
              <div key={s.status}>
                <div className="flex justify-between text-sm">
                  <span className="text-gray">{s.status}</span>
                  <span className="font-semibold text-charcoal">{s.count}</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-charcoal/5">
                  <div
                    className={`h-full rounded-full ${statusColors[s.status] || 'bg-gray-300'}`}
                    style={{ width: `${stats.orders ? (s.count / stats.orders) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
            {stats.lowStock > 0 && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {stats.lowStock} product{stats.lowStock === 1 ? '' : 's'} low on stock
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top products */}
        <div className="card p-6">
          <h2 className="font-display text-lg font-semibold text-charcoal">Top selling products</h2>
          <div className="mt-4 divide-y divide-charcoal/5">
            {stats.topProducts.map((p) => (
              <div key={p.product_id} className="flex items-center gap-3 py-3">
                <img src={imgUrl(p.image_url)} alt={p.name} className="h-12 w-10 rounded-lg object-cover" />
                <div className="flex-1">
                  <p className="truncate text-sm font-medium text-charcoal">{p.name}</p>
                  <p className="text-xs text-gray-light">{p.sold} sold</p>
                </div>
                <span className="text-sm font-semibold text-gold-dark">{formatPeso(p.product_revenue)}</span>
              </div>
            ))}
            {!stats.topProducts.length && <p className="mt-3 text-sm text-gray">No sales yet.</p>}
          </div>
        </div>

        {/* Recent orders */}
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-charcoal">Recent orders</h2>
            <Link to="/admin/orders" className="text-xs font-semibold text-gold-dark hover:underline">View all →</Link>
          </div>
          <div className="mt-4 space-y-3">
            {stats.recentOrders.map((o) => (
              <Link key={o.order_id} to="/admin/orders" className="flex items-center justify-between rounded-xl bg-ivory/60 p-3 transition hover:bg-ivory-dark/60">
                <div>
                  <p className="text-sm font-semibold text-charcoal">#{o.order_id} · {o.customer}</p>
                  <p className="text-xs text-gray-light">{formatDate(o.created_at)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold">{formatPeso(o.total_amount)}</span>
                  <StatusBadge status={o.status} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
