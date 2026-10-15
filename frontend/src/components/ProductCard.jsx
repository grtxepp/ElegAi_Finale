import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { formatPeso, imgUrl } from '../utils/format.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';

export default function ProductCard({ product }) {
  const { user } = useAuth();
  const { addItem } = useCart();
  const outOfStock = product.stock <= 0;

  const handleAdd = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;
    try {
      await addItem(product.product_id, 1);
    } catch {
      /* surfaced via toast in future; silently ignore here */
    }
  };

  return (
    <Link
      to={`/products/${product.product_id}`}
      className="group card overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-ivory-dark">
        <img
          src={imgUrl(product.image_url)}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {outOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[2px]">
            <span className="rounded-full bg-charcoal px-4 py-1.5 text-xs font-semibold text-white">
              Out of stock
            </span>
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-charcoal shadow-sm">
          {product.category}
        </span>
      </div>

      <div className="p-4">
        <h3 className="font-display text-lg font-semibold leading-snug text-charcoal line-clamp-1">
          {product.name}
        </h3>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-lg font-semibold text-gold-dark">{formatPeso(product.price)}</span>
          {user ? (
            <button
              onClick={handleAdd}
              disabled={outOfStock}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-charcoal text-white transition hover:bg-gold disabled:cursor-not-allowed disabled:opacity-40"
              aria-label={`Add ${product.name} to cart`}
              title="Add to cart"
            >
              <ShoppingBag className="h-4 w-4" />
            </button>
          ) : (
            <span className="text-xs text-gray-light">Sign in to shop</span>
          )}
        </div>
      </div>
    </Link>
  );
}
