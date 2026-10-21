import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Loading, EmptyState, ErrorBox, StatusBadge } from '../components';
import api, { errMsg } from '../api';
import { C, DISPLAY, card } from '../theme';
import { formatPeso, formatDateTime } from '../utils';

const FILTERS = ['All', 'Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

export default function OrdersScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/orders');
      setOrders(data.orders);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visible = filter === 'All' ? orders : orders.filter((o) => o.status === filter);

  return (
    <Screen scroll={false}>
      <Text style={styles.pageTitle}>My orders</Text>
      <FlatList
        data={visible}
        keyExtractor={(o) => String(o.order_id)}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} tintColor={C.gold} />}
        ListHeaderComponent={
          <FlatList
            horizontal
            data={FILTERS}
            keyExtractor={(f) => f}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, marginBottom: 14 }}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => setFilter(item)}
                style={[styles.filterChip, filter === item && styles.filterChipActive]}
              >
                <Text style={[styles.filterText, filter === item && { color: C.white }]}>{item}</Text>
              </Pressable>
            )}
          />
        }
        ListEmptyComponent={
          loading ? <Loading /> : error ? <ErrorBox message={error} /> : (
            <EmptyState title="No orders here" message={filter === 'All' ? 'Your orders will appear here once you check out.' : `No ${filter.toLowerCase()} orders yet.`} />
          )
        }
        contentContainerStyle={{ paddingBottom: 30 }}
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [card, styles.orderCard, pressed && { opacity: 0.9 }]}
            onPress={() => navigation.navigate('OrderDetail', { id: item.order_id })}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={styles.iconWrap}>
                  <Ionicons name="cube-outline" size={18} color={C.goldDark} />
                </View>
                <View>
                  <Text style={styles.orderId}>Order #{item.order_id}</Text>
                  <Text style={styles.orderMeta}>
                    {formatDateTime(item.created_at)} A� {item.item_count} item{item.item_count === 1 ? '' : 's'} A� {item.payment_method}
                  </Text>
                </View>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 6 }}>
                <Text style={styles.total}>{formatPeso(item.total_amount)}</Text>
                <StatusBadge status={item.status} />
              </View>
            </View>
          </Pressable>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  pageTitle: { fontFamily: DISPLAY, fontSize: 26, fontWeight: '700', color: C.charcoal, marginBottom: 14 },
  filterChip: { borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: C.white, borderWidth: 1, borderColor: 'rgba(31,31,31,0.15)' },
  filterChipActive: { backgroundColor: C.charcoal },
  filterText: { fontSize: 12, fontWeight: '600', color: C.charcoal },
  orderCard: { marginBottom: 12 },
  iconWrap: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(201,162,39,0.15)', alignItems: 'center', justifyContent: 'center' },
  orderId: { fontWeight: '700', color: C.charcoal, fontSize: 15 },
  orderMeta: { color: C.gray, fontSize: 12, marginTop: 2 },
  total: { fontFamily: DISPLAY, fontSize: 16, fontWeight: '700', color: C.goldDark },
});
