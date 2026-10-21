import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Field, PrimaryButton, ChipRow, ErrorBox, SectionTitle, Loading } from '../components';
import api, { errMsg } from '../api';
import { useCart } from '../context/CartContext';
import { C, card } from '../theme';
import { formatPeso } from '../utils';

const PAYMENTS = ['Cash on Delivery', 'GCash', 'Card'];

export default function CheckoutScreen({ navigation }) {
  const { cart, loading, clearLocal } = useCart();
  const [form, setForm] = useState({
    fullName: '', line1: '', line2: '', city: '', province: '', postal: '', phone: '',
  });
  const [payment, setPayment] = useState('Cash on Delivery');
  const [error, setError] = useState('');
  const [placing, setPlacing] = useState(false);
  const [placed, setPlaced] = useState(null);

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  if (loading) return <Screen><Loading /></Screen>;

  if (placed) {
    return (
      <Screen>
        <View style={{ alignItems: 'center', marginTop: 60 }}>
          <Ionicons name="checkmark-circle" size={72} color={C.success} />
          <Text style={styles.successTitle}>Order placed!</Text>
          <Text style={styles.successText}>
            Order #{placed.orderId} is now Pending. Total: {formatPeso(placed.totalAmount)}.
          </Text>
          <Text style={{ color: C.grayLight, fontSize: 12, marginTop: 6 }}>Demo checkout — no real payment processed.</Text>
          <View style={{ width: '100%', gap: 10, marginTop: 24 }}>
            <PrimaryButton title="View order" onPress={() => navigation.replace('OrderDetail', { id: placed.orderId })} />
            <PrimaryButton title="Back to home" onPress={() => navigation.navigate('Main', { screen: 'Home' })} />
          </View>
        </View>
      </Screen>
    );
  }

  if (!cart.items.length) {
    return (
      <Screen>
        <Text style={styles.pageTitle}>Checkout</Text>
        <Text style={{ color: C.gray, textAlign: 'center', marginTop: 40 }}>Your cart is empty.</Text>
      </Screen>
    );
  }

  const submit = async () => {
    setError('');
    const { fullName, line1, city, province, phone } = form;
    if (!fullName.trim() || !line1.trim() || !city.trim() || !province.trim() || !phone.trim()) {
      setError('Please complete name, address line 1, city, province and phone.');
      return;
    }
    setPlacing(true);
    try {
      const { data } = await api.post('/orders', {
        shippingAddress: form,
        paymentMethod: payment,
      });
      clearLocal();
      setPlaced(data);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setPlacing(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
      <Text style={styles.pageTitle}>Checkout</Text>
      {error ? <ErrorBox message={error} /> : null}

      <View style={card}>
        <SectionTitle>Shipping details</SectionTitle>
        <View style={{ marginTop: 14 }}>
          <Field label="Full name *" value={form.fullName} onChangeText={set('fullName')} placeholder="Maria Santos" />
          <Field label="Address line 1 *" value={form.line1} onChangeText={set('line1')} placeholder="123 Rizal Avenue" />
          <Field label="Address line 2" value={form.line2} onChangeText={set('line2')} placeholder="Unit / building (optional)" />
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}><Field label="City *" value={form.city} onChangeText={set('city')} placeholder="San Pablo" /></View>
            <View style={{ flex: 1 }}><Field label="Province *" value={form.province} onChangeText={set('province')} placeholder="Laguna" /></View>
          </View>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}><Field label="Postal" value={form.postal} onChangeText={set('postal')} placeholder="4000" keyboardType="number-pad" /></View>
            <View style={{ flex: 1 }}><Field label="Phone *" value={form.phone} onChangeText={set('phone')} placeholder="0917 123 4567" keyboardType="phone-pad" /></View>
          </View>
        </View>
      </View>

      <View style={[card, { marginTop: 14 }]}>
        <SectionTitle>Payment method</SectionTitle>
        <View style={{ marginTop: 12 }}>
          <ChipRow options={PAYMENTS} value={payment} onChange={setPayment} />
        </View>
      </View>

      <View style={[card, { marginTop: 14 }]}>
        <SectionTitle>Your items</SectionTitle>
        {cart.items.map((i) => (
          <View key={i.cartId} style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
            <Text style={{ color: C.gray, flex: 1 }} numberOfLines={1}>{i.quantity} × {i.product.name}</Text>
            <Text style={{ fontWeight: '600' }}>{formatPeso(i.lineTotal)}</Text>
          </View>
        ))}
        <View style={{ borderTopWidth: 1, borderTopColor: 'rgba(31,31,31,0.08)', marginTop: 12, paddingTop: 12, flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontWeight: '700', fontSize: 16 }}>Total</Text>
          <Text style={{ fontFamily: 'serif', fontWeight: '700', fontSize: 18, color: C.goldDark }}>{formatPeso(cart.total)}</Text>
        </View>
      </View>

      <View style={{ marginTop: 18 }}>
        <PrimaryButton title={`Place order · ${formatPeso(cart.total)}`} onPress={submit} loading={placing} />
      </View>
      <Text style={{ color: C.grayLight, fontSize: 12, textAlign: 'center', marginTop: 10 }}>
        Cash on Delivery and GCash are simulated for this demo.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pageTitle: { fontFamily: 'serif', fontSize: 28, fontWeight: '700', color: C.charcoal, marginBottom: 14 },
  successTitle: { fontFamily: 'serif', fontSize: 28, fontWeight: '700', color: C.charcoal, marginTop: 16 },
  successText: { color: C.gray, fontSize: 14, textAlign: 'center', marginTop: 10 },
});
