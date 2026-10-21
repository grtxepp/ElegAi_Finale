import { useEffect, useState } from 'react';
import { Mail, Ruler, MessageSquare, ImageIcon, Send, Check } from 'lucide-react';
import api, { errMsg } from '../../api/client.js';
import { formatDate } from '../../utils/format.js';
import Spinner from '../../components/Spinner.jsx';
import { EmptyState, ErrorState } from '../../components/StateComponents.jsx';

const FILTERS = ['All', 'New', 'In Review', 'Fulfilled', 'Declined'];

const STATUS_STYLES = {
  New: 'bg-gold/15 text-gold-dark',
  'In Review': 'bg-amber-100 text-amber-800',
  Fulfilled: 'bg-emerald-100 text-emerald-800',
  Declined: 'bg-red-100 text-red-700',
};

export default function AdminRequests() {
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(null);
  const [noteDrafts, setNoteDrafts] = useState({});
  const [savingNote, setSavingNote] = useState(null);
  const [savedNote, setSavedNote] = useState(null);
  const [noteErrors, setNoteErrors] = useState({});

  const load = () => {
    setLoading(true);
    setError('');
    api
      .get('/admin/look-requests', { params: filter === 'All' ? {} : { status: filter } })
      .then(({ data }) => {
        setRequests(data.requests);
        setNoteDrafts(Object.fromEntries(data.requests.map((r) => [r.request_id, r.admin_note || ''])));
      })
      .catch((e) => setError(errMsg(e)))
      .finally(() => setLoading(false));
  };

  useEffect(load, [filter]);

  const updateStatus = async (id, status) => {
    setUpdating(id);
    try {
      await api.put(`/admin/look-requests/${id}`, { status });
      setRequests((prev) => prev.map((r) => (r.request_id === id ? { ...r, status } : r)));
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setUpdating(null);
    }
  };

  const saveNote = async (id) => {
    const note = (noteDrafts[id] ?? '').trim();
    setSavingNote(id);
    setNoteErrors((prev) => ({ ...prev, [id]: '' }));
    try {
      await api.put(`/admin/look-requests/${id}`, { adminNote: note });
      setRequests((prev) =>
        prev.map((r) =>
          r.request_id === id ? { ...r, admin_note: note || null, updated_at: new Date().toISOString() } : r
        )
      );
      setNoteDrafts((prev) => ({ ...prev, [id]: note }));
      setSavedNote(id);
      setTimeout(() => setSavedNote((value) => (value === id ? null : value)), 2000);
    } catch (e) {
      setNoteErrors((prev) => ({ ...prev, [id]: errMsg(e) }));
    } finally {
      setSavingNote(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-charcoal">Style requests</h1>
        <p className="text-sm text-gray">
          Looks customers generated and sent to the boutique, with their sizing and notes.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
              filter === f
                ? 'border-gold bg-gold text-white'
                : 'border-charcoal/15 bg-white text-charcoal hover:border-gold'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : requests.length === 0 ? (
        <EmptyState title="No requests yet" message="Requests sent from the AI Stylist will appear here." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {requests.map((r) => (
            <article key={r.request_id} className="card space-y-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-charcoal">#{r.request_id} · {r.customer}</p>
                  <p className="flex items-center gap-1 truncate text-xs text-gray-light">
                    <Mail className="h-3 w-3" /> {r.email}
                  </p>
                  <p className="text-xs text-gray-light">{formatDate(r.created_at)}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS_STYLES[r.status] || 'bg-ivory-dark text-charcoal'}`}>
                  {r.status}
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-[120px_1fr]">
                <div className="flex h-[120px] w-full items-center justify-center overflow-hidden rounded-xl bg-ivory-dark/60">
                  {r.image_data ? (
                    <img src={r.image_data} alt="Requested look" className="h-full w-full object-cover" />
                  ) : (
                    <ImageIcon className="h-6 w-6 text-gray-light" />
                  )}
                </div>
                <div className="space-y-1.5 text-xs text-gray">
                  {r.prompt && <p className="line-clamp-3 leading-relaxed">{r.prompt}</p>}
                  {r.sizing && (
                    <p className="flex items-center gap-1 text-charcoal">
                      <Ruler className="h-3.5 w-3.5 text-gold-dark" /> Size: {r.sizing}
                    </p>
                  )}
                  {r.measurements && (
                    <p><span className="font-medium text-charcoal">Measurements:</span> {r.measurements}</p>
                  )}
                  {r.notes && (
                    <p className="flex items-start gap-1">
                      <MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-dark" /> {r.notes}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 border-t border-charcoal/10 pt-3">
                <label className="text-xs font-medium text-gray" htmlFor={`status-${r.request_id}`}>Update status</label>
                <select
                  id={`status-${r.request_id}`}
                  className="input !w-auto !py-1.5 text-xs"
                  value={r.status}
                  disabled={updating === r.request_id}
                  onChange={(e) => updateStatus(r.request_id, e.target.value)}
                >
                  {['New', 'In Review', 'Fulfilled', 'Declined'].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="border-t border-charcoal/10 pt-3">
                <label className="text-xs font-medium text-gray" htmlFor={`note-${r.request_id}`}>
                  Message to customer
                </label>
                <textarea
                  id={`note-${r.request_id}`}
                  rows={2}
                  maxLength={2000}
                  className="input mt-1.5 w-full !py-2 text-xs"
                  placeholder="Share progress or ask for details…"
                  value={noteDrafts[r.request_id] ?? ''}
                  onChange={(e) =>
                    setNoteDrafts((prev) => ({ ...prev, [r.request_id]: e.target.value }))
                  }
                />
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] text-gray-light">
                    The customer sees this on their My Requests page.
                  </span>
                  <button
                    type="button"
                    onClick={() => saveNote(r.request_id)}
                    className="btn-outline !px-3 !py-1.5 text-[11px]"
                    disabled={
                      savingNote === r.request_id ||
                      (noteDrafts[r.request_id] ?? '') === (r.admin_note ?? '')
                    }
                  >
                    {savingNote === r.request_id ? (
                      'Saving…'
                    ) : savedNote === r.request_id ? (
                      <><Check className="h-3.5 w-3.5" /> Saved</>
                    ) : (
                      <><Send className="h-3.5 w-3.5" /> Save reply</>
                    )}
                  </button>
                </div>
                {noteErrors[r.request_id] && (
                  <p className="mt-1 text-[11px] text-red-600">{noteErrors[r.request_id]}</p>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
