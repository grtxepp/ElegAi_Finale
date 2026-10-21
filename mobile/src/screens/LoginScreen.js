import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Screen, Field, PasswordField, PrimaryButton, GhostButton, ErrorBox, Title } from '../components';
import { useAuth } from '../context/AuthContext';
import { errMsg } from '../api';
import { C, DISPLAY } from '../theme';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError('');
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      const user = await login(email.trim(), password);
      if (user.role === 'admin') {
        Alert.alert('Admin detected', 'The admin console runs on the web app. Signing you out of the mobile storefront.');
        // The web app is at the same backend (admin routes are web-only).
      }
      if (navigation.canGoBack()) navigation.goBack();
      else navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    } catch (e) {
      setError(errMsg(e, 'Unable to sign in.'));
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
          <Title style={{ marginTop: 8 }}>Welcome back</Title>
          <Text style={styles.sub}>Sign in to your ElegAI account</Text>
        </View>

        <View style={{ marginTop: 26 }}>
          {error ? <ErrorBox message={error} /> : null}
          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <PasswordField
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
          />
          <PrimaryButton title="Sign in" onPress={submit} loading={loading} />
          <GhostButton title="Forgot password?" onPress={() => navigation.navigate('Forgot')} />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>New to ElegAI?</Text>
          <GhostButton title="Create an account" onPress={() => navigation.navigate('Register')} />
          {navigation.canGoBack() ? (
            <GhostButton title="Continue browsing" onPress={() => navigation.popToTop()} />
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  logo: { fontFamily: DISPLAY, fontSize: 40, fontWeight: '700', color: C.charcoal },
  sub: { color: C.gray, fontSize: 15, marginTop: 6 },
  footer: { marginTop: 26, alignItems: 'center' },
  footerText: { color: C.gray, fontSize: 14 },
});
