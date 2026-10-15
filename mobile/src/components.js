import React from 'react';
import {
  View, Text, TextInput, Pressable, ActivityIndicator, Image, ScrollView, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { C, DISPLAY, card } from './theme';
import { formatPeso, imgUrl } from './utils';

/* ── Screen scaffold: safe area + optional scroll ──────────────────── */
export function Screen({ children, scroll = true, style }) {
  const body = scroll ? (
    <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
  ) : (
    <View style={{ flex: 1, padding: 20 }}>{children}</View>
  );
  return <SafeAreaView style={[styles.screen, style]} edges={['top', 'left', 'right']}>{body}</SafeAreaView>;
}

/* ── Form field ────────────────────────────────────────────────────── */
export function Field({ label, error, ...props }) {
  return (
    <View style={{ marginBottom: 14 }}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={C.grayLight}
        style={[styles.input, error && { borderColor: C.danger }]}
        {...props}
      />
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

/* ── Buttons ───────────────────────────────────────────────────────── */
export function PrimaryButton({ title, onPress, loading = false, disabled, style }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.btnPrimary,
        (disabled || loading) && { opacity: 0.55 },
        pressed && { opacity: 0.85 },
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={C.white} /> : <Text style={styles.btnPrimaryText}>{title}</Text>}
    </Pressable>
  );
}

export function GhostButton({ title, onPress, style }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.btnGhost, pressed && { opacity: 0.7 }, style]}
    >
      <Text style={styles.btnGhostText}>{title}</Text>
    </Pressable>
  );
}

export function IconButton({ icon, onPress, color = C.charcoal, size = 20 }) {
  return (
    <Pressable onPress={onPress} hitSlop={10} style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}>
      <Ionicons name={icon} size={size} color={color} />
    </Pressable>
  );
}

/* ── Chip (single-select pill) ─────────────────────────────────────── */
export function Chip({ label, active, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        active ? styles.chipActive : styles.chipIdle,
        pressed && { opacity: 0.8 },
      ]}
    >
      <Text style={active ? styles.chipTextActive : styles.chipTextIdle}>{label}</Text>
    </Pressable>
  );
}

export function ChipRow({ options, value, onChange, horizontal = true }) {
  return (
    <ScrollView horizontal={horizontal} showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 2 }}>
      {options.map((o) => (
        <Chip key={o} label={o} active={value === o} onPress={() => onChange(value === o ? '' : o)} />
      ))}
    </ScrollView>
  );
}

/* ── Product card ──────────────────────────────────────────────────── */
export function ProductCard({ product, onPress, onAdd }) {
  const out = product.stock <= 0;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.productCard, pressed && { opacity: 0.9 }]}>
      <View style={styles.productImgWrap}>
        <Image source={{ uri: imgUrl(product.image_url) }} style={styles.productImg} resizeMode="cover" />
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryBadgeText}>{product.category}</Text>
        </View>
        {out && (
          <View style={styles.outWrap}>
            <Text style={styles.outText}>Out of stock</Text>
          </View>
        )}
      </View>
      <View style={{ padding: 10 }}>
        <Text numberOfLines={1} style={styles.productName}>{product.name}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
          <Text style={styles.price}>{formatPeso(product.price)}</Text>
          {onAdd && !out && (
            <Pressable onPress={onAdd} hitSlop={8} style={({ pressed }) => [styles.addBtn, pressed && { backgroundColor: C.goldDark }]}>
              <Ionicons name="bag-add" size={16} color={C.white} />
            </Pressable>
          )}
        </View>
      </View>
    </Pressable>
  );
}

/* ── States ────────────────────────────────────────────────────────── */
export function Loading() {
  return (
    <View style={{ paddingVertical: 60, alignItems: 'center' }}>
      <ActivityIndicator size="large" color={C.gold} />
      <Text style={{ marginTop: 12, color: C.gray, fontSize: 14 }}>Loading…</Text>
    </View>
  );
}

export function EmptyState({ icon = 'file-tray-outline', title, message, action }) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 50, paddingHorizontal: 20 }}>
      <Ionicons name={icon} size={44} color={C.grayLight} />
      <Text style={[styles.emptyTitle, { marginTop: 12 }]}>{title}</Text>
      {message ? <Text style={styles.emptyMsg}>{message}</Text> : null}
      {action}
    </View>
  );
}

export function ErrorBox({ message }) {
  return (
    <View style={styles.errorBox}>
      <Text style={styles.errorText}>{message}</Text>
    </View>
  );
}

/* ── Order status badge ────────────────────────────────────────────── */
const STATUS_STYLES = {
  Pending: { bg: '#FEF3C7', fg: '#B45309' },
  Confirmed: { bg: '#DBEAFE', fg: '#1D4ED8' },
  Processing: { bg: '#EDE9FE', fg: '#6D28D9' },
  Shipped: { bg: '#CFFAFE', fg: '#0E7490' },
  Delivered: { bg: '#D1FAE5', fg: '#059669' },
  Cancelled: { bg: '#FEE2E2', fg: '#B91C1C' },
};
export function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || { bg: '#F3F4F6', fg: '#374151' };
  return (
    <View style={{ backgroundColor: s.bg, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
      <Text style={{ color: s.fg, fontSize: 12, fontWeight: '700' }}>{status}</Text>
    </View>
  );
}

/* ── Headings ──────────────────────────────────────────────────────── */
export function Eyebrow({ children }) {
  return <Text style={styles.eyebrow}>{children}</Text>;
}
export function Title({ children, style }) {
  return <Text style={[styles.title, style]}>{children}</Text>;
}
export function SectionTitle({ children }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.ivory },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', color: C.gray, marginBottom: 6 },
  input: {
    backgroundColor: C.white, borderWidth: 1, borderColor: 'rgba(31,31,31,0.15)',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: C.charcoal,
  },
  fieldError: { color: C.danger, fontSize: 12, marginTop: 4 },
  btnPrimary: {
    backgroundColor: C.gold, borderRadius: 999, paddingVertical: 15, alignItems: 'center',
    shadowColor: '#1F1F1F', shadowOpacity: 0.12, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 3,
  },
  btnPrimaryText: { color: C.white, fontWeight: '700', fontSize: 15, letterSpacing: 0.3 },
  btnGhost: { borderRadius: 999, paddingVertical: 13, alignItems: 'center', backgroundColor: 'transparent' },
  btnGhostText: { color: C.charcoal, fontWeight: '600', fontSize: 14 },
  iconBtn: { padding: 6 },
  chip: { borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  chipActive: { backgroundColor: C.gold },
  chipIdle: { backgroundColor: C.white, borderWidth: 1, borderColor: 'rgba(31,31,31,0.15)' },
  chipTextActive: { color: C.white, fontSize: 12, fontWeight: '600' },
  chipTextIdle: { color: C.charcoal, fontSize: 12, fontWeight: '500' },
  productCard: {
    backgroundColor: C.white, borderRadius: 16, overflow: 'hidden',
    shadowColor: '#1F1F1F', shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2,
  },
  productImgWrap: { aspectRatio: 3 / 4, backgroundColor: C.ivoryDark },
  productImg: { width: '100%', height: '100%' },
  categoryBadge: { position: 'absolute', top: 8, left: 8, backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  categoryBadgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', color: C.charcoal },
  outWrap: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.6)' },
  outText: { backgroundColor: C.charcoal, color: C.white, fontSize: 11, fontWeight: '700', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  productName: { fontSize: 15, fontWeight: '600', color: C.charcoal, fontFamily: DISPLAY },
  price: { fontSize: 16, fontWeight: '700', color: C.goldDark },
  addBtn: { backgroundColor: C.charcoal, borderRadius: 999, padding: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: C.charcoal, fontFamily: DISPLAY },
  emptyMsg: { color: C.gray, fontSize: 14, textAlign: 'center', marginTop: 6 },
  errorBox: { backgroundColor: C.dangerBg, borderRadius: 12, padding: 12, marginBottom: 14 },
  errorText: { color: '#B91C1C', fontSize: 13 },
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 2.5, textTransform: 'uppercase', color: C.gold },
  title: { fontSize: 32, fontWeight: '700', color: C.charcoal, fontFamily: DISPLAY },
  sectionTitle: { fontSize: 22, fontWeight: '700', color: C.charcoal, fontFamily: DISPLAY },
});
