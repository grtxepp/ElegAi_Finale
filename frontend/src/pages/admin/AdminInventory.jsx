import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, Search } from 'lucide-react';
import api, { errMsg } from '../../api/client.js';
import { imgUrl } from '../../utils/format.js';
import Spinner from '../../components/Spinner.jsx';
import { EmptyState, ErrorState } from '../../components/StateComponents.jsx';

export default function AdminInventory() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null); // product_id
  const [value, setValue] = useState('');

  const load = () => {
    setLoading(true);
    api
      .get('/admin/products', { params: { q } })
      .then(({ data }) => setItems(data.items))
      .catch((e) => setError(errMsg(e)))
      .finally(() => setLoading(false));
  };

  useEffect(load, [q]);

  const adjust = async (product, delta) => {
    try {
      await api.put(`/admin/inventory/${product.product_id}`, { delta });
      load();
    } catch (e) {
      alert(errMsg(e));
    }
  };

  const saveStock = async (productId) => {
    try {
      await api.put(`/admin/inventory/${productId}`, { stock: Number(value) });
      setEditing(null);
      load();
    } catch (e) {
      alert(errMsg(e));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-charcoal">Inventory</h1>
          <p className="text-sm text-gray">Monitor and adjust stock levels across the catalog.</p>
        </div>
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-light" />
          <input className="input !pl-10" placeholder="Search products…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : items.length === 0 ? (
        <EmptyState title="No products found" />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead>
              <tr className="border-b border-charcoal/10 text-xs uppercase tracking-wider text-gray">
                <th className="px-5 py-3">Product</th>
                <th className="px-5 py-3">Stock</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Adjust</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal/5">
              {items.map((p) => (
                <tr key={p.product_id} className="hover:bg-ivory/40">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <img src={imgUrl(p.image_url)} alt={p.name} className="h-12 w-10 rounded-lg object-cover" />
                      <div>
                        <Link to={`/admin/products/${p.product_id}/edit`} className="font-medium text-charcoal hover:text-gold-dark">
                          {p.name}
                        </Link>
                        <p className="text-xs text-gray-light">{p.category}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    {editing === p.product_id ? (
                      <input
                        autoFocus
                        type="number"
                        min="0"
                        className="input !w-24 !py-1.5 text-sm"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && saveStock(p.product_id)}
                        onBlur={() => saveStock(p.product_id)}
                      />
                    ) : (
                      <span
                        className={`cursor-pointer rounded-lg px-2 py-1 font-semibold ${
                          p.stock <= 5 ? 'bg-amber-100 text-amber-800' : p.stock === 0 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-800'
                        }`}
                        onClick={() => {
                          setEditing(p.product_id);
                          setValue(String(p.stock));
                        }}
                        title="Click to edit"
                      >
                        {p.stock}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-gray">
                    {p.stock === 0 ? 'Out of stock' : p.stock <= 5 ? 'Low stock' : 'In stock'}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => adjust(p, -1)}
                        disabled={p.stock <= 0}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-ivory-dark/70 text-charcoal transition hover:bg-red-600 hover:text-white disabled:opacity-40"
                        aria-label="Decrease stock"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => adjust(p, 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-ivory-dark/70 text-charcoal transition hover:bg-emerald-600 hover:text-white"
                        aria-label="Increase stock"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
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
