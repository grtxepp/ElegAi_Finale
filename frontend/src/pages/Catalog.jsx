import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import api, { errMsg } from '../api/client.js';
import ProductCard from '../components/ProductCard.jsx';
import Spinner from '../components/Spinner.jsx';
import { EmptyState, ErrorState } from '../components/StateComponents.jsx';

const CATEGORIES = ['Bridal Gowns', 'Evening Gowns', 'Formal Dresses', 'Suits', 'Barongs', 'Accessories'];
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'One Size'];
const SORTS = [
  { value: '', label: 'Newest' },
  { value: 'price_asc', label: 'Price: low → high' },
  { value: 'price_desc', label: 'Price: high → low' },
  { value: 'name', label: 'Name (A–Z)' },
];

export default function Catalog() {
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState({ items: [], total: 0, pages: 1, page: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [metaColors, setMetaColors] = useState([]);
  const [mobileFilters, setMobileFilters] = useState(false);

  // Filter state derived from URL params so links (e.g. from the footer) work.
  const category = params.get('category') || '';
  const color = params.get('color') || '';
  const size = params.get('size') || '';
  const q = params.get('q') || '';
  const minPrice = params.get('minPrice') || '';
  const maxPrice = params.get('maxPrice') || '';
  const sort = params.get('sort') || '';
  const page = Number(params.get('page')) || 1;

  const updateParam = useCallback(
    (key, value) => {
      const next = new URLSearchParams(params);
      if (value) next.set(key, value);
      else next.delete(key);
      if (key !== 'page') next.delete('page');
      setParams(next, { replace: false });
    },
    [params, setParams]
  );

  useEffect(() => {
    api.get('/products/meta').then(({ data }) => setMetaColors(data.colors)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    setError('');
    const query = {};
    if (category) query.category = category;
    if (color) query.color = color;
    if (size) query.size = size;
    if (q) query.q = q;
    if (minPrice) query.minPrice = minPrice;
    if (maxPrice) query.maxPrice = maxPrice;
    if (sort) query.sort = sort;
    query.inStock = 'true';
    query.limit = 12;
    query.page = page;
    api
      .get('/products', { params: query })
      .then(({ data }) => setData(data))
      .catch((e) => setError(errMsg(e)))
      .finally(() => setLoading(false));
  }, [category, color, size, q, minPrice, maxPrice, sort, page]);

  const clearAll = () => setParams(new URLSearchParams());

  const Filters = (
    <div className="space-y-7">
      <div>
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray">Category</h3>
        <div className="space-y-2">
          {CATEGORIES.map((c) => (
            <label key={c} className="flex cursor-pointer items-center gap-2 text-sm text-charcoal/80">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-charcoal/20 accent-gold"
                checked={category === c}
                onChange={() => updateParam('category', category === c ? '' : c)}
              />
              {c}
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray">Color</h3>
        <div className="flex flex-wrap gap-2">
          {metaColors.map((c) => (
            <button
              key={c}
              onClick={() => updateParam('color', color === c ? '' : c)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                color === c
                  ? 'border-gold bg-gold text-white'
                  : 'border-charcoal/15 bg-white text-charcoal hover:border-gold'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray">Size</h3>
        <div className="flex flex-wrap gap-2">
          {SIZES.map((s) => (
            <button
              key={s}
              onClick={() => updateParam('size', size === s ? '' : s)}
              className={`h-9 min-w-9 rounded-lg border px-2 text-xs font-medium transition ${
                size === s
                  ? 'border-charcoal bg-charcoal text-white'
                  : 'border-charcoal/15 bg-white text-charcoal hover:border-charcoal'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray">Price (₱)</h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            placeholder="Min"
            className="input !py-2 text-sm"
            value={minPrice}
            onChange={(e) => updateParam('minPrice', e.target.value)}
          />
          <span className="text-gray-light">—</span>
          <input
            type="number"
            min="0"
            placeholder="Max"
            className="input !py-2 text-sm"
            value={maxPrice}
            onChange={(e) => updateParam('maxPrice', e.target.value)}
          />
        </div>
      </div>

      <button onClick={clearAll} className="text-xs font-semibold text-gold-dark hover:underline">
        Clear all filters
      </button>
    </div>
  );

  return (
    <div className="container-app py-10">
      <p className="eyebrow">The Collection</p>
      <h1 className="mt-2 font-display text-4xl font-semibold text-charcoal">Browse formal wear</h1>

      {/* Search + toolbar */}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form
          className="relative w-full sm:max-w-sm"
          onSubmit={(e) => {
            e.preventDefault();
            updateParam('q', new FormData(e.target).get('q'));
          }}
        >
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-light" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search gowns, suits, barongs…"
            className="input !pl-11"
          />
        </form>
        <div className="flex items-center gap-2">
          <select
            value={sort}
            onChange={(e) => updateParam('sort', e.target.value)}
            className="input !w-auto !py-2.5 text-sm"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <button
            className="btn-outline !px-4 !py-2.5 text-sm lg:hidden"
            onClick={() => setMobileFilters((v) => !v)}
          >
            <SlidersHorizontal className="h-4 w-4" /> Filters
          </button>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[240px_1fr]">
        {/* Sidebar filters (desktop) */}
        <aside className="hidden lg:block">
          <div className="card sticky top-24 p-6">{Filters}</div>
        </aside>

        {/* Mobile filters */}
        {mobileFilters && (
          <div className="card p-6 lg:hidden">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold">Filters</h2>
              <button onClick={() => setMobileFilters(false)} aria-label="Close filters">
                <X className="h-5 w-5" />
              </button>
            </div>
            {Filters}
          </div>
        )}

        {/* Results */}
        <div>
          <p className="mb-4 text-sm text-gray">
            {loading ? 'Searching…' : `${data.total} item${data.total === 1 ? '' : 's'}`}
            {q && (
              <>
                {' '}for “<span className="font-semibold text-charcoal">{q}</span>”
              </>
            )}
          </p>

          {error ? (
            <ErrorState message={error} onRetry={() => window.location.reload()} />
          ) : loading ? (
            <div className="flex justify-center py-20"><Spinner /></div>
          ) : data.items.length === 0 ? (
            <EmptyState
              title="No pieces match those filters"
              message="Try adjusting your filters or search terms — our stylist can also curate looks for you."
              action={
                <button onClick={clearAll} className="btn-gold !px-5 !py-2 text-sm">
                  Clear filters
                </button>
              }
            />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                {data.items.map((p) => (
                  <ProductCard key={p.product_id} product={p} />
                ))}
              </div>

              {/* Pagination */}
              {data.pages > 1 && (
                <div className="mt-10 flex items-center justify-center gap-2">
                  <button
                    className="btn-outline !px-4 !py-2 text-sm"
                    disabled={page <= 1}
                    onClick={() => updateParam('page', String(page - 1))}
                  >
                    ← Prev
                  </button>
                  {Array.from({ length: data.pages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === data.pages || Math.abs(p - page) <= 1)
                    .reduce((acc, p, idx, arr) => {
                      if (idx > 0 && arr[idx - 1] !== p - 1) acc.push('…');
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((p, i) =>
                      p === '…' ? (
                        <span key={`e${i}`} className="px-2 text-gray-light">…</span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => updateParam('page', String(p))}
                          className={`h-10 w-10 rounded-xl text-sm font-semibold transition ${
                            p === page
                              ? 'bg-charcoal text-white'
                              : 'bg-white text-charcoal hover:bg-ivory-dark'
                          }`}
                        >
                          {p}
                        </button>
                      )
                    )}
                  <button
                    className="btn-outline !px-4 !py-2 text-sm"
                    disabled={page >= data.pages}
                    onClick={() => updateParam('page', String(page + 1))}
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
