import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, RefreshControl, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, ChipRow, ProductCard, Loading, ErrorBox, EmptyState } from '../components';
import api, { errMsg } from '../api';
import { C } from '../theme';

const CATEGORIES = ['All', 'Bridal Gowns', 'Evening Gowns', 'Formal Dresses', 'Suits', 'Barongs', 'Accessories'];
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'One Size'];
const SORTS = [
  { label: 'Newest', value: '' },
  { label: 'Price: low to high', value: 'price_asc' },
  { label: 'Price: high to low', value: 'price_desc' },
  { label: 'Name (A-Z)', value: 'name' },
];

export default function CatalogScreen({ navigation, route }) {
  const [category, setCategory] = useState(route.params?.category || 'All');
  const [sort, setSort] = useState('');
  const [q, setQ] = useState('');
  const [appliedQ, setAppliedQ] = useState('');
  const [color, setColor] = useState('');
  const [size, setSize] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [appliedMin, setAppliedMin] = useState('');
  const [appliedMax, setAppliedMax] = useState('');
  const [colors, setColors] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const requestId = useRef(0);

  useEffect(() => {
    const next = route.params?.category;
    if (next) setCategory(next);
  }, [route.params?.category]);

  useEffect(() => {
    api.get('/products/meta').then(({ data }) => setColors(data.colors || [])).catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAppliedQ(q.trim());
      setAppliedMin(minPrice);
      setAppliedMax(maxPrice);
    }, 350);
    return () => clearTimeout(timer);
  }, [q, minPrice, maxPrice]);

  const load = useCallback(
    async (pageToLoad = 1, append = false, silent = false) => {
      const id = ++requestId.current;
      if (append) setLoadingMore(true);
      else if (!silent) {
        setLoading(true);
        setItems([]);
      }
      setError('');
      try {
        const params = { inStock: 'true', limit: 12, page: pageToLoad };
        if (category !== 'All') params.category = category;
        if (color) params.color = color;
        if (size) params.size = size;
        if (appliedQ) params.q = appliedQ;
        if (appliedMin) params.minPrice = appliedMin;
        if (appliedMax) params.maxPrice = appliedMax;
        if (sort) params.sort = sort;

        const { data } = await api.get('/products', { params });
        if (id !== requestId.current) return;
        setItems((prev) => (append ? [...prev, ...data.items] : data.items));
        setTotal(data.total);
        setPages(data.pages);
        setPage(data.page || pageToLoad);
      } catch (e) {
        if (id === requestId.current) setError(errMsg(e));
      } finally {
        if (id === requestId.current) {
          setLoading(false);
          setLoadingMore(false);
          setRefreshing(false);
        }
      }
    },
    [category, color, size, appliedQ, appliedMin, appliedMax, sort]
  );

  useEffect(() => {
    load(1, false);
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load(1, false, true);
  };

  const clearAll = () => {
    setCategory('All');
    setColor('');
    setSize('');
    setQ('');
    setAppliedQ('');
    setMinPrice('');
    setMaxPrice('');
    setAppliedMin('');
    setAppliedMax('');
    setSort('');
  };

  const sortLabel = SORTS.find((s) => s.value === sort)?.label || 'Newest';
  const filtersActive = category !== 'All' || color || size || appliedQ || appliedMin || appliedMax;

  return (
    <Screen scroll={false}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Browse formal wear</Text>
        <TextInput
          style={styles.search}
          placeholder="Search gowns, suits, barongs..."
          placeholderTextColor={C.grayLight}
          value={q}
          onChangeText={setQ}
          returnKeyType="search"
        />
      </View>

      <ChipRow options={CATEGORIES} value={category} onChange={(next) => setCategory(next || 'All')} />
      <View style={{ marginTop: 8 }}>
        <ChipRow
          options={SORTS.map((s) => s.label)}
          value={sortLabel}
          onChange={(label) => setSort(SORTS.find((s) => s.label === label)?.value || '')}
        />
      </View>

      <View style={styles.toolbar}>
        <Text style={styles.count}>
          {loading ? 'Searching...' : `${total} item${total === 1 ? '' : 's'}`}
        </Text>
        <Pressable
          onPress={() => setShowFilters((v) => !v)}
          style={({ pressed }) => [styles.filterBtn, pressed && { opacity: 0.75 }]}
        >
          <Ionicons name={showFilters ? 'close' : 'options-outline'} size={15} color={C.charcoal} />
          <Text style={styles.filterBtnText}>{showFilters ? 'Close' : 'Filters'}</Text>
          {filtersActive ? <View style={styles.dot} /> : null}
        </Pressable>
      </View>

      {showFilters && (
        <View style={styles.filterPanel}>
          <View style={styles.filterHeading}>
            <Text style={styles.filterTitle}>Refine</Text>
            <Pressable onPress={clearAll} hitSlop={8}>
              <Text style={styles.clearText}>Clear all</Text>
            </Pressable>
          </View>

          {colors.length > 0 && (
            <>
              <Text style={styles.filterLabel}>Colour</Text>
              <ChipRow options={colors} value={color} onChange={setColor} />
            </>
          )}

          <Text style={styles.filterLabel}>Size</Text>
          <ChipRow options={SIZES} value={size} onChange={setSize} />

          <Text style={styles.filterLabel}>Price</Text>
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
            <TextInput
              style={[styles.priceInput, { flex: 1 }]}
              placeholder="Min"
              placeholderTextColor={C.grayLight}
              keyboardType="numeric"
              value={minPrice}
              onChangeText={setMinPrice}
            />
            <Text style={{ color: C.grayLight }}>to</Text>
            <TextInput
              style={[styles.priceInput, { flex: 1 }]}
              placeholder="Max"
              placeholderTextColor={C.grayLight}
              keyboardType="numeric"
              value={maxPrice}
              onChangeText={setMaxPrice}
            />
          </View>
        </View>
      )}

      {error ? (
        <View style={{ marginTop: 12 }}>
          <ErrorBox message={error} />
        </View>
      ) : loading ? (
        <Loading />
      ) : items.length === 0 ? (
        <EmptyState
          title="No pieces match"
          message="Try different filters or search terms, or ask the AI stylist for a curated look."
          action={
            <Pressable onPress={clearAll} style={({ pressed }) => [styles.emptyBtn, pressed && { opacity: 0.8 }]}>
              <Text style={styles.emptyBtnText}>Clear filters</Text>
            </Pressable>
          }
        />
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={items}
          keyExtractor={(p) => String(p.product_id)}
          numColumns={2}
          columnWrapperStyle={{ gap: 12 }}
          contentContainerStyle={{ gap: 12, paddingBottom: 30, paddingTop: 4 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.gold} />}
          renderItem={({ item }) => (
            <View style={{ flex: 1 }}>
              <ProductCard
                product={item}
                onPress={() => navigation.navigate('Product', { id: item.product_id })}
              />
            </View>
          )}
          ListFooterComponent={
            page < pages ? (
              <Pressable
                onPress={() => load(page + 1, true)}
                disabled={loadingMore}
                style={({ pressed }) => [styles.moreBtn, (pressed || loadingMore) && { opacity: 0.7 }]}
              >
                <Text style={styles.moreText}>{loadingMore ? 'Loading...' : 'Load more pieces'}</Text>
              </Pressable>
            ) : (
              <Text style={styles.endText}>You have reached the end of the collection.</Text>
            )
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: 10 },
  pageTitle: { fontFamily: 'serif', fontSize: 26, fontWeight: '700', color: C.charcoal, marginBottom: 12 },
  search: {
    backgroundColor: C.white, borderRadius: 999, paddingHorizontal: 18, paddingVertical: 12,
    fontSize: 15, color: C.charcoal, borderWidth: 1, borderColor: 'rgba(31,31,31,0.12)',
  },
  toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, marginBottom: 6 },
  count: { color: C.gray, fontSize: 13 },
  filterBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.white, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  filterBtnText: { color: C.charcoal, fontSize: 12, fontWeight: '700' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.gold },
  filterPanel: { backgroundColor: C.white, borderRadius: 14, padding: 12, marginBottom: 6 },
  filterHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  filterTitle: { fontFamily: 'serif', fontSize: 16, fontWeight: '700', color: C.charcoal },
  clearText: { color: C.goldDark, fontSize: 12, fontWeight: '700' },
  filterLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', color: C.gray, marginTop: 10, marginBottom: 6 },
  priceInput: { backgroundColor: C.ivory, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, fontSize: 14, color: C.charcoal },
  emptyBtn: { backgroundColor: C.gold, borderRadius: 999, paddingHorizontal: 20, paddingVertical: 10, marginTop: 16 },
  emptyBtnText: { color: C.white, fontSize: 13, fontWeight: '700' },
  moreBtn: { alignItems: 'center', backgroundColor: C.white, borderRadius: 999, paddingVertical: 13, marginTop: 4 },
  moreText: { color: C.charcoal, fontSize: 13, fontWeight: '700' },
  endText: { color: C.grayLight, fontSize: 11, textAlign: 'center', marginTop: 8 },
});
