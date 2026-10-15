import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { errMsg } from '../api/client.js';
import Captcha from '../components/Captcha.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaRequired, setCaptchaRequired] = useState(true);
  const [captchaResetKey, setCaptchaResetKey] = useState(0);

  const from = location.state?.from || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.email || !form.password) {
      setError('Please enter your email and password.');
      return;
    }
    if (captchaRequired && !captchaToken) {
      setError('Please complete the CAPTCHA check.');
      return;
    }
    setLoading(true);
    try {
      const user = await login(form.email, form.password, captchaToken);
      navigate(user.role === 'admin' ? '/admin' : from, { replace: true });
    } catch (err) {
      setError(errMsg(err, 'Unable to sign in.'));
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
          <p className="eyebrow">Welcome back</p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-charcoal">Sign in</h1>
          <p className="mt-2 text-sm text-gray">
            New to ElegAI?{' '}
            <Link to="/register" className="font-semibold text-gold-dark hover:underline">
              Create an account
            </Link>
          </p>

          {error && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className="input"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label className="label" htmlFor="password">Password</label>
                <Link to="/forgot-password" className="text-xs font-medium text-gold-dark hover:underline">
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                className="input"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
            <Captcha onTokenChange={setCaptchaToken} onRequiredChange={setCaptchaRequired} resetKey={captchaResetKey} />
            <button type="submit" className="btn-gold w-full" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="mt-6 rounded-xl bg-ivory-dark/60 p-4 text-xs leading-relaxed text-gray">
            <strong className="text-charcoal">Demo accounts</strong>
            <br />
            Customer — maria@example.com / Customer@123
            <br />
            Administrator — admin@elegai.com / Admin@12345
          </div>
        </div>
      </div>
    </div>
  );
}
