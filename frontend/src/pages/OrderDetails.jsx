import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ChevronRight, MapPin, CreditCard, Truck, Check, X } from 'lucide-react';
import api, { errMsg } from '../api/client.js';
import { formatPeso, formatDateTime, imgUrl } from '../utils/format.js';
import StatusBadge from '../components/StatusBadge.jsx';
import Spinner from '../components/Spinner.jsx';
import { ErrorState } from '../components/StateComponents.jsx';

const TIMELINE = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered'];

export default function OrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => {
    setLoading(true);
    setError('');
    api
      .get(`/orders/${id}`)
      .then(({ data }) => setOrder(data.order))
      .catch((e) => setError(errMsg(e)))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  const cancel = async () => {
    if (!window.confirm('Cancel this order? Items will be restocked.')) return;
    setBusy(true);
    try {
      await api.post(`/orders/${id}/cancel`);
      load();
    } catch (e) {
      alert(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <div className="container-app flex justify-center py-24"><Spinner /></div>;
  }
  if (error || !order) {
    return (
      <div className="container-app py-24">
        <ErrorState message={error || 'Order not found.'} onRetry={load} />
      </div>
    );
  }

  const cancelled = order.status === 'Cancelled';
  const currentStep = TIMELINE.indexOf(order.status);

  return (
    <div className="container-app py-12">
      <nav className="flex items-center gap-1.5 text-sm text-gray">
        <Link to="/orders" className="hover:text-gold-dark">My orders</Link>
        <ChevronRight className="h-4 w-4 text-gray-light" />
        <span className="font-medium text-charcoal">Order #{order.order_id}</span>
      </nav>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-semibold text-charcoal">Order #{order.order_id}</h1>
          <p className="mt-1 text-sm text-gray">Placed {formatDateTime(order.created_at)}</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={order.status} />
          {order.status === 'Pending' && (
            <button onClick={cancel} disabled={busy} className="btn-outline !px-4 !py-2 text-xs">
              <X className="h-3.5 w-3.5" /> Cancel order
            </button>
          )}
        </div>
      </div>

      {/* Tracking timeline */}
      <div className="card mt-8 p-6">
        <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-charcoal">
          <Truck className="h-5 w-5 text-gold-dark" /> Order tracking
        </h2>
        {cancelled ? (
          <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            This order was cancelled. Items were returned to stock.
          </p>
        ) : (
          <div className="mt-6 flex items-center">
            {TIMELINE.map((step, i) => {
              const reached = i <= currentStep;
              return (
                <div key={step} className={`flex flex-1 items-center ${i === 0 ? '' : ''}`}>
                  {i > 0 && (
                    <div className={`h-0.5 flex-1 ${i <= currentStep ? 'bg-gold' : 'bg-charcoal/10'}`} />
                  )}
                  <div className="flex flex-col items-center px-2">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-xs font-bold ${
                        reached ? 'border-gold bg-gold text-white' : 'border-charcoal/15 bg-white text-gray-light'
                      }`}
                    >
                      {reached ? <Check className="h-4 w-4" /> : i + 1}
                    </div>
                    <span className={`mt-2 text-xs font-medium ${reached ? 'text-charcoal' : 'text-gray-light'}`}>
                      {step}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
        {/* Items */}
        <div className="card p-6">
          <h2 className="font-display text-xl font-semibold text-charcoal">Items</h2>
          <div className="mt-4 divide-y divide-charcoal/5">
            {order.items.map((item) => (
              <div key={item.order_item_id} className="flex items-center gap-4 py-4">
                <img src={imgUrl(item.image_url)} alt={item.name} className="h-20 w-16 rounded-lg object-cover" />
                <div className="flex-1">
                  <Link to={`/products/${item.product_id}`} className="font-medium text-charcoal hover:text-gold-dark">
                    {item.name}
                  </Link>
                  <p className="text-sm text-gray">{item.color} · Qty {item.quantity}</p>
                </div>
                <span className="font-semibold text-charcoal">{formatPeso(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-between border-t border-charcoal/10 pt-4">
            <span className="font-semibold text-charcoal">Total</span>
            <span className="font-display text-2xl font-semibold text-gold-dark">{formatPeso(order.total_amount)}</span>
          </div>
        </div>

        {/* Shipping & payment */}
        <div className="space-y-4">
          <div className="card p-6">
            <h3 className="flex items-center gap-2 font-display text-lg font-semibold text-charcoal">
              <MapPin className="h-5 w-5 text-gold-dark" /> Shipping address
            </h3>
            <div className="mt-3 space-y-1 text-sm text-gray">
              {order.shipping_address.fullName && <p className="font-medium text-charcoal">{order.shipping_address.fullName}</p>}
              <p>{order.shipping_address.line1}</p>
              {order.shipping_address.line2 && <p>{order.shipping_address.line2}</p>}
              <p>
                {order.shipping_address.city}, {order.shipping_address.province}{' '}
                {order.shipping_address.postal}
              </p>
              <p>{order.shipping_address.phone}</p>
              {order.shipping_address.notes && (
                <p className="mt-2 rounded-lg bg-ivory-dark/60 px-3 py-2 text-xs italic">“{order.shipping_address.notes}”</p>
              )}
            </div>
          </div>
          <div className="card p-6">
            <h3 className="flex items-center gap-2 font-display text-lg font-semibold text-charcoal">
              <CreditCard className="h-5 w-5 text-gold-dark" /> Payment
            </h3>
            <p className="mt-3 text-sm text-gray">{order.payment_method}</p>
            <p className="mt-1 text-xs text-gray-light">Demo checkout — no real payment processed.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
