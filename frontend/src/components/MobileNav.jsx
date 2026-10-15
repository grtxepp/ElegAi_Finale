import { NavLink } from 'react-router-dom';
import { Home, Shirt, Sparkles, ShoppingBag, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';

/**
 * App-like bottom navigation bar — visible on phones/tablets (below lg).
 * Gives the storefront a native-app feel when installed as a PWA.
 */
export default function MobileNav() {
  const { user } = useAuth();
  const { cart } = useCart();

  const itemClass = ({ isActive }) =>
    `flex flex-1 flex-col items-center gap-1 py-2 text-[10px] font-semibold transition-colors ${
      isActive ? 'text-gold-dark' : 'text-charcoal/55'
    }`;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-charcoal/10 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
      <div className="flex items-stretch">
        <NavLink to="/" className={itemClass} end>
          <Home className="h-5 w-5" />
          Home
        </NavLink>
        <NavLink to="/catalog" className={itemClass}>
          <Shirt className="h-5 w-5" />
          Catalog
        </NavLink>
        <NavLink to="/stylist" className={itemClass}>
          <Sparkles className="h-5 w-5" />
          AI Assistant
        </NavLink>
        <NavLink to="/cart" className={itemClass}>
          <span className="relative">
            <ShoppingBag className="h-5 w-5" />
            {cart.count > 0 && (
              <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[9px] font-bold text-white">
                {cart.count > 99 ? '99+' : cart.count}
              </span>
            )}
          </span>
          Cart
        </NavLink>
        <NavLink to={user ? '/dashboard' : '/login'} className={itemClass}>
          <User className="h-5 w-5" />
          {user ? 'Account' : 'Sign in'}
        </NavLink>
      </div>
    </nav>
  );
}
