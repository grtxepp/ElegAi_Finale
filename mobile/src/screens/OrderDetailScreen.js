import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Loading, ErrorBox, PrimaryButton, StatusBadge, SectionTitle } from '../components';
import api, { errMsg } from '../api';
import { C, DISPLAY, card } from '../theme';
import { formatPeso, formatDateTime, imgUrl } from '../utils';

const TIMELINE = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered'];

export default function OrderDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => {
    setLoading(true);
    setError('');
    api
      .get(`/orders/${id}`)
      .then(({ data }) => setOrder(data.order))
      .catch((e) => setError(errMsg(e)))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  const cancel = async () => {
    if (!order) return;
    Alert.alert('Cancel order?', 'Items will be restocked.', [
      { text: 'Keep order', style: 'cancel' },
      {
        text: 'Cancel order',
        style: 'destructive',
        onPress: async () => {
          setBusy(true);
          try {
            await api.post(`/orders/${id}/cancel`);
            load();
          } catch (e) {
            Alert.alert('Error', errMsg(e));
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  };

  if (loading) return <Screen><Loading /></Screen>;
  if (error || !order) return <Screen><ErrorBox message={error || 'Order not found.'} /></Screen>;

  const cancelled = order.status === 'Cancelled';
  const currentStep = TIMELINE.indexOf(order.status);
  const addr = order.shipping_address || {};

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View>
          <Text style={styles.pageTitle}>Order #{order.order_id}</Text>
          <Text style={{ color: C.gray, fontSize: 13 }}>Placed {formatDateTime(order.created_at)}</Text>
        </View>
        <StatusBadge status={order.status} />
      </View>

      {/* Tracking */}
      <View style={[card, { marginTop: 18 }]}>
        <SectionTitle>Order tracking</SectionTitle>
        {cancelled ? (
          <Text style={{ color: C.danger, fontSize: 14, marginTop: 10 }}>This order was cancelled. Items were returned to stock.</Text>
        ) : (
          <View style={{ marginTop: 18 }}>
            {TIMELINE.map((step, i) => {
              const reached = i <= currentStep;
              return (
                <View key={step} style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {i > 0 && <View style={[styles.line, i <= currentStep ? styles.lineOn : styles.lineOff]} />}
                  <View style={{ alignItems: 'center' }}>
                    <View style={[styles.dot, reached ? styles.dotOn : styles.dotOff]}>
                      {reached && <Ionicons name="checkmark" size={16} color={C.white} />}
                    </View>
                    <Text style={[styles.stepLabel, reached ? { color: C.charcoal } : { color: C.grayLight }]}>{step}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
        {order.status === 'Pending' && !cancelled && (
          <View style={{ marginTop: 14 }}>
            <PrimaryButton title="Cancel order" onPress={cancel} loading={busy} />
          </View>
        )}
      </View>

      {/* Items */}
      <View style={[card, { marginTop: 14 }]}>
        <SectionTitle>Items</SectionTitle>
        {order.items.map((item) => (
          <View key={item.order_item_id} style={styles.itemRow}>
            <Pressable onPress={() => navigation.navigate('Product', { id: item.product_id })}>
              <Image source={{ uri: imgUrl(item.image_url) }} style={styles.itemImage} />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Pressable onPress={() => navigation.navigate('Product', { id: item.product_id })}>
                <Text style={{ fontWeight: '600', color: C.charcoal }}>{item.name}</Text>
              </Pressable>
              <Text style={{ color: C.gray, fontSize: 12 }}>{item.color} A� Qty {item.quantity}</Text>
            </View>
            <Text style={{ fontWeight: '600' }}>{formatPeso(item.price * item.quantity)}</Text>
          </View>
        ))}
        <View style={{ borderTopWidth: 1, borderTopColor: 'rgba(31,31,31,0.08)', marginTop: 12, paddingTop: 12, flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontWeight: '700', fontSize: 16 }}>Total</Text>
          <Text style={{ fontFamily: 'serif', fontWeight: '700', fontSize: 18, color: C.goldDark }}>{formatPeso(order.total_amount)}</Text>
        </View>
      </View>

      {/* Shipping + payment */}
      <View style={[card, { marginTop: 14 }]}>
        <SectionTitle>Shipping address</SectionTitle>
        <View style={{ marginTop: 10 }}>
          {addr.fullName ? <Text style={styles.addrLine}>{addr.fullName}</Text> : null}
          <Text style={styles.addrLine}>{addr.line1}</Text>
          {addr.line2 ? <Text style={styles.addrLine}>{addr.line2}</Text> : null}
          <Text style={styles.addrLine}>{addr.city}, {addr.province} {addr.postal}</Text>
          <Text style={styles.addrLine}>{addr.phone}</Text>
          {addr.notes ? <Text style={styles.addrNote}>{addr.notes}</Text> : null}
        </View>
        <View style={{ borderTopWidth: 1, borderTopColor: 'rgba(31,31,31,0.08)', marginTop: 12, paddingTop: 12 }}>
          <Text style={styles.payLabel}>Payment</Text>
          <Text style={{ color: C.charcoal, fontSize: 14, fontWeight: '600', marginTop: 4 }}>{order.payment_method}</Text>
          <Text style={{ color: C.grayLight, fontSize: 12, marginTop: 4 }}>Demo checkout — no real payment processed.</Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  pageTitle: { fontFamily: DISPLAY, fontSize: 26, fontWeight: '700', color: C.charcoal },
  dot: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  dotOn: { borderColor: C.gold, backgroundColor: C.gold },
  dotOff: { borderColor: 'rgba(31,31,31,0.15)', backgroundColor: C.white },
  line: { width: 28, height: 2 },
  lineOn: { backgroundColor: C.gold },
  lineOff: { backgroundColor: 'rgba(31,31,31,0.1)' },
  stepLabel: { fontSize: 10, fontWeight: '600', marginTop: 4 },
  addrLine: { color: C.gray, fontSize: 14, marginTop: 2 },
  addrNote: { color: C.gray, fontSize: 13, fontStyle: 'italic', backgroundColor: C.ivory, borderRadius: 8, padding: 8, marginTop: 8 },
  payLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, color: C.gray },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  itemImage: { width: 52, height: 68, borderRadius: 8, backgroundColor: C.ivoryDark },
});
