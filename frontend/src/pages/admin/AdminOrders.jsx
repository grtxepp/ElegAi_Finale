import { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import api, { errMsg } from '../../api/client.js';
import { formatPeso, formatDateTime } from '../../utils/format.js';
import StatusBadge from '../../components/StatusBadge.jsx';
import Spinner from '../../components/Spinner.jsx';
import { EmptyState, ErrorState } from '../../components/StateComponents.jsx';

const STATUSES = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = () => {
    setLoading(true);
    api
      .get('/admin/orders', { params: filter ? { status: filter } : {} })
      .then(({ data }) => setOrders(data.orders))
      .catch((e) => setError(errMsg(e)))
      .finally(() => setLoading(false));
  };

  useEffect(load, [filter]);

  const changeStatus = async (orderId, status) => {
    setBusyId(orderId);
    try {
      await api.put(`/admin/orders/${orderId}/status`, { status });
      load();
    } catch (e) {
      alert(errMsg(e));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-charcoal">Order management</h1>
          <p className="text-sm text-gray">Move orders through fulfilment and track every status.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('')}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${!filter ? 'border-charcoal bg-charcoal text-white' : 'border-charcoal/15 bg-white text-charcoal'}`}
          >
            All
          </button>
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${filter === s ? 'border-charcoal bg-charcoal text-white' : 'border-charcoal/15 bg-white text-charcoal'}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : orders.length === 0 ? (
        <EmptyState title="No orders here" message="No orders match this status filter." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-charcoal/10 text-xs uppercase tracking-wider text-gray">
                <th className="px-5 py-3">Order</th>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Placed</th>
                <th className="px-5 py-3">Payment</th>
                <th className="px-5 py-3">Total</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal/5">
              {orders.map((o) => (
                <tr key={o.order_id} className="hover:bg-ivory/40">
                  <td className="px-5 py-3 font-semibold text-charcoal">
                    #{o.order_id}
                    <span className="ml-2 text-xs font-normal text-gray-light">({o.item_count} items)</span>
                  </td>
                  <td className="px-5 py-3">
                    <p className="font-medium text-charcoal">{o.customer}</p>
                    <p className="text-xs text-gray-light">{o.email}</p>
                  </td>
                  <td className="px-5 py-3 text-gray">{formatDateTime(o.created_at)}</td>
                  <td className="px-5 py-3 text-gray">{o.payment_method}</td>
                  <td className="px-5 py-3 font-semibold text-gold-dark">{formatPeso(o.total_amount)}</td>
                  <td className="px-5 py-3">
                    <div className="relative inline-block">
                      <select
                        value={o.status}
                        disabled={busyId === o.order_id}
                        onChange={(e) => changeStatus(o.order_id, e.target.value)}
                        className="appearance-none rounded-xl border border-charcoal/15 bg-white py-2 pl-3 pr-8 text-xs font-semibold text-charcoal focus:border-gold focus:outline-none disabled:opacity-60"
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-light" />
                    </div>
                    <div className="mt-1.5"><StatusBadge status={o.status} /></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
