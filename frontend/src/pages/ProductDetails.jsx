import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ChevronRight, ShoppingBag, Minus, Plus, Check } from 'lucide-react';
import api, { errMsg } from '../api/client.js';
import { formatPeso, imgUrl } from '../utils/format.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import Spinner from '../components/Spinner.jsx';
import ProductCard from '../components/ProductCard.jsx';
import { ErrorState } from '../components/StateComponents.jsx';

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addItem } = useCart();

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [size, setSize] = useState('');
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError('');
    setSize('');
    setQty(1);
    setAdded(false);
    api
      .get(`/products/${id}`)
      .then(({ data }) => {
        setProduct(data.product);
        setRelated(data.related || []);
      })
      .catch((e) => setError(errMsg(e)))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="container-app flex justify-center py-24"><Spinner /></div>
    );
  }
  if (error || !product) {
    return (
      <div className="container-app py-24">
        <ErrorState message={error || 'Product not found.'} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  const outOfStock = product.stock <= 0;

  const handleAddToCart = async () => {
    if (!user) {
      navigate('/login', { state: { from: `/products/${product.product_id}` } });
      return;
    }
    if (!size && !product.available_sizes.includes('One Size')) {
      alert('Please select a size first.');
      return;
    }
    setBusy(true);
    try {
      await addItem(product.product_id, qty);
      setAdded(true);
      setTimeout(() => setAdded(false), 2200);
    } catch (e) {
      alert(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container-app py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-gray">
        <Link to="/" className="hover:text-gold-dark">Home</Link>
        <ChevronRight className="h-4 w-4 text-gray-light" />
        <Link to="/catalog" className="hover:text-gold-dark">Catalog</Link>
        <ChevronRight className="h-4 w-4 text-gray-light" />
        <Link to={`/catalog?category=${encodeURIComponent(product.category)}`} className="hover:text-gold-dark">
          {product.category}
        </Link>
        <ChevronRight className="h-4 w-4 text-gray-light" />
        <span className="font-medium text-charcoal line-clamp-1">{product.name}</span>
      </nav>

      <div className="mt-8 grid gap-10 lg:grid-cols-2">
        {/* Image */}
        <div className="relative">
          <div className="overflow-hidden rounded-[1.75rem] bg-ivory-dark shadow-soft">
            <img
              src={imgUrl(product.image_url)}
              alt={product.name}
              className="aspect-[3/4] w-full object-cover"
            />
          </div>
          {outOfStock && (
            <span className="absolute left-4 top-4 rounded-full bg-charcoal px-4 py-1.5 text-xs font-semibold text-white">
              Out of stock
            </span>
          )}
        </div>

        {/* Info */}
        <div>
          <p className="eyebrow">{product.category}</p>
          <h1 className="mt-2 font-display text-4xl font-semibold leading-tight text-charcoal">
            {product.name}
          </h1>
          <div className="mt-4 flex items-center gap-4">
            <span className="font-display text-3xl font-semibold text-gold-dark">
              {formatPeso(product.price)}
            </span>
            <span className="badge bg-ivory-dark text-charcoal">
              {product.stock > 0 ? `${product.stock} in stock` : 'Sold out'}
            </span>
          </div>

          <p className="mt-6 leading-relaxed text-gray">{product.description}</p>

          <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
            <div className="card p-4">
              <div className="text-xs font-bold uppercase tracking-wider text-gray-light">Color</div>
              <div className="mt-1 font-semibold text-charcoal">{product.color}</div>
            </div>
            <div className="card p-4">
              <div className="text-xs font-bold uppercase tracking-wider text-gray-light">Category</div>
              <div className="mt-1 font-semibold text-charcoal">{product.category}</div>
            </div>
          </div>

          {/* Size selector */}
          <div className="mt-6">
            <div className="flex items-center justify-between">
              <span className="label !mb-0">Select size</span>
              {product.available_sizes.includes('One Size') && (
                <span className="text-xs text-gray-light">One size fits all</span>
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {product.available_sizes.map((s) => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={`h-11 min-w-11 rounded-xl border px-3 text-sm font-semibold transition ${
                    size === s
                      ? 'border-charcoal bg-charcoal text-white'
                      : 'border-charcoal/15 bg-white text-charcoal hover:border-gold'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity + Add */}
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-full border border-charcoal/15 bg-white">
              <button
                onClick={() => setQty((v) => Math.max(1, v - 1))}
                className="p-3 text-charcoal hover:text-gold-dark"
                aria-label="Decrease quantity"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-10 text-center font-semibold">{qty}</span>
              <button
                onClick={() => setQty((v) => Math.min(product.stock, v + 1))}
                className="p-3 text-charcoal hover:text-gold-dark"
                aria-label="Increase quantity"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <button
              onClick={handleAddToCart}
              disabled={outOfStock || busy}
              className={`flex-1 !py-3.5 sm:flex-none sm:min-w-56 ${added ? 'btn-dark' : 'btn-gold'}`}
            >
              {added ? (
                <>
                  <Check className="h-4 w-4" /> Added to cart
                </>
              ) : (
                <>
                  <ShoppingBag className="h-4 w-4" />
                  {user ? 'Add to cart' : 'Sign in to add to cart'}
                </>
              )}
            </button>
          </div>

          {!user && (
            <p className="mt-4 text-sm text-gray">
              Please{' '}
              <Link to="/login" className="font-semibold text-gold-dark hover:underline">sign in</Link>{' '}
              to add items to your cart.
            </p>
          )}
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="font-display text-2xl font-semibold text-charcoal">You may also like</h2>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.product_id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
