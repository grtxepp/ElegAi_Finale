import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { errMsg } from '../../api/client.js';
import Captcha from '../../components/Captcha.jsx';

export default function AdminLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaRequired, setCaptchaRequired] = useState(true);
  const [captchaResetKey, setCaptchaResetKey] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (captchaRequired && !captchaToken) {
      setError('Please complete the CAPTCHA check.');
      return;
    }
    setLoading(true);
    try {
      const user = await login(form.email, form.password, captchaToken);
      if (user.role !== 'admin') {
        setError('This area is for administrators only.');
        return;
      }
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(errMsg(err, 'Unable to sign in.'));
    } finally {
      setLoading(false);
      setCaptchaToken('');
      if (captchaRequired) setCaptchaResetKey((key) => key + 1);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-charcoal p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gold font-display text-2xl font-semibold text-charcoal">
            E
          </span>
          <h1 className="mt-4 font-display text-2xl font-semibold text-white">
            ElegAI <span className="text-gold">Admin</span>
          </h1>
          <p className="mt-1 text-sm text-white/60">Administrator sign in</p>
        </div>

        <div className="rounded-2xl bg-white p-7 shadow-lift">
          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label" htmlFor="admin-email">Email</label>
              <input
                id="admin-email"
                type="email"
                className="input"
                placeholder="admin@elegai.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <label className="label" htmlFor="admin-password">Password</label>
              <input
                id="admin-password"
                type="password"
                className="input"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
            <Captcha onTokenChange={setCaptchaToken} onRequiredChange={setCaptchaRequired} resetKey={captchaResetKey} />
            <button type="submit" className="btn-gold w-full" disabled={loading}>
              <ShieldCheck className="h-4 w-4" />
              {loading ? 'Signing in…' : 'Sign in to admin'}
            </button>
          </form>
          <p className="mt-4 text-center text-xs text-gray-light">
            Demo: admin@elegai.com / Admin@12345
          </p>
        </div>

        <p className="mt-6 text-center">
          <Link to="/" className="text-sm text-white/60 hover:text-gold">
            ← Back to storefront
          </Link>
        </p>
      </div>
    </div>
  );
}
