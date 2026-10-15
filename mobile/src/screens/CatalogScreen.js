import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, RefreshControl } from 'react-native';
import { Screen, ChipRow, ProductCard, Loading, ErrorBox, EmptyState } from '../components';
import api, { errMsg } from '../api';
import { C } from '../theme';

const CATEGORIES = ['All', 'Bridal Gowns', 'Evening Gowns', 'Formal Dresses', 'Suits', 'Barongs', 'Accessories'];
const SORTS = ['Newest', 'Price: low → high', 'Price: high → low'];

export default function CatalogScreen({ navigation, route }) {
  const initial = route.params?.category || 'All';
  const [category, setCategory] = useState(initial);
  const [sort, setSort] = useState('Newest');
  const [q, setQ] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const sortParam = { 'Newest': '', 'Price: low → high': 'price_asc', 'Price: high → low': 'price_desc' }[sort];

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const params = { inStock: 'true', limit: 50 };
      if (category !== 'All') params.category = category;
      if (sortParam) params.sort = sortParam;
      if (q.trim()) params.q = q.trim();
      const { data } = await api.get('/products', { params });
      setItems(data.items);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [category, sortParam, q]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load(true);
  };

  return (
    <Screen scroll={false}>
      <View style={{ marginBottom: 12 }}>
        <Text style={styles.pageTitle}>Browse formal wear</Text>
        <TextInput
          style={styles.search}
          placeholder="Search gowns, suits, barongs…"
          placeholderTextColor={C.grayLight}
          value={q}
          onChangeText={setQ}
          returnKeyType="search"
        />
      </View>

      <View style={{ marginBottom: 10 }}>
        <ChipRow options={CATEGORIES} value={category} onChange={setCategory} />
        <View style={{ marginTop: 8 }}>
          <ChipRow options={SORTS} value={sort} onChange={setSort} />
        </View>
      </View>

      {error ? (
        <ErrorBox message={error} />
      ) : loading ? (
        <Loading />
      ) : items.length === 0 ? (
        <EmptyState title="No pieces match" message="Try different filters or search terms." />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(p) => String(p.product_id)}
          numColumns={2}
          columnWrapperStyle={{ gap: 12 }}
          contentContainerStyle={{ gap: 12, paddingBottom: 30 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.gold} />}
          ListHeaderComponent={<Text style={styles.count}>{items.length} item{items.length === 1 ? '' : 's'}</Text>}
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
    </Screen>
  );
}

const styles = StyleSheet.create({
  pageTitle: { fontFamily: 'serif', fontSize: 26, fontWeight: '700', color: C.charcoal, marginBottom: 12 },
  search: {
    backgroundColor: C.white, borderRadius: 999, paddingHorizontal: 18, paddingVertical: 12,
    fontSize: 15, color: C.charcoal, borderWidth: 1, borderColor: 'rgba(31,31,31,0.12)',
  },
  count: { color: C.gray, fontSize: 13, marginBottom: 4 },
});
