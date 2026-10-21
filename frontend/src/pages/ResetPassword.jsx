import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import api, { errMsg } from '../api/client.js';
import Captcha from '../components/Captcha.jsx';
import PasswordInput from '../components/PasswordInput.jsx';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: searchParams.get('email') || '',
    code: '',
    password: '',
    confirm: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaRequired, setCaptchaRequired] = useState(true);
  const [captchaResetKey, setCaptchaResetKey] = useState(0);

  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email)) {
      setError('Please enter the email on your account.');
      return;
    }
    if (!/^\d{6}$/.test(form.code)) {
      setError('Enter the 6-digit code from your email.');
      return;
    }
    if (form.password.length < 8 || !/[A-Za-z]/.test(form.password) || !/\d/.test(form.password)) {
      setError('Password must be at least 8 characters with letters and numbers.');
      return;
    }
    if (form.password !== form.confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (captchaRequired && !captchaToken) {
      setError('Please complete the CAPTCHA check.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        email: form.email,
        code: form.code,
        password: form.password,
        captchaToken,
      });
      setDone(true);
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
          <p className="eyebrow">New password</p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-charcoal">Enter your reset code</h1>
          <p className="mt-2 text-sm text-gray">
            Use the 6-digit code we emailed you. It expires in 15 minutes.
          </p>

          {error && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {done ? (
            <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-center">
              <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
              <p className="mt-3 text-sm font-medium text-emerald-800">
                Your password has been updated. You can now sign in.
              </p>
              <button onClick={() => navigate('/login')} className="btn-dark mt-5 w-full">
                Go to sign in
              </button>
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
                  value={form.email}
                  onChange={setField('email')}
                />
              </div>
              <div>
                <label className="label" htmlFor="code">6-digit code</label>
                <input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  className="input text-center text-xl font-semibold tracking-[0.5em]"
                  placeholder="000000"
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                />
              </div>
              <div>
                <label className="label" htmlFor="password">New password</label>
                <PasswordInput
                  id="password"
                  autoComplete="new-password"
                  placeholder="8+ characters, letters & numbers"
                  value={form.password}
                  onChange={setField('password')}
                />
              </div>
              <div>
                <label className="label" htmlFor="confirm">Confirm new password</label>
                <PasswordInput
                  id="confirm"
                  autoComplete="new-password"
                  placeholder="Repeat new password"
                  value={form.confirm}
                  onChange={setField('confirm')}
                />
              </div>
              <Captcha onTokenChange={setCaptchaToken} onRequiredChange={setCaptchaRequired} resetKey={captchaResetKey} />
              <button type="submit" className="btn-gold w-full" disabled={loading}>
                {loading ? 'Updating…' : 'Update password'}
              </button>
              <Link to="/forgot-password" className="block text-center text-sm font-semibold text-charcoal hover:underline">
                Didn&apos;t get a code? Send a new one
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
