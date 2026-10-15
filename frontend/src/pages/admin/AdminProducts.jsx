import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Pencil, Trash2, Plus, Search } from 'lucide-react';
import api, { errMsg } from '../../api/client.js';
import { formatPeso, imgUrl } from '../../utils/format.js';
import Spinner from '../../components/Spinner.jsx';
import { EmptyState, ErrorState } from '../../components/StateComponents.jsx';

export default function AdminProducts() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    api
      .get('/admin/products', { params: { q } })
      .then(({ data }) => setItems(data.items))
      .catch((e) => setError(errMsg(e)))
      .finally(() => setLoading(false));
  };

  useEffect(load, [q]);

  const remove = async (product) => {
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/products/${product.product_id}`);
      load();
    } catch (e) {
      alert(errMsg(e));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-light" />
          <input className="input !pl-10" placeholder="Search products…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Link to="/admin/products/new" className="btn-gold !py-2.5 text-sm">
          <Plus className="h-4 w-4" /> Add product
        </Link>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : items.length === 0 ? (
        <EmptyState title="No products found" message="Try a different search or add a new product." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-charcoal/10 text-xs uppercase tracking-wider text-gray">
                <th className="px-5 py-3">Product</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Price</th>
                <th className="px-5 py-3">Stock</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal/5">
              {items.map((p) => (
                <tr key={p.product_id} className="hover:bg-ivory/40">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <img src={imgUrl(p.image_url)} alt={p.name} className="h-12 w-10 rounded-lg object-cover" />
                      <div>
                        <p className="font-medium text-charcoal">{p.name}</p>
                        <p className="text-xs text-gray-light">{p.color} · {p.available_sizes.join(', ')}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-gray">{p.category}</td>
                  <td className="px-5 py-3 font-semibold text-charcoal">{formatPeso(p.price)}</td>
                  <td className="px-5 py-3">
                    <span className={`badge ${p.stock <= 5 ? 'bg-amber-100 text-amber-800' : p.stock === 0 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-800'}`}>
                      {p.stock} in stock
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-2">
                      <Link to={`/admin/products/${p.product_id}/edit`} className="flex h-9 w-9 items-center justify-center rounded-lg bg-ivory-dark/70 text-charcoal transition hover:bg-gold hover:text-white" title="Edit">
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <button onClick={() => remove(p)} className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-600 transition hover:bg-red-600 hover:text-white" title="Delete">
                        <Trash2 className="h-4 w-4" />
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
