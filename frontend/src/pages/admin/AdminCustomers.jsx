import { useEffect, useState } from 'react';
import { Search, Mail, KeyRound, Copy, Check, X } from 'lucide-react';
import api, { errMsg } from '../../api/client.js';
import { formatPeso, formatDate } from '../../utils/format.js';
import Spinner from '../../components/Spinner.jsx';
import { EmptyState, ErrorState } from '../../components/StateComponents.jsx';

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [resetFor, setResetFor] = useState(null);
  const [resetCode, setResetCode] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setLoading(true);
    api
      .get('/admin/customers', { params: { q } })
      .then(({ data }) => setCustomers(data.customers))
      .catch((e) => setError(errMsg(e)))
      .finally(() => setLoading(false));
  }, [q]);

  const openReset = async (customer) => {
    setResetFor(customer);
    setResetCode('');
    setResetError('');
    setCopied(false);
    setResetLoading(true);
    try {
      const { data } = await api.post(`/admin/customers/${customer.user_id}/reset-code`);
      setResetCode(data.code);
    } catch (e) {
      setResetError(errMsg(e));
    } finally {
      setResetLoading(false);
    }
  };

  const closeReset = () => {
    if (resetLoading) return;
    setResetFor(null);
    setResetCode('');
    setResetError('');
    setCopied(false);
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(resetCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setResetError('Could not copy automatically. Select the code and copy it manually.');
    }
  };

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
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead>
              <tr className="border-b border-charcoal/10 text-xs uppercase tracking-wider text-gray">
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Joined</th>
                <th className="px-5 py-3">Orders</th>
                <th className="px-5 py-3">Total spent</th>
                <th className="px-5 py-3 text-right">Actions</th>
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
                  <td className="px-5 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => openReset(c)}
                      className="btn-outline !px-4 !py-2 text-xs"
                    >
                      <KeyRound className="h-3.5 w-3.5" />
                      Reset password
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {resetFor && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-code-title"
          onClick={closeReset}
        >
          <div className="card w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="eyebrow">Password reset</p>
                <h2 id="reset-code-title" className="mt-1 font-display text-xl font-semibold text-charcoal">
                  {resetFor.name}
                </h2>
                <p className="text-xs text-gray-light">{resetFor.email}</p>
              </div>
              <button
                type="button"
                onClick={closeReset}
                className="rounded-full p-1 text-gray transition-colors hover:bg-ivory-dark"
                aria-label="Close"
                disabled={resetLoading}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {resetLoading ? (
              <div className="flex justify-center py-10"><Spinner /></div>
            ) : resetCode ? (
              <>
                <p className="mt-4 text-sm text-gray">
                  Share this code with the customer. They enter it on the reset page with their email and a new password.
                </p>
                <div className="mt-5 rounded-xl border border-gold/30 bg-ivory px-5 py-4 text-center">
                  <span className="font-mono text-3xl font-bold tracking-[0.35em] text-charcoal">{resetCode}</span>
                </div>
                <p className="mt-2 text-center text-xs text-gray">
                  Expires in 15 minutes. Generating a new code cancels this one.
                </p>
                <button type="button" onClick={copyCode} className="btn-outline mt-4 w-full">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Copied' : 'Copy code'}
                </button>
                {resetError && <p className="mt-3 text-center text-xs text-red-600">{resetError}</p>}
                <p className="mt-3 text-center text-xs text-gray-light">
                  Customer page: <span className="font-medium text-charcoal">/reset-password</span>
                </p>
              </>
            ) : (
              <>
                <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {resetError || 'Could not generate a reset code.'}
                </div>
                <button type="button" onClick={() => openReset(resetFor)} className="btn-outline mt-4 w-full">
                  Try again
                </button>
              </>
            )}

            <button type="button" onClick={closeReset} className="btn-dark mt-3 w-full" disabled={resetLoading}>
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
