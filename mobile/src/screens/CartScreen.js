import React from 'react';
import { View, Text, StyleSheet, FlatList, Image, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, PrimaryButton, EmptyState, Loading } from '../components';
import { useCart } from '../context/CartContext';
import { formatPeso, imgUrl } from '../utils';
import { C, DISPLAY, card } from '../theme';
import { errMsg } from '../api';

export default function CartScreen({ navigation }) {
  const { cart, loading, updateQty, removeItem } = useCart();

  if (loading) return <Screen><Loading /></Screen>;

  if (!cart.items.length) {
    return (
      <Screen>
        <EmptyState
          icon="bag-handle-outline"
          title="Your cart is empty"
          message="Beautiful pieces are waiting. Browse the collection or ask the AI stylist."
          action={
            <View style={{ marginTop: 16, width: '100%', gap: 10 }}>
              <PrimaryButton title="Browse catalog" onPress={() => navigation.navigate('Catalog')} />
              <PrimaryButton title="Ask the AI stylist" onPress={() => navigation.navigate('Stylist')} />
            </View>
          }
        />
      </Screen>
    );
  }

  const changeQty = async (cartId, qty) => {
    try {
      await updateQty(cartId, qty);
    } catch (e) {
      Alert.alert('Error', errMsg(e));
    }
  };

  const remove = async (cartId) => {
    try {
      await removeItem(cartId);
    } catch (e) {
      Alert.alert('Error', errMsg(e));
    }
  };

  return (
    <Screen scroll={false}>
      <Text style={styles.pageTitle}>Shopping cart</Text>
      <FlatList
        data={cart.items}
        keyExtractor={(i) => String(i.cartId)}
        contentContainerStyle={{ gap: 12, paddingBottom: 12 }}
        renderItem={({ item }) => (
          <View style={[card, { flexDirection: 'row', gap: 12 }]}>
            <Pressable onPress={() => navigation.navigate('Product', { id: item.product.product_id })}>
              <Image source={{ uri: imgUrl(item.product.image_url) }} style={{ width: 84, height: 112, borderRadius: 12, backgroundColor: C.ivoryDark }} />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Pressable onPress={() => navigation.navigate('Product', { id: item.product.product_id })}>
                <Text numberOfLines={2} style={styles.itemName}>{item.product.name}</Text>
              </Pressable>
              <Text style={styles.itemMeta}>{item.product.color} · {item.product.category}</Text>
              <Text style={styles.itemPrice}>{formatPeso(item.product.price)} each</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                <View style={styles.stepper}>
                  <Pressable onPress={() => changeQty(item.cartId, item.quantity - 1)} style={styles.stepBtn}>
                    <Ionicons name="remove" size={16} color={C.charcoal} />
                  </Pressable>
                  <Text style={styles.qty}>{item.quantity}</Text>
                  <Pressable onPress={() => changeQty(item.cartId, item.quantity + 1)} style={styles.stepBtn}>
                    <Ionicons name="add" size={16} color={C.charcoal} />
                  </Pressable>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Text style={styles.lineTotal}>{formatPeso(item.lineTotal)}</Text>
                  <Pressable onPress={() => remove(item.cartId)} hitSlop={8}>
                    <Ionicons name="trash-outline" size={18} color={C.grayLight} />
                  </Pressable>
                </View>
              </View>
            </View>
          </View>
        )}
        ListFooterComponent={
          <View style={[card, { marginTop: 8 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={styles.sumLabel}>Subtotal ({cart.count} item{cart.count === 1 ? '' : 's'})</Text>
              <Text style={styles.sumValue}>{formatPeso(cart.total)}</Text>
            </View>
            <Text style={{ color: C.grayLight, fontSize: 12, marginTop: 4 }}>Shipping calculated at checkout</Text>
            <View style={{ marginTop: 14 }}>
              <PrimaryButton title={`Checkout · ${formatPeso(cart.total)}`} onPress={() => navigation.navigate('Checkout')} />
            </View>
          </View>
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  pageTitle: { fontFamily: DISPLAY, fontSize: 26, fontWeight: '700', color: C.charcoal, marginBottom: 14 },
  itemName: { fontFamily: DISPLAY, fontSize: 16, fontWeight: '700', color: C.charcoal },
  itemMeta: { fontSize: 12, color: C.gray, marginTop: 2 },
  itemPrice: { fontSize: 14, fontWeight: '700', color: C.goldDark, marginTop: 4 },
  stepper: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.ivory, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(31,31,31,0.12)' },
  stepBtn: { padding: 8 },
  qty: { width: 26, textAlign: 'center', fontWeight: '700', fontSize: 14 },
  lineTotal: { fontWeight: '700', color: C.charcoal, fontSize: 15 },
  sumLabel: { fontSize: 15, color: C.gray },
  sumValue: { fontSize: 15, fontWeight: '700', color: C.charcoal },
});
