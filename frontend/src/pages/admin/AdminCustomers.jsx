import { useEffect, useState } from 'react';
import { Search, Mail } from 'lucide-react';
import api, { errMsg } from '../../api/client.js';
import { formatPeso, formatDate } from '../../utils/format.js';
import Spinner from '../../components/Spinner.jsx';
import { EmptyState, ErrorState } from '../../components/StateComponents.jsx';

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    api
      .get('/admin/customers', { params: { q } })
      .then(({ data }) => setCustomers(data.customers))
      .catch((e) => setError(errMsg(e)))
      .finally(() => setLoading(false));
  }, [q]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-charcoal">Customers</h1>
          <p className="text-sm text-gray">Every registered customer and their spending summary.</p>
        </div>
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-light" />
          <input className="input !pl-10" placeholder="Search name or email…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={() => window.location.reload()} />
      ) : loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : customers.length === 0 ? (
        <EmptyState title="No customers found" message="Try a different search." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead>
              <tr className="border-b border-charcoal/10 text-xs uppercase tracking-wider text-gray">
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Joined</th>
                <th className="px-5 py-3">Orders</th>
                <th className="px-5 py-3">Total spent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal/5">
              {customers.map((c) => (
                <tr key={c.user_id} className="hover:bg-ivory/40">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/15 font-display text-sm font-semibold text-gold-dark">
                        {c.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
                      </div>
                      <div>
                        <p className="font-medium text-charcoal">{c.name}</p>
                        <p className="flex items-center gap-1 text-xs text-gray-light">
                          <Mail className="h-3 w-3" /> {c.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-gray">{formatDate(c.created_at)}</td>
                  <td className="px-5 py-3">
                    <span className="badge bg-ivory-dark text-charcoal">{c.order_count}</span>
                  </td>
                  <td className="px-5 py-3 font-semibold text-gold-dark">{formatPeso(c.total_spent)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
