import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import api, { errMsg } from '../api/client.js';
import Captcha from '../components/Captcha.jsx';
import PasswordInput from '../components/PasswordInput.jsx';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaRequired, setCaptchaRequired] = useState(true);
  const [captchaResetKey, setCaptchaResetKey] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
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
      await api.post('/auth/reset-password', { token, password: form.password, captchaToken });
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
          <h1 className="mt-2 font-display text-3xl font-semibold text-charcoal">Set your password</h1>

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
                <label className="label" htmlFor="password">New password</label>
                <PasswordInput
                  id="password"
                  autoComplete="new-password"
                  placeholder="8+ characters, letters & numbers"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </div>
              <div>
                <label className="label" htmlFor="confirm">Confirm new password</label>
                <PasswordInput
                  id="confirm"
                  autoComplete="new-password"
                  placeholder="Repeat new password"
                  value={form.confirm}
                  onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                />
              </div>
              <Captcha onTokenChange={setCaptchaToken} onRequiredChange={setCaptchaRequired} resetKey={captchaResetKey} />
              <button type="submit" className="btn-gold w-full" disabled={loading}>
                {loading ? 'Updating…' : 'Update password'}
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
