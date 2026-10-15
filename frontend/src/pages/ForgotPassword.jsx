import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MailCheck } from 'lucide-react';
import api, { errMsg } from '../api/client.js';
import Captcha from '../components/Captcha.jsx';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(null);
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaRequired, setCaptchaRequired] = useState(true);
  const [captchaResetKey, setCaptchaResetKey] = useState(0); // { message, resetUrl }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (captchaRequired && !captchaToken) {
      setError('Please complete the CAPTCHA check.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email, captchaToken });
      setDone(data);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setLoading(false);
      setCaptchaToken('');
      if (captchaRequired) setCaptchaResetKey((key) => key + 1);
    }
  };

  return (
    <div className="container-app flex justify-center py-16">
      <div className="w-full max-w-md">
        <div className="card p-8 sm:p-10">
          <p className="eyebrow">Recover access</p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-charcoal">Reset password</h1>
          <p className="mt-2 text-sm text-gray">
            Enter the email on your account and we will generate a one-time reset link.
          </p>

          {error && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {done ? (
            <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
              <div className="flex items-center gap-3">
                <MailCheck className="h-6 w-6 text-emerald-600" />
                <p className="text-sm text-emerald-800">{done.message}</p>
              </div>
              {done.resetUrl && (
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray">
                    Demo mode — no mail server, so here is your link
                  </p>
                  <Link
                    to={done.resetUrl.replace(/^https?:\/\/[^/]+/, '')}
                    className="mt-1 block break-all text-sm font-semibold text-gold-dark underline"
                  >
                    {done.resetUrl}
                  </Link>
                </div>
              )}
              <Link to="/login" className="mt-4 inline-block text-sm font-semibold text-charcoal hover:underline">
                ← Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div>
                <label className="label" htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  className="input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <Captcha onTokenChange={setCaptchaToken} onRequiredChange={setCaptchaRequired} resetKey={captchaResetKey} />
              <button type="submit" className="btn-gold w-full" disabled={loading}>
                {loading ? 'Generating link…' : 'Generate reset link'}
              </button>
              <Link to="/login" className="block text-center text-sm font-semibold text-charcoal hover:underline">
                ← Back to sign in
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
