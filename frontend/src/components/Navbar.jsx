import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { ShoppingBag, User, Menu, X, LogOut, Sparkles, LayoutDashboard, ClipboardList } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';

const navLinkClass = ({ isActive }) =>
  `text-sm font-medium tracking-wide transition-colors hover:text-gold-dark ${
    isActive ? 'text-gold-dark' : 'text-charcoal/80'
  }`;

export default function Navbar() {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate('/');
  };

  const links = (
    <>
      <NavLink to="/" className={navLinkClass} end onClick={() => setOpen(false)}>
        Home
      </NavLink>
      <NavLink to="/catalog" className={navLinkClass} onClick={() => setOpen(false)}>
        Catalog
      </NavLink>
      <NavLink to="/stylist" className={navLinkClass} onClick={() => setOpen(false)}>
        AI Assistant
      </NavLink>
      {user && (
        <NavLink to="/orders" className={navLinkClass} onClick={() => setOpen(false)}>
          Orders
        </NavLink>
      )}
      {user && (
        <NavLink to="/requests" className={navLinkClass} onClick={() => setOpen(false)}>
          Requests
        </NavLink>
      )}
    </>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-charcoal/5 bg-ivory/90 backdrop-blur">
      <div className="container-app flex h-16 items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-charcoal font-display text-xl font-semibold text-gold">
            E
          </span>
          <span className="font-display text-2xl font-semibold tracking-tight text-charcoal">
            Eleg<span className="text-gold">AI</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-8 lg:flex">{links}</nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Link
            to="/cart"
            className="relative rounded-full p-2 text-charcoal transition hover:bg-charcoal/5"
            aria-label="Shopping cart"
          >
            <ShoppingBag className="h-5 w-5" />
            {cart.count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-[11px] font-bold text-white">
                {cart.count > 99 ? '99+' : cart.count}
              </span>
            )}
          </Link>

          {user ? (
            <div className="hidden items-center gap-2 lg:flex">
              <Link to="/dashboard" className="btn-ghost !px-4 !py-2 text-sm">
                <User className="h-4 w-4" />
                {user.name.split(' ')[0]}
              </Link>
              <button onClick={handleLogout} className="btn-ghost !px-3 !py-2 text-sm" title="Logout">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="hidden items-center gap-2 lg:flex">
              <Link to="/login" className="btn-ghost !px-5 !py-2 text-sm">
                Sign in
              </Link>
              <Link to="/register" className="btn-dark !px-5 !py-2 text-sm">
                Register
              </Link>
            </div>
          )}

          <button
            className="rounded-full p-2 text-charcoal lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-charcoal/5 bg-ivory px-4 py-4 lg:hidden">
          <nav className="flex flex-col gap-4">{links}</nav>
          <div className="mt-4 flex flex-col gap-2 border-t border-charcoal/10 pt-4">
            {user ? (
              <>
                <Link to="/dashboard" onClick={() => setOpen(false)} className="btn-outline w-full">
                  <LayoutDashboard className="h-4 w-4" /> My Dashboard
                </Link>
                <Link to="/requests" onClick={() => setOpen(false)} className="btn-outline w-full">
                  <ClipboardList className="h-4 w-4" /> My Requests
                </Link>
                <Link to="/stylist" onClick={() => setOpen(false)} className="btn-outline w-full">
                  <Sparkles className="h-4 w-4" /> AI Assistant
                </Link>
                <button onClick={handleLogout} className="btn-outline w-full">
                  <LogOut className="h-4 w-4" /> Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setOpen(false)} className="btn-outline w-full">
                  Sign in
                </Link>
                <Link to="/register" onClick={() => setOpen(false)} className="btn-dark w-full">
                  Create account
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
