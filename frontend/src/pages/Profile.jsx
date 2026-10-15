import { useState } from 'react';
import { Save, KeyRound, Check } from 'lucide-react';
import api, { errMsg } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { OCCASIONS, STYLES, COLORS, FITS, SIZES } from '../utils/options.js';
import Spinner from '../components/Spinner.jsx';

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [account, setAccount] = useState({ name: user?.name || '', email: user?.email || '' });
  const [pwd, setPwd] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const profile = user?.profile || {};

  const [style, setStyle] = useState({
    preferredStyle: profile.preferredStyle || '',
    preferredColor: profile.preferredColor || '',
    preferredFit: profile.preferredFit || '',
    heightCm: profile.heightCm || '',
    measurements: profile.measurements
      ? typeof profile.measurements === 'string'
        ? profile.measurements
        : JSON.stringify(profile.measurements)
      : '',
  });

  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);

  if (!user) return <div className="container-app flex justify-center py-24"><Spinner /></div>;

  const flash = (m, e) => {
    setMsg(m);
    setErr(e);
    setTimeout(() => {
      setMsg('');
      setErr('');
    }, 4000);
  };

  const saveAccount = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/profile', account);
      await refreshUser();
      flash('Account details updated.', '');
    } catch (err2) {
      flash('', errMsg(err2));
    } finally {
      setSaving(false);
    }
  };

  const saveStyle = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/profile', {
        preferredStyle: style.preferredStyle || null,
        preferredColor: style.preferredColor || null,
        preferredFit: style.preferredFit || null,
        heightCm: style.heightCm ? Number(style.heightCm) : null,
        measurements: style.measurements || null,
      });
      await refreshUser();
      flash('Style preferences saved — the AI stylist will use them.', '');
    } catch (err2) {
      flash('', errMsg(err2));
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (pwd.newPassword !== pwd.confirm) throw new Error('Passwords do not match.');
      await api.post('/profile/change-password', {
        currentPassword: pwd.currentPassword,
        newPassword: pwd.newPassword,
      });
      setPwd({ currentPassword: '', newPassword: '', confirm: '' });
      flash('Password changed successfully.', '');
    } catch (err2) {
      flash('', errMsg(err2));
    } finally {
      setSaving(false);
    }
  };

  const selectClass = (active) =>
    `rounded-full border px-3 py-1.5 text-xs font-medium transition ${
      active ? 'border-gold bg-gold text-white' : 'border-charcoal/15 bg-white text-charcoal hover:border-gold'
    }`;

  return (
    <div className="container-app py-12">
      <p className="eyebrow">Your account</p>
      <h1 className="mt-2 font-display text-4xl font-semibold text-charcoal">Profile & style preferences</h1>
      <p className="mt-2 text-gray">Keep your details and style profile up to date — the AI stylist uses them to recommend pieces just for you.</p>

      {(msg || err) && (
        <div className={`mt-6 rounded-xl border px-4 py-3 text-sm ${err ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>
          {err || msg}
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        {/* Account */}
        <div className="card p-6">
          <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-charcoal">
            <KeyRound className="h-5 w-5 text-gold-dark" /> Account details
          </h2>
          <form onSubmit={saveAccount} className="mt-5 space-y-4">
            <div>
              <label className="label">Full name</label>
              <input className="input" value={account.name} onChange={(e) => setAccount({ ...account, name: e.target.value })} />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" value={account.email} onChange={(e) => setAccount({ ...account, email: e.target.value })} />
            </div>
            <button type="submit" className="btn-dark" disabled={saving}>
              <Save className="h-4 w-4" /> Save details
            </button>
          </form>

          <h3 className="mt-8 font-display text-lg font-semibold text-charcoal">Change password</h3>
          <form onSubmit={changePassword} className="mt-4 space-y-4">
            <div>
              <label className="label">Current password</label>
              <input className="input" type="password" value={pwd.currentPassword} onChange={(e) => setPwd({ ...pwd, currentPassword: e.target.value })} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">New password</label>
                <input className="input" type="password" value={pwd.newPassword} onChange={(e) => setPwd({ ...pwd, newPassword: e.target.value })} />
              </div>
              <div>
                <label className="label">Confirm</label>
                <input className="input" type="password" value={pwd.confirm} onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })} />
              </div>
            </div>
            <button type="submit" className="btn-outline" disabled={saving}>
              Update password
            </button>
          </form>
        </div>

        {/* Style profile */}
        <div className="card p-6">
          <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-charcoal">
            <Check className="h-5 w-5 text-gold-dark" /> Style preferences
          </h2>
          <p className="mt-2 text-sm text-gray">These preferences are saved and pre-filled in the AI stylist.</p>

          <form onSubmit={saveStyle} className="mt-5 space-y-5">
            <div>
              <label className="label">Preferred style</label>
              <div className="flex flex-wrap gap-2">
                {STYLES.map((s) => (
                  <button type="button" key={s} className={selectClass(style.preferredStyle === s)} onClick={() => setStyle({ ...style, preferredStyle: s })}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Preferred color</label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((c) => (
                  <button type="button" key={c} className={selectClass(style.preferredColor === c)} onClick={() => setStyle({ ...style, preferredColor: c })}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Preferred fit / silhouette</label>
              <div className="flex flex-wrap gap-2">
                {FITS.map((f) => (
                  <button type="button" key={f} className={selectClass(style.preferredFit === f)} onClick={() => setStyle({ ...style, preferredFit: f })}>
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Height (cm)</label>
                <input className="input" type="number" min="100" max="250" placeholder="165" value={style.heightCm} onChange={(e) => setStyle({ ...style, heightCm: e.target.value })} />
              </div>
              <div>
                <label className="label">Usual size</label>
                <select className="input" value={style.preferredSize || ''} onChange={(e) => setStyle({ ...style, preferredSize: e.target.value })}>
                  <option value="">Select size…</option>
                  {SIZES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="label">Measurements (JSON)</label>
              <textarea
                className="input min-h-24 font-mono text-xs"
                placeholder='{"bust":88,"waist":66,"hips":92,"shoulder":40}'
                value={style.measurements}
                onChange={(e) => setStyle({ ...style, measurements: e.target.value })}
              />
              <p className="mt-1 text-xs text-gray-light">Optional — used only to inform size recommendations. We never judge measurements.</p>
            </div>
            <button type="submit" className="btn-gold" disabled={saving}>
              <Save className="h-4 w-4" /> Save style preferences
            </button>
          </form>
        </div>
      </div>

      {/* Occasion inspiration */}
      <div className="card mt-8 p-6">
        <h3 className="font-display text-lg font-semibold text-charcoal">Upcoming occasions we can style you for</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {OCCASIONS.map((o) => (
            <span key={o} className="badge bg-ivory-dark text-charcoal">{o}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
