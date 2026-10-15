import { Link } from 'react-router-dom';

const categories = ['Bridal Gowns', 'Evening Gowns', 'Formal Dresses', 'Suits', 'Barongs', 'Accessories'];

export default function Footer() {
  return (
    <footer className="bg-charcoal text-white/80">
      <div className="container-app grid gap-10 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold font-display text-xl font-semibold text-charcoal">
              E
            </span>
            <span className="font-display text-2xl font-semibold text-white">
              Eleg<span className="text-gold">AI</span>
            </span>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/60">
            An AI-powered boutique for bridal gowns, evening gowns, formal dresses, suits, barongs
            and accessories. Tell us the occasion — our stylist will find your perfect look.
          </p>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-[0.25em] text-gold">Shop</h4>
          <ul className="mt-4 space-y-2 text-sm">
            {categories.map((c) => (
              <li key={c}>
                <Link
                  to={`/catalog?category=${encodeURIComponent(c)}`}
                  className="transition hover:text-gold"
                >
                  {c}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-[0.25em] text-gold">Account</h4>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link to="/login" className="transition hover:text-gold">Sign in</Link></li>
            <li><Link to="/register" className="transition hover:text-gold">Create account</Link></li>
            <li><Link to="/stylist" className="transition hover:text-gold">AI Assistant</Link></li>
            <li><Link to="/admin/login" className="transition hover:text-gold">Administrator</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-white/50">
        © {new Date().getFullYear()} ElegAI — Bridal & Formal Wear Boutique. Crafted with elegance.
      </div>
    </footer>
  );
}
