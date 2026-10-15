import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import api, { errMsg } from '../api/client.js';
import { useCart } from '../context/CartContext.jsx';
import { formatPeso, imgUrl } from '../utils/format.js';
import Spinner from '../components/Spinner.jsx';

const PAYMENTS = ['Cash on Delivery', 'GCash', 'Card'];

export default function Checkout() {
  const navigate = useNavigate();
  const { cart, loading, clearLocal } = useCart();
  const [form, setForm] = useState({
    fullName: '',
    line1: '',
    line2: '',
    city: '',
    province: '',
    postal: '',
    phone: '',
  });
  const [payment, setPayment] = useState('Cash on Delivery');
  const [error, setError] = useState('');
  const [placing, setPlacing] = useState(false);
  const [placed, setPlaced] = useState(null);

  if (loading) {
    return <div className="container-app flex justify-center py-24"><Spinner /></div>;
  }

  if (placed) {
    return (
      <div className="container-app flex justify-center py-16">
        <div className="card w-full max-w-md p-10 text-center">
          <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-600" />
          <h1 className="mt-4 font-display text-3xl font-semibold text-charcoal">Order placed!</h1>
          <p className="mt-3 text-sm text-gray">
            Order <span className="font-semibold text-charcoal">#{placed.orderId}</span> is now{' '}
            <span className="font-semibold text-gold-dark">Pending</span>. You can track it from your
            orders page. Total: <span className="font-semibold text-charcoal">{formatPeso(placed.totalAmount)}</span>
          </p>
          <p className="mt-2 text-xs text-gray-light">
            Demo checkout — no real payment was processed.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Link to={`/orders/${placed.orderId}`} className="btn-gold w-full">View order</Link>
            <Link to="/catalog" className="btn-ghost w-full text-sm">Continue shopping</Link>
          </div>
        </div>
      </div>
    );
  }

  if (!cart.items.length) {
    return (
      <div className="container-app py-16 text-center">
        <p className="text-lg text-gray">Your cart is empty.</p>
        <Link to="/catalog" className="btn-gold mt-4">Browse catalog</Link>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const { fullName, line1, city, province, postal, phone } = form;
    if (!fullName.trim() || !line1.trim() || !city.trim() || !province.trim() || !phone.trim()) {
      setError('Please complete all required fields (name, address line 1, city, province, phone).');
      return;
    }
    setPlacing(true);
    try {
      const { data } = await api.post('/orders', {
        shippingAddress: {
          fullName: fullName.trim(),
          line1: line1.trim(),
          line2: line2.trim(),
          city: city.trim(),
          province: province.trim(),
          postal: postal.trim(),
          phone: phone.trim(),
        },
        paymentMethod: payment,
      });
      clearLocal();
      setPlaced(data);
      window.scrollTo(0, 0);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setPlacing(false);
    }
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="container-app py-12">
      <p className="eyebrow">Almost there</p>
      <h1 className="mt-2 font-display text-4xl font-semibold text-charcoal">Checkout</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="card p-6">
            <h2 className="font-display text-xl font-semibold text-charcoal">Shipping details</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="label">Full name *</label>
                <input className="input" value={form.fullName} onChange={set('fullName')} placeholder="Maria Santos" />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Address line 1 *</label>
                <input className="input" value={form.line1} onChange={set('line1')} placeholder="123 Rizal Avenue" />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Address line 2</label>
                <input className="input" value={form.line2} onChange={set('line2')} placeholder="Unit / building (optional)" />
              </div>
              <div>
                <label className="label">City *</label>
                <input className="input" value={form.city} onChange={set('city')} placeholder="San Pablo" />
              </div>
              <div>
                <label className="label">Province *</label>
                <input className="input" value={form.province} onChange={set('province')} placeholder="Laguna" />
              </div>
              <div>
                <label className="label">Postal code</label>
                <input className="input" value={form.postal} onChange={set('postal')} placeholder="4000" />
              </div>
              <div>
                <label className="label">Phone *</label>
                <input className="input" value={form.phone} onChange={set('phone')} placeholder="0917 123 4567" />
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="font-display text-xl font-semibold text-charcoal">Payment method</h2>
            <div className="mt-5 space-y-3">
              {PAYMENTS.map((p) => (
                <label
                  key={p}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition ${
                    payment === p ? 'border-gold bg-gold/5' : 'border-charcoal/10 hover:border-charcoal/25'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value={p}
                    checked={payment === p}
                    onChange={() => setPayment(p)}
                    className="h-4 w-4 accent-gold"
                  />
                  <span className="text-sm font-medium text-charcoal">{p}</span>
                  {p === 'Card' && <span className="ml-auto text-xs text-gray-light">Demo — no real charge</span>}
                </label>
              ))}
            </div>
          </div>

          <button type="submit" className="btn-gold w-full !py-4" disabled={placing}>
            {placing ? 'Placing order…' : `Place order · ${formatPeso(cart.total)}`}
          </button>
        </form>

        {/* Summary */}
        <aside>
          <div className="card sticky top-24 p-6">
            <h2 className="font-display text-xl font-semibold text-charcoal">Your items</h2>
            <div className="mt-4 max-h-72 space-y-3 overflow-auto pr-1">
              {cart.items.map((item) => (
                <div key={item.cartId} className="flex items-center gap-3">
                  <img
                    src={imgUrl(item.product.image_url)}
                    alt={item.product.name}
                    className="h-14 w-12 rounded-lg object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-charcoal">{item.product.name}</p>
                    <p className="text-xs text-gray-light">Qty {item.quantity}</p>
                  </div>
                  <span className="text-sm font-semibold">{formatPeso(item.lineTotal)}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 flex justify-between border-t border-charcoal/10 pt-4">
              <span className="font-semibold text-charcoal">Total</span>
              <span className="font-display text-xl font-semibold text-gold-dark">{formatPeso(cart.total)}</span>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-gray-light">
              Cash on Delivery and GCash are simulated for this demo. No real payment is processed.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
