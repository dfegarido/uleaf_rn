import React, { useCallback, useEffect, useImperativeHandle, useRef, useState, forwardRef } from 'react';
import {
  Animated,
  BackHandler,
  Easing,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CloseIcon from '../../../assets/live-icon/close-x.svg';
import AppImage from '../../../components/AppImage/AppImage';
import { getCartItemsApi, removeFromCartApi } from '../../../components/Api/cartApi';

const parseQty = (raw) => Math.max(0, parseInt(raw, 10) || 0);

// Same availability and price rules as ScreenCart's transform, and the fields the checkout
// controller reads (plantCode, listingDetails, quantity, price, listingType, potSize, ...).
// ponytail: duplicates the core of ScreenCart's mapping; extract a shared mapper if they drift.
const toCartItem = (item) => {
  const d = item.listingDetails || {};
  const isGone = d.title === 'Listing no longer available';
  const isExpired = Boolean(d.isExpired);
  const availableQty = parseQty(d.availableQty);
  let price = 0;
  let originalPrice = null;
  if (d.originalPrice && d.price) {
    originalPrice = parseFloat(d.originalPrice);
    price = parseFloat(d.price);
  } else if (d.discountPrice) {
    price = parseFloat(d.discountPrice);
    originalPrice = parseFloat(d.price);
  } else if (d.price) {
    price = parseFloat(d.price);
  }
  if (!price && item.price) price = parseFloat(item.price);
  const potSize = item.selectedVariation?.potSize || item.potSize;
  return {
    id: item.cartId || item.id,
    cartItemId: item.cartId,
    plantCode: item.plantCode,
    image: d.image || null,
    name: `${d.genus || ''} ${d.species || ''}`.trim() || d.title || item.plantCode,
    subtitle: [d.variegation, potSize].filter(Boolean).join(' • '),
    price,
    originalPrice,
    quantity: item.quantity || 1,
    availableQuantity: availableQty,
    isUnavailable: isGone || isExpired || availableQty === 0,
    isExpired,
    listingType: d.listingType || 'Single Plant',
    plantSourceCountry: d.country || 'TH',
    potSize,
    listingDetails: d,
  };
};

const SkeletonRows = ({ count }) => {
  const pulse = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0.4, duration: 600, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  return (
    <Animated.View style={{ opacity: pulse }} accessibilityLabel="Loading cart">
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={styles.row}>
          <View style={[styles.thumb, styles.skeleton]} />
          <View style={styles.rowText}>
            <View style={[styles.skeleton, styles.skeletonLine]} />
            <View style={[styles.skeleton, styles.skeletonLineShort]} />
          </View>
        </View>
      ))}
    </Animated.View>
  );
};

/**
 * The buyer's cart as a sheet over the live, so opening it never leaves the stream.
 * Checkout hands the available items to `onCheckout`, which opens the live checkout sheet.
 * Loads once on mount so `onCountChange` can drive the Cart icon badge before it is opened.
 * The cart is kept between opens; call `ref.current.refresh()` after an Add to Cart, or pull
 * down to refresh.
 *
 * Drawn as an overlay inside the screen, not a <Modal>: iOS presents one Modal at a time, and the
 * full-screen Loading Modal shown by Add to Cart re-presented this sheet after it was closed, while
 * its Checkout could not present the checkout Modal on top. Render it last in the screen.
 */
const LiveCartSheet = forwardRef(({ isVisible, onClose, onCheckout, onCountChange }, ref) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [removingId, setRemovingId] = useState(null);
  const loadedRef = useRef(false);
  // Edge-to-edge Android draws the system nav bar over the bottom of the screen.
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 12) + 12;
  const [mounted, setMounted] = useState(isVisible);
  const slide = useRef(new Animated.Value(isVisible ? 0 : 1)).current;

  // Slide up on open; slide down, then unmount, on close.
  useEffect(() => {
    if (isVisible) setMounted(true);
    Animated.timing(slide, {
      toValue: isVisible ? 0 : 1,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && !isVisible) setMounted(false);
    });
  }, [isVisible, slide]);

  // Android back closes the sheet instead of leaving the live.
  useEffect(() => {
    if (!isVisible) return undefined;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [isVisible, onClose]);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await getCartItemsApi({ limit: 50, offset: 0 });
    setLoading(false);
    setRefreshing(false);
    if (!res?.success) {
      setError(true);
      return;
    }
    setError(false);
    loadedRef.current = true;
    setItems((res.data?.items || []).map(toCartItem));
  }, []);

  // Reloads right away so the badge count stays current, whether or not the sheet is open.
  useImperativeHandle(ref, () => ({ refresh: load }), [load]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (loadedRef.current) onCountChange?.(items.length);
  }, [items, onCountChange]);

  const remove = async (item) => {
    setRemovingId(item.id);
    const res = await removeFromCartApi({ cartItemId: item.cartItemId });
    setRemovingId(null);
    if (res?.success === false) return;
    setItems(prev => prev.filter(i => i.id !== item.id));
  };

  const available = items.filter(i => !i.isUnavailable);
  const total = available.reduce((sum, i) => sum + (i.price || 0) * (i.quantity || 1), 0);

  const renderItem = ({ item }) => (
    <View style={[styles.row, item.isUnavailable && styles.rowUnavailable]}>
      {item.image
        ? <AppImage source={{ uri: item.image }} style={styles.thumb} resizeWidth={200} />
        : <View style={[styles.thumb, styles.skeleton]} />}
      <View style={styles.rowText}>
        <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
        {item.subtitle ? <Text style={styles.sub} numberOfLines={1}>{item.subtitle}</Text> : null}
        <Text style={styles.sub}>
          {item.isUnavailable ? 'No longer available' : `Qty ${item.quantity}`}
        </Text>
      </View>
      <View style={styles.rowEnd}>
        <Text style={styles.price}>${item.price}</Text>
        <TouchableOpacity
          onPress={() => remove(item)}
          disabled={removingId === item.id}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${item.name}`}>
          <Text style={styles.remove}>{removingId === item.id ? 'Removing…' : 'Remove'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const empty = loading ? <SkeletonRows count={4} /> : error ? (
    <View style={styles.center}>
      <Text style={styles.emptyText}>Couldn't load your cart right now.</Text>
      <TouchableOpacity style={styles.retry} onPress={load} accessibilityRole="button">
        <Text style={styles.retryText}>Try again</Text>
      </TouchableOpacity>
    </View>
  ) : (
    <Text style={[styles.emptyText, styles.center]}>Your cart is empty</Text>
  );

  if (!mounted) return null;

  const translateY = slide.interpolate({ inputRange: [0, 1], outputRange: [0, 700] });
  const backdropOpacity = slide.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });

  return (
    <View style={styles.overlay} pointerEvents={isVisible ? 'auto' : 'none'}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.dim, { opacity: backdropOpacity }]} />
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} accessibilityLabel="Close cart" />
      <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
          <View style={styles.header}>
            <Text style={styles.title}>Cart</Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Close cart">
              <CloseIcon width={24} height={24} color="#000" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={loading && !refreshing ? [] : items}
            keyExtractor={item => String(item.id)}
            renderItem={renderItem}
            ListEmptyComponent={empty}
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            contentContainerStyle={[styles.listContent, !(available.length > 0 && !loading) && { paddingBottom: bottomPad }]}
          />
          {available.length > 0 && !loading ? (
            <View style={[styles.footer, { paddingBottom: bottomPad }]}>
              <View>
                <Text style={styles.totalLabel}>Total ({available.length})</Text>
                <Text style={styles.total}>${total.toFixed(2).replace(/\.00$/, '')}</Text>
              </View>
              <TouchableOpacity
                style={styles.checkout}
                onPress={() => onCheckout(available, total)}
                accessibilityRole="button">
                <Text style={styles.checkoutText}>Checkout</Text>
              </TouchableOpacity>
            </View>
          ) : null}
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFill, zIndex: 50, elevation: 50, justifyContent: 'flex-end' },
  dim: { backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  backdrop: { flex: 1 },
  sheet: {
    height: '70%',
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  title: { fontSize: 20, fontWeight: 'bold', fontFamily: 'Inter-Bold', color: '#000' },
  closeButton: { width: 44, height: 44, alignItems: 'flex-end', justifyContent: 'center' },
  listContent: { paddingBottom: 16, flexGrow: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  rowUnavailable: { opacity: 0.45 },
  thumb: { width: 56, height: 56, borderRadius: 10, backgroundColor: '#F0F0F0' },
  rowText: { flex: 1 },
  name: { fontFamily: 'Inter', fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
  sub: { fontFamily: 'Inter', fontSize: 12, color: '#6B6B6B', marginTop: 2 },
  rowEnd: { alignItems: 'flex-end', gap: 8 },
  price: { fontFamily: 'Inter', fontSize: 16, fontWeight: '800', color: '#1A1A1A' },
  remove: { fontFamily: 'Inter', fontSize: 12, fontWeight: '600', color: '#C23B1E' },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E0E0E0',
    paddingTop: 12,
  },
  totalLabel: { fontFamily: 'Inter', fontSize: 12, color: '#6B6B6B' },
  total: { fontFamily: 'Inter', fontSize: 20, fontWeight: '800', color: '#1A1A1A' },
  checkout: { backgroundColor: '#2E6B3E', borderRadius: 22, paddingHorizontal: 28, paddingVertical: 12 },
  checkoutText: { color: '#FFFFFF', fontFamily: 'Inter', fontWeight: '700', fontSize: 15 },
  center: { alignItems: 'center', textAlign: 'center', marginTop: 32 },
  emptyText: { color: '#6B6B6B', fontFamily: 'Inter' },
  retry: {
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#539461',
  },
  retryText: { color: '#539461', fontFamily: 'Inter', fontWeight: '600' },
  skeleton: { backgroundColor: '#E6E6E6' },
  skeletonLine: { height: 14, width: '60%', borderRadius: 7 },
  skeletonLineShort: { height: 12, width: '35%', borderRadius: 6, marginTop: 6 },
});

export default LiveCartSheet;
