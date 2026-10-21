import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Screen, Field, PasswordField, PrimaryButton, GhostButton, ErrorBox, Title } from '../components';
import api, { errMsg } from '../api';
import { C } from '../theme';

export default function ForgotPasswordScreen({ navigation }) {
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [devCode, setDevCode] = useState('');
  const [notice, setNotice] = useState('');

  const sendCode = async () => {
    setError('');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email: email.trim() });
      setDevCode(data.devCode || '');
      setNotice(data.message || 'If that email is registered, a 6-digit code is on its way.');
      setStep('code');
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    setError('');
    const cleanCode = code.replace(/\D/g, '');
    if (!/^\d{6}$/.test(cleanCode)) {
      setError('Enter the 6-digit code from your email.');
      return;
    }
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      setError('Password must be at least 8 characters with letters and numbers.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        email: email.trim(),
        code: cleanCode,
        password,
      });
      Alert.alert('Password updated', 'You can now sign in with your new password.', [
        { text: 'Sign in', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <View style={{ marginTop: 30 }}>
        <Title>Reset password</Title>
        <Text style={styles.sub}>
          {step === 'email'
            ? 'Enter the email on your account and we will send you a 6-digit reset code.'
            : 'Enter the code we emailed you and choose a new password.'}
        </Text>
      </View>

      <View style={{ marginTop: 24 }}>
        {error ? <ErrorBox message={error} /> : null}

        {step === 'code' ? (
          <View style={styles.noticeBox}>
            <Text style={styles.noticeTitle}>Check your email</Text>
            <Text style={styles.message}>{notice}</Text>
            {devCode ? (
              <>
                <Text style={styles.devLabel}>Development code (no mail server configured)</Text>
                <Text style={styles.devCode}>{devCode}</Text>
              </>
            ) : null}
          </View>
        ) : null}

        <Field
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          autoCapitalize="none"
          keyboardType="email-address"
        />

        {step === 'code' ? (
          <>
            <Field
              label="6-digit code"
              value={code}
              onChangeText={(value) => setCode(value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              keyboardType="number-pad"
              maxLength={6}
            />
            <PasswordField
              label="New password"
              value={password}
              onChangeText={setPassword}
              placeholder="8+ characters, letters & numbers"
            />
            <PasswordField
              label="Confirm new password"
              value={confirm}
              onChangeText={setConfirm}
              placeholder="Repeat new password"
            />
            <PrimaryButton
              title={loading ? 'Updating…' : 'Update password'}
              onPress={resetPassword}
              loading={loading}
            />
            <GhostButton title="Send a new code" onPress={sendCode} />
            <GhostButton title="Back to sign in" onPress={() => navigation.goBack()} />
          </>
        ) : (
          <>
            <PrimaryButton
              title={loading ? 'Sending code…' : 'Send reset code'}
              onPress={sendCode}
              loading={loading}
            />
            <GhostButton title="Back to sign in" onPress={() => navigation.goBack()} />
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sub: { color: C.gray, fontSize: 15, marginTop: 6 },
  noticeBox: { backgroundColor: C.white, borderRadius: 14, padding: 16, marginBottom: 14 },
  noticeTitle: { fontSize: 12, fontWeight: '700', color: C.gray, textTransform: 'uppercase', letterSpacing: 0.5 },
  message: { color: C.charcoal, fontSize: 14, marginTop: 10, lineHeight: 20 },
  devLabel: { color: C.gray, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 14 },
  devCode: { color: C.charcoal, fontSize: 26, fontWeight: '700', letterSpacing: 8, marginTop: 6 },
});
