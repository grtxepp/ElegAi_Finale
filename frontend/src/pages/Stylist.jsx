import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles, Send, ImagePlus, Loader2, RotateCcw, Sparkle, User, ArrowRight,
  ClipboardList, CheckCircle2,
} from 'lucide-react';
import api, { errMsg } from '../api/client.js';
import { OCCASIONS, STYLES, COLORS, FITS } from '../utils/options.js';

const GREETING = {
  role: 'assistant',
  content:
    "Hello! I'm ElegAI, your styling assistant. Tell me the occasion you're dressing for — wedding, gala, cocktail party, corporate event, debut or graduation — along with the colours and style you love. I can also answer questions about sizing, delivery and returns, or draw you a look.",
};

const STARTERS = [
  'I need an outfit for a wedding',
  'What colours do you have in stock?',
  'How does your sizing work?',
  'Draw me an elegant evening look',
];

const quickReplies = (provider) =>
  provider === 'ElegAI offline stylist'
    ? ['Recommend something for me', 'Tell me about returns', 'What sizes do you carry?']
    : ['Show me more options', 'What colours suit a gala?', 'How does it fit?'];

export default function Stylist() {
  const [messages, setMessages] = useState([GREETING]);
  const [draft, setDraft] = useState('');
  const [provider, setProvider] = useState('');
  const [chips, setChips] = useState([]);
  const [chatting, setChatting] = useState(false);
  const [chatError, setChatError] = useState('');

  const [brief, setBrief] = useState({ occasion: '', style: '', color: '', fit: '' });
  const [image, setImage] = useState(null);
  const [imaging, setImaging] = useState(false);
  const [imageError, setImageError] = useState('');

  const [requestOpen, setRequestOpen] = useState(false);
  const [requestForm, setRequestForm] = useState({ sizing: '', measurements: '', notes: '' });
  const [requesting, setRequesting] = useState(false);
  const [requestError, setRequestError] = useState('');
  const [requestDone, setRequestDone] = useState('');

  const threadRef = useRef(null);
  const inputRef = useRef(null);

  /* Keep the newest message in view. */
  useEffect(() => {
    const el = threadRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, chatting, imaging]);

  const ask = useCallback(
    async (text) => {
      const message = String(text || '').trim();
      if (!message || chatting) return;

      const history = messages
        .filter((m) => m.content && m !== GREETING)
        .slice(-10)
        .map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }));

      setMessages((prev) => [...prev, { role: 'user', content: message }]);
      setDraft('');
      setChatError('');
      setChatting(true);

      try {
        const { data } = await api.post('/chatbot/message', { message, history });
        setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
        setProvider(data.provider || '');
        setChips(data.suggestions || []);
      } catch (err) {
        setChatError(errMsg(err, 'The assistant could not respond. Please try again.'));
      } finally {
        setChatting(false);
        inputRef.current?.focus();
      }
    },
    [messages, chatting]
  );

  const generateImage = useCallback(async () => {
    if (imaging) return;
    const lastUser = [...messages].reverse().find((m) => m.role === 'user')?.content;
    const request =
      draft.trim() ||
      lastUser ||
      'an elegant formal outfit for a wedding, ivory A-line silhouette, classic and romantic';

    setImaging(true);
    setImageError('');
    setRequestOpen(false);
    setRequestDone('');
    setRequestError('');

    try {
      const { data } = await api.post(
        '/chatbot/generate-image',
        { request, preferences: brief },
        { timeout: 210000 }
      );
      setImage({
        src: data.image,
        prompt: data.prompt,
        source: data.source,
        request,
      });
      if (!messages.some((m) => m.role === 'user')) {
        setMessages((prev) => [...prev, { role: 'user', content: request }]);
      }
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Here's a look based on ${brief.occasion ? `your ${brief.occasion.toLowerCase()} brief` : 'your request'}. Tap “Browse this look” to see matching pieces in the catalog.`,
        },
      ]);
    } catch (err) {
      setImageError(errMsg(err, 'Image generation is unavailable right now.'));
    } finally {
      setImaging(false);
    }
  }, [brief, draft, imaging, messages]);

  const submitRequest = useCallback(async () => {
    if (!image || requesting) return;
    setRequesting(true);
    setRequestError('');
    try {
      await api.post('/chatbot/look-request', {
        prompt: image.prompt,
        source: image.source,
        image: image.src,
        sizing: requestForm.sizing,
        measurements: requestForm.measurements,
        notes: requestForm.notes,
      });
      setRequestDone('Your request was sent to the boutique. We will contact you shortly.');
      setRequestOpen(false);
      setRequestForm({ sizing: '', measurements: '', notes: '' });
    } catch (err) {
      setRequestError(errMsg(err, 'Could not send your request. Please try again.'));
    } finally {
      setRequesting(false);
    }
  }, [image, requesting, requestForm]);

  const toggle = (key, value) =>
    setBrief((prev) => ({ ...prev, [key]: prev[key] === value ? '' : value }));

  const chipGroup = (label, key, values) => (
    <div>
      <p className="label">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {values.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => toggle(key, v)}
            className={`rounded-full border px-3 py-1.5 text-[11px] font-medium transition ${
              brief[key] === v
                ? 'border-gold bg-gold text-white'
                : 'border-charcoal/15 bg-white text-charcoal hover:border-gold'
            }`}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="container-app py-10">
      <header className="mb-8 text-center">
        <p className="eyebrow">ElegAI assistant</p>
        <h1 className="mt-2 font-display text-4xl font-semibold text-charcoal sm:text-5xl">
          Ask anything. <span className="italic text-gold-dark">See it come to life.</span>
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-gray">
          Chat with our stylist for recommendations, sizing and delivery questions — or generate a
          visual of the look you have in mind. No body shaming, ever.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* ── Chat thread ─────────────────────────────────── */}
        <section className="card flex min-h-[560px] flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-charcoal/10 px-5 py-3.5">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold/15 text-gold-dark">
                <Sparkle className="h-4 w-4" />
              </span>
              <div>
                <p className="font-display text-sm font-semibold text-charcoal">ElegAI Stylist</p>
                <p className="text-[11px] text-gray-light">
                  {provider ? `Powered by ${provider}` : 'Online — replies instantly'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setMessages([GREETING]);
                setChips([]);
                setProvider('');
                setChatError('');
              }}
              className="text-xs font-medium text-gray-light hover:text-gold-dark"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>

          <div ref={threadRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : ''}`}>
                {m.role === 'assistant' && (
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-charcoal text-[10px] font-bold text-gold">
                    E
                  </span>
                )}
                <div
                  className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-gold text-white'
                      : 'bg-ivory-dark/70 text-charcoal'
                  }`}
                >
                  {m.content}
                </div>
                {m.role === 'user' && (
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ivory-dark text-gray">
                    <User className="h-3.5 w-3.5" />
                  </span>
                )}
              </div>
            ))}

            {chatting && (
              <div className="flex gap-2.5">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-charcoal text-[10px] font-bold text-gold">
                  E
                </span>
                <div className="flex items-center gap-1 rounded-2xl bg-ivory-dark/70 px-4 py-3">
                  {[0, 1, 2].map((d) => (
                    <span
                      key={d}
                      className="h-1.5 w-1.5 animate-bounce rounded-full bg-gold-dark"
                      style={{ animationDelay: `${d * 140}ms` }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {chatError && (
            <p className="mx-5 mb-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700" role="alert">
              {chatError}
            </p>
          )}

          {chips.length > 0 && !chatting && (
            <div className="flex flex-wrap gap-1.5 px-5 pb-3">
              {chips.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => ask(c)}
                  className="rounded-full border border-charcoal/15 px-3 py-1.5 text-[11px] font-medium text-charcoal transition hover:border-gold hover:text-gold-dark"
                >
                  {c}
                </button>
              ))}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              ask(draft);
            }}
            className="flex gap-2 border-t border-charcoal/10 p-3"
          >
            <input
              ref={inputRef}
              className="input"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Ask about an occasion, colour, size, delivery…"
              maxLength={1000}
              disabled={chatting}
              aria-label="Message ElegAI"
            />
            <button type="submit" className="btn-gold !px-4" disabled={!draft.trim() || chatting} aria-label="Send message">
              {chatting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </form>
        </section>

        {/* ── Side panel: brief + image generation ───────── */}
        <aside className="space-y-5">
          <div className="card space-y-4 p-5">
            <div>
              <h2 className="font-display text-lg font-semibold text-charcoal">Your styling brief</h2>
              <p className="mt-1 text-xs text-gray">
                Pick a few details — I'll use them when I generate a look.
              </p>
            </div>
            {chipGroup('Occasion', 'occasion', OCCASIONS.slice(0, 8))}
            {chipGroup('Style', 'style', STYLES.slice(0, 8))}
            {chipGroup('Colour', 'color', COLORS)}
            {chipGroup('Fit', 'fit', FITS)}
          </div>

          <div className="card space-y-3 p-5">
            <h2 className="font-display text-lg font-semibold text-charcoal">Visualise your look</h2>
            <p className="text-xs text-gray">
              I'll draw an editorial image from your brief and what you've typed in the chat.
            </p>

            <button type="button" onClick={generateImage} disabled={imaging} className="btn-dark w-full">
              {imaging ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Drawing your look…
                </>
              ) : (
                <>
                  <ImagePlus className="h-4 w-4" /> Generate outfit image
                </>
              )}
            </button>

            {imaging && (
              <div className="flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-xl bg-ivory-dark/50">
                <Loader2 className="h-7 w-7 animate-spin text-gold-dark" />
                <p className="max-w-[85%] text-center text-[11px] text-gray">
                  Rendering your look. Free renderers can take up to a minute or two.
                </p>
              </div>
            )}

            {imageError && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700" role="alert">
                {imageError}
              </p>
            )}

            {image && (
              <figure className="space-y-2">
                <img
                  src={image.src}
                  alt="AI-generated ElegAI outfit concept"
                  className="aspect-square w-full rounded-xl object-cover shadow-card"
                />
                <figcaption className="space-y-2">
                  <p className="text-[11px] leading-relaxed text-gray">{image.prompt}</p>
                  <Link
                    to={`/catalog?category=${encodeURIComponent(
                      brief.occasion === 'Wedding' ? 'Bridal Gowns' : 'Formal Dresses'
                    )}`}
                    className="btn-outline w-full !py-2 text-xs"
                  >
                    Browse this look <ArrowRight className="h-3.5 w-3.5" />
                  </Link>

                  <button
                    type="button"
                    onClick={() => setRequestOpen((v) => !v)}
                    className="btn-gold w-full !py-2 text-xs"
                  >
                    <ClipboardList className="h-3.5 w-3.5" /> Request this look
                  </button>

                  {requestOpen && (
                    <div className="space-y-2 rounded-xl border border-charcoal/10 bg-ivory-dark/40 p-3">
                      <div>
                        <label className="label" htmlFor="req-sizing">Size</label>
                        <input
                          id="req-sizing"
                          className="input"
                          placeholder="e.g. M, or custom"
                          value={requestForm.sizing}
                          onChange={(e) => setRequestForm({ ...requestForm, sizing: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="label" htmlFor="req-measurements">Measurements</label>
                        <textarea
                          id="req-measurements"
                          className="input min-h-[64px] py-2"
                          placeholder="Bust, waist, hips, height…"
                          value={requestForm.measurements}
                          onChange={(e) => setRequestForm({ ...requestForm, measurements: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="label" htmlFor="req-notes">Anything else?</label>
                        <textarea
                          id="req-notes"
                          className="input min-h-[64px] py-2"
                          placeholder="Event date, fabric preference, questions…"
                          value={requestForm.notes}
                          onChange={(e) => setRequestForm({ ...requestForm, notes: e.target.value })}
                        />
                      </div>
                      {requestError && (
                        <p className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-2 text-[11px] text-red-700" role="alert">
                          {requestError}
                        </p>
                      )}
                      <button
                        type="button"
                        onClick={submitRequest}
                        disabled={requesting}
                        className="btn-dark w-full !py-2 text-xs"
                      >
                        {requesting ? (
                          <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Sending…</>
                        ) : (
                          'Send request to boutique'
                        )}
                      </button>
                    </div>
                  )}

                  {requestDone && (
                    <div className="space-y-1.5">
                      <p className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-2 text-[11px] leading-relaxed text-emerald-800">
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {requestDone}
                      </p>
                      <Link to="/requests" className="flex items-center gap-1 text-[11px] font-semibold text-gold-dark hover:underline">
                        <ClipboardList className="h-3.5 w-3.5" /> Track this request
                      </Link>
                    </div>
                  )}
                </figcaption>
              </figure>
            )}
          </div>
        </aside>
      </div>

      {/* ── Starter prompts ─────────────────────────────── */}
      <div className="mt-8">
        <p className="eyebrow text-center">Try asking</p>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {STARTERS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => ask(s)}
              className="card px-4 py-2 text-xs font-medium text-charcoal transition hover:-translate-y-0.5 hover:text-gold-dark"
            >
              <Sparkles className="mr-1.5 inline h-3 w-3" />
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}