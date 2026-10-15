import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';
import { formatPeso, imgUrl } from '../utils/format.js';
import { EmptyState } from '../components/StateComponents.jsx';
import Spinner from '../components/Spinner.jsx';
import { errMsg } from '../api/client.js';

export default function CartPage() {
  const { cart, loading, updateQty, removeItem } = useCart();

  if (loading) {
    return (
      <div className="container-app flex justify-center py-24"><Spinner /></div>
    );
  }

  if (!cart.items.length) {
    return (
      <div className="container-app py-16">
        <EmptyState
          title="Your cart is empty"
          message="Beautiful pieces are waiting. Browse the collection or ask the AI stylist for recommendations."
          action={
            <div className="flex flex-wrap justify-center gap-3">
              <Link to="/catalog" className="btn-gold"><ShoppingBag className="h-4 w-4" /> Browse catalog</Link>
              <Link to="/stylist" className="btn-outline">Ask the AI stylist</Link>
            </div>
          }
        />
      </div>
    );
  }

  const handleQty = async (cartId, qty) => {
    try {
      await updateQty(cartId, qty);
    } catch (e) {
      alert(errMsg(e));
    }
  };

  const handleRemove = async (cartId) => {
    try {
      await removeItem(cartId);
    } catch (e) {
      alert(errMsg(e));
    }
  };

  return (
    <div className="container-app py-12">
      <p className="eyebrow">Your selection</p>
      <h1 className="mt-2 font-display text-4xl font-semibold text-charcoal">Shopping cart</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
        {/* Items */}
        <div className="space-y-4">
          {cart.items.map((item) => (
            <div key={item.cartId} className="card flex gap-4 p-4">
              <Link to={`/products/${item.product.product_id}`} className="shrink-0">
                <img
                  src={imgUrl(item.product.image_url)}
                  alt={item.product.name}
                  className="h-28 w-24 rounded-xl object-cover"
                />
              </Link>
              <div className="flex flex-1 flex-col justify-between py-1">
                <div>
                  <Link
                    to={`/products/${item.product.product_id}`}
                    className="font-display text-lg font-semibold text-charcoal hover:text-gold-dark"
                  >
                    {item.product.name}
                  </Link>
                  <p className="mt-0.5 text-sm text-gray">
                    {item.product.color} · {item.product.category}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-gold-dark">
                    {formatPeso(item.product.price)} each
                  </p>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center rounded-full border border-charcoal/15 bg-white">
                    <button
                      onClick={() => handleQty(item.cartId, item.quantity - 1)}
                      className="p-2 text-charcoal hover:text-gold-dark"
                      aria-label="Decrease"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                    <button
                      onClick={() => handleQty(item.cartId, item.quantity + 1)}
                      className="p-2 text-charcoal hover:text-gold-dark"
                      aria-label="Increase"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-semibold text-charcoal">{formatPeso(item.lineTotal)}</span>
                    <button
                      onClick={() => handleRemove(item.cartId)}
                      className="text-gray-light transition hover:text-red-600"
                      aria-label="Remove item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <aside>
          <div className="card sticky top-24 p-6">
            <h2 className="font-display text-xl font-semibold text-charcoal">Order summary</h2>
            <div className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between text-gray">
                <span>Subtotal ({cart.count} item{cart.count === 1 ? '' : 's'})</span>
                <span className="font-medium text-charcoal">{formatPeso(cart.total)}</span>
              </div>
              <div className="flex justify-between text-gray">
                <span>Shipping</span>
                <span className="text-xs">Calculated at checkout</span>
              </div>
              <div className="flex justify-between border-t border-charcoal/10 pt-4">
                <span className="font-semibold text-charcoal">Total</span>
                <span className="font-display text-2xl font-semibold text-gold-dark">
                  {formatPeso(cart.total)}
                </span>
              </div>
            </div>
            <Link to="/checkout" className="btn-gold mt-6 w-full">
              Proceed to checkout <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/catalog" className="btn-ghost mt-2 w-full text-sm">
              Continue shopping
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
