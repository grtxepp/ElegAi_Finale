import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, Pressable } from 'react-native';
import { Screen, ChipRow, ProductCard, Loading, ErrorBox, Eyebrow, Title, SectionTitle } from '../components';
import api, { errMsg } from '../api';
import { C, DISPLAY, card } from '../theme';
import { imgUrl } from '../utils';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['Bridal Gowns', 'Evening Gowns', 'Formal Dresses', 'Suits', 'Barongs', 'Accessories'];

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/products', { params: { inStock: 'true', limit: 8, sort: 'newest' } })
      .then(({ data }) => setFeatured(data.items))
      .catch((e) => setError(errMsg(e)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Screen>
      {/* Hero */}
      <View style={styles.hero}>
        <Image source={{ uri: imgUrl('/images/hero-landing.jpg') }} style={styles.heroImg} resizeMode="cover" />
        <View style={styles.heroOverlay}>
          <Eyebrow>AI-powered formal wear boutique</Eyebrow>
          <Text style={styles.heroTitle}>
            Dressed for the moment,{'\n'}
            <Text style={{ fontStyle: 'italic', color: C.goldLight }}>styled by AI.</Text>
          </Text>
          <Pressable style={({ pressed }) => [styles.heroCta, pressed && { opacity: 0.85 }]} onPress={() => navigation.navigate('Stylist')}>
            <Text style={styles.heroCtaText}>✨ Meet your AI Stylist</Text>
          </Pressable>
        </View>
      </View>

      {error ? <ErrorBox message={`${error}\n\nTip: ${'edit mobile/src/config.js → API_BASE'}`} /> : null}

      {/* Categories */}
      <View style={{ marginTop: 22 }}>
        <SectionTitle>Shop by category</SectionTitle>
        <View style={{ marginTop: 10 }}>
          <ChipRow
            options={CATEGORIES}
            value=""
            onChange={(c) => c && navigation.navigate('Catalog', { category: c })}
          />
        </View>
      </View>

      {/* Featured */}
      <View style={{ marginTop: 26 }}>
        <SectionTitle>Featured pieces</SectionTitle>
        {loading ? (
          <Loading />
        ) : (
          <FlatList
            data={featured}
            keyExtractor={(p) => String(p.product_id)}
            numColumns={2}
            columnWrapperStyle={{ gap: 12 }}
            contentContainerStyle={{ gap: 12, marginTop: 12, paddingBottom: 8 }}
            renderItem={({ item }) => (
              <View style={{ flex: 1 }}>
                <ProductCard
                  product={item}
                  onPress={() => navigation.navigate('Product', { id: item.product_id })}
                />
              </View>
            )}
          />
        )}
      </View>

      {/* Stylist CTA */}
      <Pressable style={({ pressed }) => [styles.cta, pressed && { opacity: 0.9 }]} onPress={() => navigation.navigate('Stylist')}>
        <Eyebrow>Your personal stylist</Eyebrow>
        <Text style={styles.ctaTitle}>Not sure what to wear?</Text>
        <Text style={styles.ctaText}>
          Occasion, style, color, fit and measurements — get tailored recommendations from the real catalog.
        </Text>
        <Text style={styles.ctaBtn}>Get my recommendations →</Text>
      </Pressable>

      {/* Account hint */}
      {!user && (
        <View style={[card, { marginTop: 20, alignItems: 'center' }]}>
          <Text style={{ color: C.gray, fontSize: 14, textAlign: 'center' }}>
            Sign in to add items to your cart and unlock saved style preferences.
          </Text>
          <Pressable style={({ pressed }) => [styles.inlineBtn, pressed && { opacity: 0.85 }]} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.inlineBtnText}>Sign in / Register</Text>
          </Pressable>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: 24, overflow: 'hidden', height: 420 },
  heroImg: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject, padding: 22, justifyContent: 'flex-end',
    backgroundColor: 'rgba(31,31,31,0.25)',
  },
  heroTitle: { fontFamily: DISPLAY, fontSize: 34, fontWeight: '700', color: C.white, marginTop: 8 },
  heroCta: { backgroundColor: C.gold, borderRadius: 999, paddingVertical: 13, alignItems: 'center', marginTop: 16, alignSelf: 'flex-start', paddingHorizontal: 22 },
  heroCtaText: { color: C.white, fontWeight: '700', fontSize: 14 },
  cta: { backgroundColor: C.charcoal, borderRadius: 24, padding: 22, marginTop: 26 },
  ctaTitle: { fontFamily: DISPLAY, fontSize: 24, fontWeight: '700', color: C.white, marginTop: 6 },
  ctaText: { color: 'rgba(255,255,255,0.75)', fontSize: 14, marginTop: 6, lineHeight: 21 },
  ctaBtn: { color: C.goldLight, fontWeight: '700', marginTop: 12, fontSize: 14 },
  inlineBtn: { backgroundColor: C.charcoal, borderRadius: 999, paddingVertical: 11, paddingHorizontal: 26, marginTop: 12 },
  inlineBtnText: { color: C.white, fontWeight: '700', fontSize: 14 },
});
