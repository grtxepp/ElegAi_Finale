import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, Pressable, Image, Alert, ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { ChipRow, PrimaryButton, EmptyState, ErrorBox, Eyebrow, SectionTitle } from '../components';
import api, { errMsg } from '../api';
import { C, DISPLAY, card } from '../theme';
import { formatPeso, imgUrl } from '../utils';

const OCCASIONS = ['Wedding', 'Cocktail Party', 'Gala / Formal Ball', 'Corporate Event', 'Graduation', 'Debut / Quinceañera', 'Engagement', 'Garden Party', 'Date Night'];
const STYLES = ['Elegant', 'Classic', 'Modern', 'Romantic', 'Vintage', 'Minimalist', 'Bold / Statement', 'Traditional'];
const COLORS = ['Ivory', 'White', 'Gold', 'Black', 'Navy', 'Red', 'Green', 'Pink', 'Champagne', 'Charcoal', 'Gray'];
const FITS = ['A-Line', 'Mermaid', 'Ball Gown', 'Sheath', 'Fit & Flare', 'Slim Fit', 'Tailored', 'Relaxed Fit'];
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'One Size'];

export default function StylistScreen({ navigation }) {
  const [form, setForm] = useState({
    occasion: '', style: '', color: '', fit: '', size: '', heightCm: '', measurements: '', notes: '',
  });
  const [photo, setPhoto] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [requestOpen, setRequestOpen] = useState(false);
  const [requestBusy, setRequestBusy] = useState(false);
  const [requestError, setRequestError] = useState('');
  const [requestDone, setRequestDone] = useState(false);
  const [requestForm, setRequestForm] = useState({ sizing: '', measurements: '', notes: '' });

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const pickPhoto = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });
    if (!res.canceled && res.assets[0]) {
      const a = res.assets[0];
      setPhoto({ uri: a.uri, name: a.fileName || 'photo.jpg', type: a.mimeType || 'image/jpeg' });
    }
  };

  const submit = async () => {
    setError('');
    if (!form.occasion) {
      Alert.alert('Occasion required', 'Choose an occasion at minimum.');
      return;
    }
    setLoading(true);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => v && fd.append(k, v));
    if (photo) fd.append('photo', { uri: photo.uri, name: photo.name, type: photo.type });
    try {
      const { data } = await api.post('/stylist/recommend', fd);
      setResult(data);
      setRequestDone(false);
      setRequestOpen(false);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setLoading(false);
    }
  };

  const submitRequest = async () => {
    setRequestError('');
    setRequestBusy(true);
    try {
      const prompt = [
        form.occasion && `Occasion: ${form.occasion}`,
        form.style && `Style: ${form.style}`,
        form.color && `Color: ${form.color}`,
        form.fit && `Fit: ${form.fit}`,
        form.size && `Size: ${form.size}`,
      ].filter(Boolean).join(' · ') || 'AI Stylist look request';

      await api.post('/chatbot/look-request', {
        prompt,
        sizing: requestForm.sizing || form.size || null,
        measurements: requestForm.measurements || form.measurements || null,
        notes: requestForm.notes || form.notes || null,
      });
      setRequestDone(true);
      setRequestOpen(false);
    } catch (e) {
      setRequestError(errMsg(e));
    } finally {
      setRequestBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
      <Eyebrow>AI Stylist</Eyebrow>
      <Text style={styles.pageTitle}>Tell us the occasion.{'\n'}<Text style={{ fontStyle: 'italic', color: C.goldDark }}>We’ll find the look.</Text></Text>
      <Text style={styles.intro}>
        The stylist analyzes your occasion, style, color, fit and measurements — plus an optional photo — and recommends real pieces with reasons.
      </Text>

      {error ? <View style={{ marginTop: 12 }}><ErrorBox message={error} /></View> : null}

      <View style={[card, { marginTop: 16 }]}>
        <SectionTitle>Your preferences</SectionTitle>

        <Text style={styles.label}>Occasion *</Text>
        <ChipRow options={OCCASIONS} value={form.occasion} onChange={set('occasion')} />

        <Text style={styles.label}>Style</Text>
        <ChipRow options={STYLES} value={form.style} onChange={set('style')} />

        <Text style={styles.label}>Preferred color</Text>
        <ChipRow options={COLORS} value={form.color} onChange={set('color')} />

        <Text style={styles.label}>Preferred fit</Text>
        <ChipRow options={FITS} value={form.fit} onChange={set('fit')} />

        <Text style={styles.label}>Size</Text>
        <ChipRow options={SIZES} value={form.size} onChange={set('size')} />

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Height (cm)</Text>
            <TextInput style={styles.input} keyboardType="number-pad" placeholder="165" placeholderTextColor={C.grayLight} value={form.heightCm} onChangeText={set('heightCm')} />
          </View>
        </View>

        <Text style={styles.label}>Measurements (JSON, optional)</Text>
        <TextInput
          style={[styles.input, { minHeight: 60, fontFamily: 'monospace', fontSize: 13 }]}
          multiline
          placeholder='{"bust":88,"waist":66,"hips":92}'
          placeholderTextColor={C.grayLight}
          value={form.measurements}
          onChangeText={set('measurements')}
        />

        <Text style={styles.label}>Notes for the stylist</Text>
        <TextInput style={[styles.input, { minHeight: 60 }]} multiline placeholder="e.g. garden wedding in May, I love delicate lace…" placeholderTextColor={C.grayLight} value={form.notes} onChangeText={set('notes')} />

        <Text style={styles.label}>Photo (optional)</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          {photo ? (
            <Image source={{ uri: photo.uri }} style={{ width: 56, height: 72, borderRadius: 10, backgroundColor: C.ivoryDark }} />
          ) : (
            <View style={{ width: 56, height: 72, borderRadius: 10, borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(31,31,31,0.2)', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="camera-outline" size={22} color={C.grayLight} />
            </View>
          )}
          <Pressable style={({ pressed }) => [styles.ghostBtn, pressed && { opacity: 0.7 }]} onPress={pickPhoto}>
            <Text style={styles.ghostBtnText}>{photo ? 'Change photo' : 'Upload photo'}</Text>
          </Pressable>
          {photo && (
            <Pressable onPress={() => setPhoto(null)}><Text style={{ color: C.danger, fontSize: 13 }}>Remove</Text></Pressable>
          )}
        </View>
        <Text style={styles.hint}>Used to sense tones you love — never to judge your body.</Text>

        <View style={{ marginTop: 18 }}>
          <PrimaryButton
            title={loading ? 'Styling…' : '✨ Get my recommendations'}
            onPress={submit}
            loading={loading}
            disabled={!form.occasion}
          />
        </View>
      </View>

      {/* Results */}
      <View style={{ marginTop: 26 }}>
        {loading ? (
          <View style={{ alignItems: 'center', paddingVertical: 30 }}>
            <ActivityIndicator size="large" color={C.gold} />
            <Text style={{ marginTop: 12, color: C.gray }}>Consulting the stylist…</Text>
          </View>
        ) : result && result.recommendations?.length ? (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <SectionTitle>Recommended for you</SectionTitle>
            </View>
            <Text style={styles.providerBadge}>Powered by {result.provider}</Text>
            {result.summary ? <Text style={{ color: C.gray, fontStyle: 'italic', marginTop: 6 }}>“{result.summary}”</Text> : null}
            {result.recommendations.map((rec) => (
              <View key={rec.product.product_id} style={[card, { marginTop: 14, flexDirection: 'row', gap: 12 }]}>
                <Pressable onPress={() => navigation.navigate('Product', { id: rec.product.product_id })}>
                  <Image source={{ uri: imgUrl(rec.product.image_url) }} style={{ width: 88, height: 118, borderRadius: 12, backgroundColor: C.ivoryDark }} />
                </Pressable>
                <View style={{ flex: 1 }}>
                  <Text style={styles.recName}>{rec.product.name}</Text>
                  <Text style={styles.recCat}>{rec.product.category} · {formatPeso(rec.product.price)}</Text>
                  {(rec.reasons || []).map((r, i) => (
                    <View key={i} style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                      <Ionicons name="checkmark-circle" size={15} color={C.gold} />
                      <Text style={styles.recReason}>{r}</Text>
                    </View>
                  ))}
                  <Pressable style={({ pressed }) => [styles.viewBtn, pressed && { opacity: 0.85 }]} onPress={() => navigation.navigate('Product', { id: rec.product.product_id })}>
                    <Text style={styles.viewBtnText}>View product →</Text>
                  </Pressable>
                </View>
              </View>
            ))}

            <View style={[card, { marginTop: 18, padding: 16 }]}>
              {requestDone ? (
                <View>
                  <Text style={styles.requestDoneTitle}>Request sent</Text>
                  <Text style={styles.requestHint}>The boutique has your look request and will reach out shortly.</Text>
                  <Pressable onPress={() => navigation.navigate('Requests')} style={{ marginTop: 10 }}>
                    <Text style={{ color: C.goldDark, fontWeight: '700', fontSize: 13 }}>Track this request</Text>
                  </Pressable>
                </View>
              ) : requestOpen ? (
                <View>
                  <SectionTitle>Request this look</SectionTitle>
                  <Text style={styles.requestHint}>Send this look to the boutique with your sizing.</Text>
                  {requestError ? <View style={{ marginTop: 10 }}><ErrorBox message={requestError} /></View> : null}
                  <Text style={styles.label}>Sizing</Text>
                  <TextInput style={styles.input} placeholder="e.g. M, or bust/waist/hips" placeholderTextColor={C.grayLight} value={requestForm.sizing} onChangeText={(v) => setRequestForm((f) => ({ ...f, sizing: v }))} />
                  <Text style={styles.label}>Measurements</Text>
                  <TextInput style={[styles.input, { minHeight: 56 }]} multiline placeholder="e.g. bust 88, waist 66, hips 92" placeholderTextColor={C.grayLight} value={requestForm.measurements} onChangeText={(v) => setRequestForm((f) => ({ ...f, measurements: v }))} />
                  <Text style={styles.label}>Notes</Text>
                  <TextInput style={[styles.input, { minHeight: 56 }]} multiline placeholder="Anything else the boutique should know" placeholderTextColor={C.grayLight} value={requestForm.notes} onChangeText={(v) => setRequestForm((f) => ({ ...f, notes: v }))} />
                  <View style={{ marginTop: 14 }}>
                    <PrimaryButton title={requestBusy ? 'Sending…' : 'Send request'} onPress={submitRequest} loading={requestBusy} />
                    <Pressable onPress={() => setRequestOpen(false)} style={{ alignItems: 'center', paddingVertical: 12 }}>
                      <Text style={{ color: C.gray, fontSize: 13 }}>Cancel</Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <Pressable style={({ pressed }) => [styles.requestBtn, pressed && { opacity: 0.85 }]} onPress={() => setRequestOpen(true)}>
                  <Ionicons name="paper-plane-outline" size={16} color={C.white} />
                  <Text style={styles.requestBtnText}>Request this look</Text>
                </Pressable>
              )}
            </View>
          </>
        ) : result ? (
          <EmptyState title="No strong matches yet" message="Try widening your preferences." />
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pageTitle: { fontFamily: DISPLAY, fontSize: 32, fontWeight: '700', color: C.charcoal, marginTop: 6 },
  intro: { color: C.gray, fontSize: 14, lineHeight: 21, marginTop: 8 },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', color: C.gray, marginTop: 18, marginBottom: 8 },
  input: { backgroundColor: C.white, borderWidth: 1, borderColor: 'rgba(31,31,31,0.15)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: C.charcoal },
  ghostBtn: { borderRadius: 999, borderWidth: 1, borderColor: 'rgba(31,31,31,0.2)', paddingHorizontal: 16, paddingVertical: 10 },
  ghostBtnText: { color: C.charcoal, fontWeight: '600', fontSize: 13 },
  hint: { color: C.grayLight, fontSize: 12, marginTop: 6 },
  providerBadge: { alignSelf: 'flex-start', backgroundColor: 'rgba(201,162,39,0.15)', color: C.goldDark, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, fontSize: 11, fontWeight: '700', overflow: 'hidden', marginTop: 8 },
  recName: { fontFamily: DISPLAY, fontSize: 16, fontWeight: '700', color: C.charcoal },
  recCat: { fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5, color: C.grayLight, marginTop: 2 },
  recReason: { flex: 1, fontSize: 13, color: C.gray },
  viewBtn: { backgroundColor: C.charcoal, borderRadius: 999, paddingVertical: 9, alignItems: 'center', marginTop: 10 },
  viewBtnText: { color: C.white, fontSize: 13, fontWeight: '700' },
  requestBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.gold, borderRadius: 999, paddingVertical: 13 },
  requestBtnText: { color: C.white, fontSize: 14, fontWeight: '700' },
  requestDoneTitle: { fontFamily: DISPLAY, fontSize: 18, fontWeight: '700', color: C.charcoal },
  requestHint: { color: C.gray, fontSize: 13, marginTop: 4, lineHeight: 19 },
});
