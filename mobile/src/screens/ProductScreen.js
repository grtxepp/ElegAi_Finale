import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, Pressable, Alert } from 'react-native';
import { Screen, Field, PrimaryButton, ChipRow, ProductCard, Loading, ErrorBox } from '../components';
import api, { errMsg } from '../api';
import { C, DISPLAY, card } from '../theme';
import { formatPeso, imgUrl } from '../utils';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Ionicons } from '@expo/vector-icons';

export default function ProductScreen({ route, navigation }) {
  const { id } = route.params;
  const { user } = useAuth();
  const { addItem } = useCart();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [size, setSize] = useState('');
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError('');
    api
      .get(`/products/${id}`)
      .then(({ data }) => {
        setProduct(data.product);
        setRelated(data.related || []);
      })
      .catch((e) => setError(errMsg(e)))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Screen><Loading /></Screen>;
  if (error || !product) return <Screen><ErrorBox message={error || 'Product not found.'} /></Screen>;

  const out = product.stock <= 0;

  const handleAdd = async () => {
    if (!user) {
      Alert.alert('Sign in required', 'Please sign in to add items to your cart.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign in', onPress: () => navigation.navigate('Login') },
      ]);
      return;
    }
    if (!size && !product.available_sizes.includes('One Size')) {
      Alert.alert('Select a size', 'Please choose a size first.');
      return;
    }
    setBusy(true);
    try {
      await addItem(product.product_id, qty);
      Alert.alert('Added to cart', `${qty} × ${product.name}`, [
        { text: 'Keep browsing', style: 'cancel' },
        { text: 'View cart', onPress: () => navigation.navigate('Cart') },
      ]);
    } catch (e) {
      Alert.alert('Error', errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Image source={{ uri: imgUrl(product.image_url) }} style={styles.hero} resizeMode="cover" />
      <View style={{ marginTop: 18 }}>
        <Text style={styles.eyebrow}>{product.category}</Text>
        <Text style={styles.name}>{product.name}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 }}>
          <Text style={styles.price}>{formatPeso(product.price)}</Text>
          <View style={styles.stockBadge}>
            <Text style={styles.stockText}>{out ? 'Sold out' : `${product.stock} in stock`}</Text>
          </View>
        </View>
        <Text style={styles.desc}>{product.description}</Text>

        <View style={{ flexDirection: 'row', gap: 12, marginTop: 14 }}>
          <View style={[styles.meta, { flex: 1 }]}><Text style={styles.metaLabel}>Color</Text><Text style={styles.metaValue}>{product.color}</Text></View>
          <View style={[styles.meta, { flex: 1 }]}><Text style={styles.metaLabel}>Category</Text><Text style={styles.metaValue}>{product.category}</Text></View>
        </View>

        <View style={{ marginTop: 20 }}>
          <Text style={styles.sectionLabel}>Select size</Text>
          <ChipRow options={product.available_sizes} value={size} onChange={setSize} />
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 22 }}>
          <View style={styles.stepper}>
            <Pressable onPress={() => setQty((v) => Math.max(1, v - 1))} style={styles.stepBtn}>
              <Ionicons name="remove" size={18} color={C.charcoal} />
            </Pressable>
            <Text style={styles.qty}>{qty}</Text>
            <Pressable onPress={() => setQty((v) => Math.min(product.stock || 1, v + 1))} style={styles.stepBtn}>
              <Ionicons name="add" size={18} color={C.charcoal} />
            </Pressable>
          </View>
          <View style={{ flex: 1 }}>
            <PrimaryButton title={user ? 'Add to cart' : 'Sign in to add to cart'} onPress={handleAdd} disabled={out} loading={busy} />
          </View>
        </View>

        {!user && (
          <Text style={{ color: C.gray, fontSize: 13, marginTop: 10, textAlign: 'center' }}>
            Sign in to add items to your cart.
          </Text>
        )}

        {related.length > 0 && (
          <View style={{ marginTop: 30 }}>
            <Text style={styles.sectionTitle}>You may also like</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingVertical: 12 }}>
              {related.map((p) => (
                <View key={p.product_id} style={{ width: 160 }}>
                  <ProductCard product={p} onPress={() => navigation.replace('Product', { id: p.product_id })} />
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { width: '100%', aspectRatio: 3 / 4, borderRadius: 24, backgroundColor: C.ivoryDark },
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase', color: C.gold },
  name: { fontFamily: DISPLAY, fontSize: 28, fontWeight: '700', color: C.charcoal, marginTop: 4 },
  price: { fontFamily: DISPLAY, fontSize: 26, fontWeight: '700', color: C.goldDark },
  stockBadge: { backgroundColor: C.ivoryDark, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  stockText: { fontSize: 12, fontWeight: '600', color: C.charcoal },
  desc: { color: C.gray, fontSize: 15, lineHeight: 23, marginTop: 12 },
  meta: { backgroundColor: C.white, borderRadius: 12, padding: 12 },
  metaLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, color: C.grayLight },
  metaValue: { fontSize: 15, fontWeight: '600', color: C.charcoal, marginTop: 2 },
  sectionLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, color: C.gray, marginBottom: 8 },
  stepper: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.white, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(31,31,31,0.15)' },
  stepBtn: { padding: 12 },
  qty: { width: 34, textAlign: 'center', fontWeight: '700', fontSize: 15 },
  sectionTitle: { fontFamily: DISPLAY, fontSize: 20, fontWeight: '700', color: C.charcoal },
});
