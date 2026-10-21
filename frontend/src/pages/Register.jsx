import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { errMsg } from '../api/client.js';
import Captcha from '../components/Captcha.jsx';
import PasswordInput from '../components/PasswordInput.jsx';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaRequired, setCaptchaRequired] = useState(true);
  const [captchaResetKey, setCaptchaResetKey] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim() || !form.email.trim() || !form.password) {
      setError('Please fill in all fields.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email)) {
      setError('Please enter a valid email address.');
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
      await register(form.name.trim(), form.email.trim(), form.password, captchaToken);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(errMsg(err, 'Unable to create your account.'));
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
          <p className="eyebrow">Join ElegAI</p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-charcoal">Create account</h1>
          <p className="mt-2 text-sm text-gray">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-gold-dark hover:underline">Sign in</Link>
          </p>

          {error && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div>
              <label className="label" htmlFor="name">Full name</label>
              <input
                id="name"
                className="input"
                placeholder="Maria Santos"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                className="input"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <label className="label" htmlFor="password">Password</label>
              <PasswordInput
                id="password"
                autoComplete="new-password"
                placeholder="8+ characters, letters & numbers"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
            <div>
              <label className="label" htmlFor="confirm">Confirm password</label>
              <PasswordInput
                id="confirm"
                autoComplete="new-password"
                placeholder="Repeat your password"
                value={form.confirm}
                onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              />
            </div>
            <Captcha onTokenChange={setCaptchaToken} onRequiredChange={setCaptchaRequired} resetKey={captchaResetKey} />
            <button type="submit" className="btn-gold w-full" disabled={loading}>
              {loading ? 'Creating account…' : 'Create my account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
