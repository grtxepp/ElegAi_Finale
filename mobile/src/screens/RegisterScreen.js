import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Screen, Field, PasswordField, PrimaryButton, GhostButton, ErrorBox, Title } from '../components';
import { useAuth } from '../context/AuthContext';
import { errMsg } from '../api';
import { C, DISPLAY } from '../theme';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
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
    setLoading(true);
    try {
      await register(form.name.trim(), form.email.trim(), form.password);
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    } catch (e) {
      setError(errMsg(e, 'Unable to create your account.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ marginTop: 30 }}>
          <Text style={styles.logo}>
            Eleg<Text style={{ color: C.gold }}>AI</Text>
          </Text>
          <Title style={{ marginTop: 8 }}>Create account</Title>
          <Text style={styles.sub}>Join the boutique — styled by AI</Text>
        </View>

        <View style={{ marginTop: 24 }}>
          {error ? <ErrorBox message={error} /> : null}
          <Field label="Full name" value={form.name} onChangeText={set('name')} placeholder="Maria Santos" />
          <Field label="Email" value={form.email} onChangeText={set('email')} placeholder="you@example.com" autoCapitalize="none" keyboardType="email-address" />
          <PasswordField label="Password" value={form.password} onChangeText={set('password')} placeholder="8+ characters, letters & numbers" />
          <PasswordField label="Confirm password" value={form.confirm} onChangeText={set('confirm')} placeholder="Repeat your password" />
          <PrimaryButton title="Create my account" onPress={submit} loading={loading} />
          <GhostButton title="Already have an account? Sign in" onPress={() => navigation.navigate('Login')} />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  logo: { fontFamily: DISPLAY, fontSize: 40, fontWeight: '700', color: C.charcoal },
  sub: { color: C.gray, fontSize: 15, marginTop: 6 },
});
