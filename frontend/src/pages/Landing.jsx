import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, Ruler, Palette, Calendar, Truck } from 'lucide-react';
import api, { errMsg } from '../api/client.js';
import ProductCard from '../components/ProductCard.jsx';
import { ErrorState } from '../components/StateComponents.jsx';

const categories = [
  { name: 'Bridal Gowns', image: '/images/cat-bridal.jpg', blurb: 'Once-in-a-lifetime silhouettes' },
  { name: 'Evening Gowns', image: '/images/cat-evening.jpg', blurb: 'Gala-ready glamour' },
  { name: 'Formal Dresses', image: '/images/cat-formal.jpg', blurb: 'Effortless occasion dressing' },
  { name: 'Suits', image: '/images/cat-suit.jpg', blurb: 'Sharp, tailored confidence' },
  { name: 'Barongs', image: '/images/cat-barong.jpg', blurb: 'Heritage, hand-embroidered' },
  { name: 'Accessories', image: '/images/cat-accessories.jpg', blurb: 'The finishing touch' },
];

const steps = [
  {
    icon: Calendar,
    title: 'Share your occasion',
    text: 'Wedding, gala, debut, corporate — tell us the event and your style preferences.',
  },
  {
    icon: Sparkles,
    title: 'Let the AI stylist match you',
    text: 'Our engine scores the real catalog against your style, color, fit and measurements.',
  },
  {
    icon: Truck,
    title: 'Find it, order it, love it',
    text: 'Every recommendation links straight to a product you can add to your cart.',
  },
];

export default function Landing() {
  const [featured, setFeatured] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/products', { params: { inStock: 'true', limit: 8, sort: 'newest' } })
      .then(({ data }) => setFeatured(data.items))
      .catch((e) => setError(errMsg(e)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="container-app grid items-center gap-10 py-14 lg:grid-cols-2 lg:py-20">
          <div>
            <p className="eyebrow">AI-powered formal wear boutique</p>
            <h1 className="mt-4 font-display text-5xl font-semibold leading-[1.08] text-charcoal sm:text-6xl">
              Dressed for the moment,
              <br />
              <span className="italic text-gold-dark">styled by AI.</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-gray">
              Bridal gowns, evening gowns, formal dresses, suits, barongs and accessories — curated
              for your occasion, your color, your fit. Tell the ElegAI stylist what you love and
              watch it find your perfect look.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/stylist" className="btn-gold">
                <Sparkles className="h-4 w-4" /> Meet your AI Stylist
              </Link>
              <Link to="/catalog" className="btn-outline">
                Explore the collection <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-10 grid max-w-md grid-cols-3 gap-4 border-t border-charcoal/10 pt-6">
              {[
                ['500+', 'curated pieces'],
                ['6', 'occasion categories'],
                ['100%', 'body-positive styling'],
              ].map(([n, l]) => (
                <div key={l}>
                  <div className="font-display text-2xl font-semibold text-gold-dark">{n}</div>
                  <div className="text-xs uppercase tracking-wider text-gray">{l}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 rounded-[2rem] bg-gold/10 blur-2xl" aria-hidden />
            <img
              src="/images/hero-landing.jpg"
              alt="Elegant ivory bridal gown in an atelier"
              className="relative aspect-[4/5] w-full rounded-[2rem] object-cover shadow-lift"
            />
            <div className="absolute bottom-6 left-6 right-6 rounded-2xl bg-white/85 p-4 shadow-soft backdrop-blur">
              <p className="text-sm font-semibold text-charcoal">
                “Recommended for you — an elegant ivory A-line gown for your wedding.”
              </p>
              <p className="mt-1 text-xs text-gray">— ElegAI Stylist</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Categories ───────────────────────────────────────── */}
      <section className="border-t border-charcoal/5 bg-ivory-dark/40 py-16">
        <div className="container-app">
          <div className="flex items-end justify-between">
            <div>
              <p className="eyebrow">The Collection</p>
              <h2 className="section-title mt-2">Shop by category</h2>
            </div>
            <Link to="/catalog" className="hidden text-sm font-semibold text-gold-dark hover:underline sm:block">
              View all →
            </Link>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {categories.map((c) => (
              <Link
                key={c.name}
                to={`/catalog?category=${encodeURIComponent(c.name)}`}
                className="group card overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lift"
              >
                <div className="aspect-square overflow-hidden bg-ivory-dark">
                  <img
                    src={c.image}
                    alt={c.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-3 text-center">
                  <h3 className="font-display text-sm font-semibold text-charcoal">{c.name}</h3>
                  <p className="mt-0.5 text-[11px] text-gray-light">{c.blurb}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────── */}
      <section className="py-16">
        <div className="container-app">
          <p className="eyebrow text-center">How ElegAI works</p>
          <h2 className="section-title mt-2 text-center">Three steps to your perfect look</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {steps.map((s, i) => (
              <div key={s.title} className="card relative p-7">
                <span className="absolute right-6 top-5 font-display text-5xl font-semibold text-ivory-dark">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gold/15 text-gold-dark">
                  <s.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 font-display text-xl font-semibold text-charcoal">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured products ────────────────────────────────── */}
      <section className="border-t border-charcoal/5 bg-ivory-dark/40 py-16">
        <div className="container-app">
          <div className="flex items-end justify-between">
            <div>
              <p className="eyebrow">Just in</p>
              <h2 className="section-title mt-2">Featured pieces</h2>
            </div>
            <Link to="/catalog" className="text-sm font-semibold text-gold-dark hover:underline">
              Browse all →
            </Link>
          </div>
          {error ? (
            <div className="mt-8"><ErrorState message={error} /></div>
          ) : (
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {featured.map((p) => (
                <ProductCard key={p.product_id} product={p} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── AI stylist CTA ───────────────────────────────────── */}
      <section className="py-16">
        <div className="container-app">
          <div className="card relative overflow-hidden bg-charcoal p-10 text-center sm:p-14">
            <div className="absolute -left-16 -top-16 h-56 w-56 rounded-full bg-gold/10 blur-2xl" aria-hidden />
            <div className="absolute -bottom-20 -right-16 h-64 w-64 rounded-full bg-gold/10 blur-2xl" aria-hidden />
            <p className="eyebrow">Your personal stylist</p>
            <h2 className="mx-auto mt-3 max-w-2xl font-display text-3xl font-semibold text-white sm:text-4xl">
              Not sure what to wear? Let the AI stylist decide.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-white/70">
              Occasion, style, color, fit and measurements — get 6 tailored recommendations from
              the actual catalog, with reasons for every pick.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link to="/stylist" className="btn-gold">
                <Sparkles className="h-4 w-4" /> Get my recommendations
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust strip ──────────────────────────────────────── */}
      <section className="border-t border-charcoal/5 py-12">
        <div className="container-app grid gap-6 sm:grid-cols-3">
          {[
            { icon: Ruler, t: 'Measurements that matter', d: 'Share your measurements so sizes and silhouettes are recommended thoughtfully.' },
            { icon: Palette, t: 'Color-aware styling', d: 'Recommendations respect your preferred palette — and never judge your body.' },
            { icon: Sparkles, t: 'Real catalog, real buys', d: 'Every pick is a live product with real stock. Add to cart in one click.' },
          ].map((f) => (
            <div key={f.t} className="flex gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-gold-dark">
                <f.icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-charcoal">{f.t}</h3>
                <p className="mt-1 text-sm text-gray">{f.d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
