import { useState } from 'react';
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, PlusCircle, Boxes, ShoppingCart, Users, LogOut, Store, Menu, X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

const links = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/products', label: 'Products', icon: Package, end: false },
  { to: '/admin/products/new', label: 'Add product', icon: PlusCircle, end: false },
  { to: '/admin/inventory', label: 'Inventory', icon: Boxes, end: false },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingCart, end: false },
  { to: '/admin/customers', label: 'Customers', icon: Users, end: false },
];

const linkClass = ({ isActive }) =>
  `flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
    isActive ? 'bg-gold/15 text-gold' : 'text-white/70 hover:bg-white/5 hover:text-white'
  }`;

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div className="flex min-h-screen bg-ivory">
      {/* Sidebar (desktop) */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-charcoal p-5 lg:flex">
        <Link to="/admin" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold font-display text-xl font-semibold text-charcoal">E</span>
          <span className="font-display text-xl font-semibold text-white">
            Eleg<span className="text-gold">AI</span> Admin
          </span>
        </Link>
        <nav className="mt-8 flex-1 space-y-1">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={linkClass}>
              <l.icon className="h-4 w-4" /> {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="space-y-1 border-t border-white/10 pt-4">
          <Link to="/" className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-white/70 transition hover:bg-white/5 hover:text-white">
            <Store className="h-4 w-4" /> View storefront
          </Link>
          <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-white/70 transition hover:bg-white/5 hover:text-white">
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between bg-charcoal px-4 lg:hidden">
        <Link to="/admin" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gold font-display text-sm font-semibold text-charcoal">E</span>
          <span className="font-display text-base font-semibold text-white">ElegAI Admin</span>
        </Link>
        <button onClick={() => setOpen((v) => !v)} className="text-white" aria-label="Toggle admin menu">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <div className="fixed inset-x-0 top-14 z-30 bg-charcoal p-4 lg:hidden">
          <nav className="space-y-1">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end} className={linkClass} onClick={() => setOpen(false)}>
                <l.icon className="h-4 w-4" /> {l.label}
              </NavLink>
            ))}
            <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white">
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </nav>
        </div>
      )}

      {/* Content */}
      <main className="flex-1 px-4 pb-10 pt-20 sm:px-8 lg:ml-64 lg:pt-10">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-gold">Administration</p>
              <h1 className="font-display text-2xl font-semibold text-charcoal">Welcome, {user?.name?.split(' ')[0]}</h1>
            </div>
            <span className="badge bg-charcoal text-white">Admin</span>
          </div>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
