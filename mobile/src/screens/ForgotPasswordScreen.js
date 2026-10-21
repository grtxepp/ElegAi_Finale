import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, Linking } from 'react-native';
import { Screen, Field, PrimaryButton, GhostButton, ErrorBox, Title } from '../components';
import api, { errMsg } from '../api';
import { C } from '../theme';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [link, setLink] = useState('');

  const submit = async () => {
    setError('');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      setLink(data.resetUrl || data.message || 'Reset link generated.');
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
        <Text style={styles.sub}>Enter the email on your account — we’ll generate a one-time reset link.</Text>
      </View>

      <View style={{ marginTop: 24 }}>
        {error ? <ErrorBox message={error} /> : null}
        {link ? (
          <View style={styles.linkBox}>
            <Text style={styles.linkTitle}>Development link (no mail server configured):</Text>
            <Text style={styles.linkText}>{link}</Text>
            <PrimaryButton
              title="Open reset link in browser"
              onPress={() => Linking.openURL(link)}
            />
            <Text style={styles.hint}>
              Reset your password in the browser, then sign in here with the new password.
            </Text>
          </View>
        ) : (
          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
          />
        )}
        {!link && <PrimaryButton title="Generate reset link" onPress={submit} loading={loading} />}
        <GhostButton title="← Back to sign in" onPress={() => navigation.goBack()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sub: { color: C.gray, fontSize: 15, marginTop: 6 },
  linkBox: { backgroundColor: C.white, borderRadius: 14, padding: 16, marginBottom: 14 },
  linkTitle: { fontSize: 12, fontWeight: '700', color: C.gray, textTransform: 'uppercase', letterSpacing: 0.5 },
  linkText: { color: C.goldDark, fontSize: 13, marginTop: 8, marginBottom: 14 },
  hint: { color: C.grayLight, fontSize: 12, marginTop: 12, textAlign: 'center' },
});
