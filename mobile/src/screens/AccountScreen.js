import React from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, PrimaryButton, GhostButton } from '../components';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { C, DISPLAY, card } from '../theme';
import { formatDate } from '../utils';

export default function AccountScreen({ navigation }) {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const profile = user?.profile;

  const handleLogout = () => {
    Alert.alert('Logout', 'Sign out of ElegAI?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          navigation.getParent()?.reset({ index: 0, routes: [{ name: 'Main' }] });
        },
      },
    ]);
  };

  if (!user) {
    return (
      <Screen>
        <View style={{ marginTop: 36 }}>
          <Text style={styles.guestLogo}>
            Eleg<Text style={{ color: C.gold }}>AI</Text>
          </Text>
          <Text style={styles.guestTitle}>Sign in to your account</Text>
          <Text style={styles.guestText}>
            Save your style profile, sync your cart, track orders and follow replies from the boutique.
          </Text>
        </View>

        <View style={{ marginTop: 24, gap: 10 }}>
          <PrimaryButton title="Sign in" onPress={() => navigation.navigate('Login')} />
          <GhostButton title="Create an account" onPress={() => navigation.navigate('Register')} />
        </View>

        <View style={[card, { marginTop: 20, padding: 8 }]}>
          <Pressable
            onPress={() => navigation.navigate('Catalog')}
            style={({ pressed }) => [styles.menuRow, pressed && { backgroundColor: C.ivory }]}
          >
            <Ionicons name="shirt-outline" size={20} color={C.goldDark} />
            <Text style={styles.menuLabel}>Browse the collection</Text>
            <Ionicons name="chevron-forward" size={18} color={C.grayLight} />
          </Pressable>
          <Pressable
            onPress={() => navigation.navigate('Stylist')}
            style={({ pressed }) => [styles.menuRow, pressed && { backgroundColor: C.ivory }]}
          >
            <Ionicons name="sparkles-outline" size={20} color={C.goldDark} />
            <Text style={styles.menuLabel}>Ask the AI Stylist</Text>
            <Ionicons name="chevron-forward" size={18} color={C.grayLight} />
          </Pressable>
        </View>
      </Screen>
    );
  }

  const initials = user.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  const links = [
    { icon: 'cube-outline', label: 'My orders', onPress: () => navigation.navigate('Orders') },
    { icon: 'clipboard-outline', label: 'My style requests', onPress: () => navigation.navigate('Requests') },
    { icon: 'person-outline', label: 'Profile & style preferences', onPress: () => navigation.navigate('Profile') },
    { icon: 'sparkles-outline', label: 'AI Stylist', onPress: () => navigation.navigate('Stylist') },
    { icon: 'bag-handle-outline', label: 'Shopping cart', onPress: () => navigation.navigate('Cart') },
  ];

  return (
    <Screen>
      {/* User card */}
      <View style={[styles.userCard, { backgroundColor: C.charcoal }]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{user.role === 'admin' ? 'Administrator' : 'Customer'}</Text>
          </View>
        </View>
      </View>

      {/* Style profile summary */}
      <View style={[card, { marginTop: 14 }]}>
        <Text style={styles.cardTitle}>Your style profile</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 }}>
          {[
            ['Style', profile?.preferredStyle],
            ['Color', profile?.preferredColor],
            ['Fit', profile?.preferredFit],
            ['Size', profile?.preferredSize],
            ['Height', profile?.heightCm ? `${profile.heightCm} cm` : null],
            ['Member since', formatDate(user.createdAt)],
          ]
            .filter(([, v]) => v)
            .map(([k, v]) => (
              <View key={k} style={styles.profilePill}>
                <Text style={styles.profilePillLabel}>{k}</Text>
                <Text style={styles.profilePillValue}>{v}</Text>
              </View>
            ))}
        </View>
        {!profile?.preferredStyle && (
          <Pressable onPress={() => navigation.navigate('Profile')}>
            <Text style={{ color: C.goldDark, fontWeight: '700', fontSize: 13, marginTop: 10 }}>
              Set your style preferences →
            </Text>
          </Pressable>
        )}
      </View>

      {/* Quick stats */}
      <View style={{ flexDirection: 'row', gap: 12, marginTop: 14 }}>
        <View style={[card, { flex: 1, alignItems: 'center' }]}>
          <Text style={styles.statValue}>{cart.count}</Text>
          <Text style={styles.statLabel}>Items in cart</Text>
        </View>
        <View style={[card, { flex: 1, alignItems: 'center' }]}>
          <Text style={styles.statValue}>{user.role === 'admin' ? 'Admin' : 'Customer'}</Text>
          <Text style={styles.statLabel}>Account role</Text>
        </View>
      </View>

      {/* Menu */}
      <View style={[card, { marginTop: 14, padding: 8 }]}>
        {links.map((l) => (
          <Pressable
            key={l.label}
            onPress={l.onPress}
            style={({ pressed }) => [styles.menuRow, pressed && { backgroundColor: C.ivory }]}
          >
            <Ionicons name={l.icon} size={20} color={C.goldDark} />
            <Text style={styles.menuLabel}>{l.label}</Text>
            <Ionicons name="chevron-forward" size={18} color={C.grayLight} />
          </Pressable>
        ))}
      </View>

      {user.role === 'admin' && (
        <View style={{ marginTop: 14 }}>
          <Text style={{ color: C.gray, fontSize: 13, textAlign: 'center' }}>
            The full admin console (dashboard, products, orders, customers) runs on the web app.
          </Text>
        </View>
      )}

      <View style={{ marginTop: 20 }}>
        <PrimaryButton title="Logout" onPress={handleLogout} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  userCard: { borderRadius: 20, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: C.gold, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: DISPLAY, fontSize: 20, fontWeight: '700', color: C.charcoal },
  userName: { fontFamily: DISPLAY, fontSize: 20, fontWeight: '700', color: C.white },
  userEmail: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 2 },
  roleBadge: { alignSelf: 'flex-start', backgroundColor: 'rgba(201,162,39,0.25)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, marginTop: 6 },
  roleText: { color: C.goldLight, fontSize: 11, fontWeight: '700' },
  cardTitle: { fontFamily: DISPLAY, fontSize: 18, fontWeight: '700', color: C.charcoal },
  profilePill: { backgroundColor: C.ivory, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  profilePillLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, color: C.grayLight },
  profilePillValue: { fontSize: 14, fontWeight: '700', color: C.charcoal, marginTop: 2 },
  statValue: { fontFamily: DISPLAY, fontSize: 22, fontWeight: '700', color: C.goldDark },
  statLabel: { color: C.gray, fontSize: 12, marginTop: 2 },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 13, borderRadius: 12 },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: C.charcoal },
  guestLogo: { fontFamily: DISPLAY, fontSize: 40, fontWeight: '700', color: C.charcoal },
  guestTitle: { fontFamily: DISPLAY, fontSize: 28, fontWeight: '700', color: C.charcoal, marginTop: 8 },
  guestText: { color: C.gray, fontSize: 14, lineHeight: 21, marginTop: 8 },
});
