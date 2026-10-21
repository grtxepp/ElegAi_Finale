import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Field, PasswordField, PrimaryButton, GhostButton, ErrorBox, SectionTitle } from '../components';
import { ChipRow } from '../components';
import api, { errMsg } from '../api';
import { useAuth } from '../context/AuthContext';
import { C, card } from '../theme';

const STYLES = ['Elegant', 'Classic', 'Modern', 'Romantic', 'Vintage', 'Minimalist', 'Bold / Statement', 'Traditional'];
const COLORS = ['Ivory', 'White', 'Gold', 'Black', 'Navy', 'Red', 'Green', 'Pink', 'Champagne', 'Charcoal', 'Gray'];
const FITS = ['A-Line', 'Mermaid', 'Ball Gown', 'Sheath', 'Fit & Flare', 'Slim Fit', 'Tailored', 'Relaxed Fit'];
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'One Size'];

export default function ProfileScreen() {
  const { user, refreshUser } = useAuth();
  const profile = user?.profile || {};
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [pwd, setPwd] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [style, setStyle] = useState({
    preferredStyle: profile.preferredStyle || '',
    preferredColor: profile.preferredColor || '',
    preferredFit: profile.preferredFit || '',
    preferredSize: profile.preferredSize || '',
    heightCm: profile.heightCm ? String(profile.heightCm) : '',
    measurements: profile.measurements
      ? typeof profile.measurements === 'string'
        ? profile.measurements
        : JSON.stringify(profile.measurements)
      : '',
  });
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (v) => setStyle((f) => ({ ...f, [k]: v }));
  const flash = (m, e) => {
    setMsg(m);
    setErr(e);
    setTimeout(() => { setMsg(''); setErr(''); }, 4000);
  };

  const saveAccount = async () => {
    setBusy(true);
    try {
      await api.put('/profile', { name, email });
      await refreshUser();
      flash('Account details updated.', '');
    } catch (e) {
      flash('', errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  const saveStyle = async () => {
    setBusy(true);
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
    } catch (e) {
      flash('', errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  const changePassword = async () => {
    setBusy(true);
    try {
      if (pwd.newPassword !== pwd.confirm) throw new Error('Passwords do not match.');
      await api.post('/profile/change-password', {
        currentPassword: pwd.currentPassword,
        newPassword: pwd.newPassword,
      });
      setPwd({ currentPassword: '', newPassword: '', confirm: '' });
      flash('Password changed successfully.', '');
    } catch (e) {
      flash('', errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
      <Text style={styles.pageTitle}>Profile & style preferences</Text>
      <Text style={{ color: C.gray, fontSize: 13, marginTop: 4 }}>
        The AI stylist uses your style profile to recommend pieces just for you.
      </Text>

      {msg ? <View style={styles.okBox}><Text style={styles.okText}>{msg}</Text></View> : null}
      {err ? <View style={{ marginTop: 12 }}><ErrorBox message={err} /></View> : null}

      {/* Account */}
      <View style={[card, { marginTop: 18 }]}>
        <SectionTitle>Account details</SectionTitle>
        <View style={{ marginTop: 14 }}>
          <Field label="Full name" value={name} onChangeText={setName} />
          <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
          <PrimaryButton title="Save details" onPress={saveAccount} loading={busy} />
        </View>

        <View style={{ marginTop: 22 }}>
          <SectionTitle>Change password</SectionTitle>
          <View style={{ marginTop: 14 }}>
            <PasswordField label="Current password" value={pwd.currentPassword} onChangeText={(v) => setPwd({ ...pwd, currentPassword: v })} />
            <PasswordField label="New password" value={pwd.newPassword} onChangeText={(v) => setPwd({ ...pwd, newPassword: v })} />
            <PasswordField label="Confirm new password" value={pwd.confirm} onChangeText={(v) => setPwd({ ...pwd, confirm: v })} />
            <GhostButton title="Update password" onPress={changePassword} />
          </View>
        </View>
      </View>

      {/* Style preferences */}
      <View style={[card, { marginTop: 14 }]}>
        <SectionTitle>Style preferences</SectionTitle>
        <Text style={styles.label}>Preferred style</Text>
        <ChipRow options={STYLES} value={style.preferredStyle} onChange={set('preferredStyle')} />
        <Text style={styles.label}>Preferred color</Text>
        <ChipRow options={COLORS} value={style.preferredColor} onChange={set('preferredColor')} />
        <Text style={styles.label}>Preferred fit</Text>
        <ChipRow options={FITS} value={style.preferredFit} onChange={set('preferredFit')} />
        <Text style={styles.label}>Usual size</Text>
        <ChipRow options={SIZES} value={style.preferredSize} onChange={set('preferredSize')} />
        <Text style={styles.label}>Height (cm)</Text>
        <Field value={style.heightCm} onChangeText={set('heightCm')} placeholder="165" keyboardType="number-pad" />
        <Text style={styles.label}>Measurements (JSON)</Text>
        <Field
          value={style.measurements}
          onChangeText={set('measurements')}
          placeholder='{"bust":88,"waist":66,"hips":92}'
          multiline
        />
        <Text style={{ color: C.grayLight, fontSize: 12, marginTop: -6, marginBottom: 12 }}>
          Optional — used only to inform size recommendations. We never judge measurements.
        </Text>
        <PrimaryButton title="Save style preferences" onPress={saveStyle} loading={busy} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pageTitle: { fontFamily: 'serif', fontSize: 28, fontWeight: '700', color: C.charcoal },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', color: C.gray, marginTop: 18, marginBottom: 8 },
  okBox: { backgroundColor: C.successBg, borderRadius: 12, padding: 12, marginTop: 12 },
  okText: { color: '#047857', fontSize: 13 },
});
