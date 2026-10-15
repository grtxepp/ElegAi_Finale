import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft, Upload } from 'lucide-react';
import api, { errMsg } from '../../api/client.js';
import { CATEGORIES } from '../../utils/options.js';
import Spinner from '../../components/Spinner.jsx';

const ALL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'One Size'];

/** Create or edit a product (multipart form supports image upload). */
export default function AdminProductForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    color: '',
    stock: '',
    sizes: ['M'],
  });
  const [imageUrl, setImageUrl] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEdit) return;
    api
      .get(`/products/${id}`)
      .then(({ data }) => {
        const p = data.product;
        setForm({
          name: p.name,
          description: p.description || '',
          price: String(p.price),
          category: p.category,
          color: p.color,
          stock: String(p.stock),
          sizes: p.available_sizes,
        });
        setImageUrl(p.image_url);
        setPreview(p.image_url);
      })
      .catch((e) => setError(errMsg(e)))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  if (loading) {
    return <div className="flex justify-center py-24"><Spinner /></div>;
  }

  const toggleSize = (s) => {
    setForm((f) => ({
      ...f,
      sizes: f.sizes.includes(s) ? f.sizes.filter((x) => x !== s) : [...f.sizes, s],
    }));
  };

  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(f.type)) {
      setError('Please choose a JPG, PNG, WEBP or GIF image.');
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setError('Image must be under 5 MB.');
      return;
    }
    setFile(f);
    setError('');
    setPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim() || !form.price || !form.category || !form.color.trim()) {
      setError('Please fill in name, price, category and color.');
      return;
    }
    if (!form.sizes.length) {
      setError('Select at least one available size.');
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('description', form.description);
      fd.append('price', form.price);
      fd.append('category', form.category);
      fd.append('color', form.color);
      fd.append('stock', form.stock || 0);
      fd.append('availableSizes', JSON.stringify(form.sizes));
      if (file) fd.append('image', file);
      else fd.append('imageUrl', imageUrl);

      if (isEdit) {
        await api.put(`/admin/products/${id}`, fd);
      } else {
        await api.post('/admin/products', fd);
      }
      navigate('/admin/products');
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/admin/products')} className="btn-ghost !p-2" aria-label="Back">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="font-display text-2xl font-semibold text-charcoal">
            {isEdit ? `Edit product #${id}` : 'Add product'}
          </h1>
          <p className="text-sm text-gray">{isEdit ? 'Update the product details below.' : 'Fill in the details for a new piece.'}</p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="card space-y-5 p-6">
        {/* Image */}
        <div className="flex items-start gap-5">
          <div className="h-36 w-28 shrink-0 overflow-hidden rounded-xl bg-ivory-dark">
            {preview ? (
              <img src={preview} alt="Preview" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-gray-light">No image</div>
            )}
          </div>
          <div className="flex-1">
            <label className="label">Product image</label>
            <label className="btn-outline !px-4 !py-2 cursor-pointer text-xs">
              <Upload className="h-4 w-4" /> {file ? 'Replace image' : 'Upload image'}
              <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={onFile} />
            </label>
            {!file && isEdit && (
              <input
                className="input mt-3 !py-2 text-xs"
                placeholder="Or paste an image URL…"
                value={imageUrl}
                onChange={(e) => {
                  setImageUrl(e.target.value);
                  setPreview(e.target.value);
                }}
              />
            )}
            <p className="mt-2 text-xs text-gray-light">JPG, PNG, WEBP or GIF — max 5 MB.</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">Product name *</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Elegant Ivory A-Line Wedding Gown" />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Description</label>
            <textarea className="input min-h-24" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="A timeless silhouette in ivory duchess satin…" />
          </div>
          <div>
            <label className="label">Category *</label>
            <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <option value="">Select category…</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Color *</label>
            <input className="input" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} placeholder="Ivory" />
          </div>
          <div>
            <label className="label">Price (₱) *</label>
            <input className="input" type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="45000" />
          </div>
          <div>
            <label className="label">Stock</label>
            <input className="input" type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} placeholder="10" />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Available sizes *</label>
            <div className="flex flex-wrap gap-2">
              {ALL_SIZES.map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => toggleSize(s)}
                  className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                    form.sizes.includes(s)
                      ? 'border-charcoal bg-charcoal text-white'
                      : 'border-charcoal/15 bg-white text-charcoal hover:border-gold'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" className="btn-gold" disabled={saving}>
            <Save className="h-4 w-4" /> {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create product'}
          </button>
          <button type="button" onClick={() => navigate('/admin/products')} className="btn-ghost text-sm">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
