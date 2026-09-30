import AppImage from '../../../../components/AppImage/AppImage';

import React, { useEffect } from 'react';
import { ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { globalStyles } from '../../../../assets/styles/styles';
import Svg, { Path } from 'react-native-svg';

const PINK_PIN = '#FF4D8D';

export const PinkPin = ({filled}) => (
  <Svg width={18} height={18} viewBox="0 0 20 20" fill="none">
    <Path
      d="M19.0612 6.62822L13.3744 0.938535C12.7894 0.354473 11.8387 0.354473 11.2528 0.938535L6.22311 5.98229C5.22373 5.66916 2.9428 5.29041 0.562484 7.21135C-0.0834536 7.72791 -0.187516 8.67385 0.329046 9.31979C0.363734 9.36291 0.401234 9.4051 0.440609 9.44353L4.9678 13.9707L0.970296 17.9682C0.677796 18.2607 0.677796 18.736 0.970296 19.0285C1.11655 19.1748 1.30873 19.2479 1.50092 19.2479C1.69311 19.2479 1.88436 19.1748 2.03155 19.0285L6.02905 15.031L10.5581 19.5601C10.8497 19.8498 11.2322 19.9951 11.6147 19.9951C11.9972 19.9951 12.3872 19.847 12.6806 19.5517C12.7265 19.5057 12.7697 19.456 12.8109 19.4017C13.665 18.2654 14.8969 16.0885 14.0484 13.7776L19.0612 8.74885C19.6453 8.16385 19.6453 7.21322 19.0612 6.62822Z"
      fill={filled ? PINK_PIN : 'none'}
      stroke={PINK_PIN}
      strokeWidth={filled ? 0 : 1.4}
    />
  </Svg>
);

const formatCardPrice = listing => {
  const raw = listing?.localPrice ?? listing?.usdPrice;
  const amount = parseFloat(raw);
  if (!Number.isFinite(amount)) return '';
  const currency = String(listing?.localCurrency || '').toUpperCase();
  const symbol =
    listing?.localCurrencySymbol ||
    listing?.currencySymbol ||
    (currency === 'USD' ? '$' : '');
  const text = Number.isInteger(amount) ? String(amount) : amount.toFixed(2);
  return `${symbol}${text}`;
};

const ActiveBadge = () => {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.25, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, [opacity]);

  const blinkStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View style={[styles.activeOverlay, blinkStyle]}>
      <View style={styles.activeDot} />
      <Text style={styles.activeText}>Active</Text>
    </Animated.View>
  );
};

const SCREEN_PADDING = 16;
const GAP = 6;
const NUM_COLUMNS = 3;
const cardWidth =
  (Dimensions.get('window').width - SCREEN_PADDING * 2 - (NUM_COLUMNS - 1) * GAP) /
  NUM_COLUMNS;

const LiveListingGrid = ({
  data = [],
  onNavigateToDetail,
  onSetActive,
  onLoadMore,
  isLoadingMore = false,
  refreshing = false,
  onRefresh,
  prevActivePlantCodes = new Set(),
  isSelectMode = false,
  selectedIds = [],
  onToggleSelect,
}) => {
  const renderCard = ({ item: listing, index }) => {
    const isActive = listing?.isActiveLiveListing === true;
    const wasPreviouslyActive = prevActivePlantCodes.has(listing.plantCode);
    const qty = parseInt(listing.availableQty, 10) || 0;
    const variations = Array.isArray(listing.variations) ? listing.variations : [];
    const hasVariationQty =
      variations.length > 0 &&
      variations.some((v) => (parseInt(v.availableQty, 10) || 0) > 0);
    const inStock = qty > 0 || hasVariationQty;
    const isSold = !inStock;

    const cardBorderColor = isActive
      ? '#539461'
      : isSold
        ? '#FFE7E2'
        : wasPreviouslyActive
          ? '#E07B3B'
          : '#E4E7E9';
    const cardBgColor = isActive
      ? '#f2f7f3'
      : isSold
        ? '#FFF5F4'
        : wasPreviouslyActive
          ? '#FEF2EA'
          : '#fff';
    // The IG<n> label is stored on the listing and handed out once at creation
    // (see migration 037). It must NOT fall back to the row position: a listing
    // whose number is missing would then borrow the number of the slot it
    // happens to sit in, which is how two different plants both displayed
    // "IG5". A row with no stored number simply shows no label.
    const displayIndex =
      listing.liveIgIndex != null && String(listing.liveIgIndex).trim() !== ''
        ? `IG${listing.liveIgIndex}`
        : '';
    const hasImage = !!(listing.imagePrimary || listing.image);
    const priceLabel = formatCardPrice(listing);

    const isSelected = isSelectMode && selectedIds.includes(listing.id);

    const handleCardPress = () => {
      if (isSelectMode) {
        onToggleSelect?.(listing.id);
      } else {
        onNavigateToDetail(listing.plantCode, listing.id);
      }
    };

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        style={[styles.card, { borderColor: isSelected ? '#48A7F8' : cardBorderColor, backgroundColor: isSelected ? '#EBF5FF' : cardBgColor }]}
        onPress={handleCardPress}>
        <View style={styles.imageWrap}>
          {hasImage ? (
            <AppImage
              style={styles.image}
              source={{
                uri: listing.imagePrimary || listing.image,
              }}
            />
          ) : (
            <View style={styles.noImagePlaceholder}>
              <Text style={styles.noImageIndexText}>{displayIndex}</Text>
            </View>
          )}
          {hasImage && !!displayIndex && (
            <View style={styles.indexBadge}>
              <Text style={styles.indexBadgeText}>{displayIndex}</Text>
            </View>
          )}
          {isActive && <ActiveBadge />}
          {isSold && (
            <View style={styles.soldOverlay}>
              <Text style={styles.soldText}>Sold</Text>
            </View>
          )}
          {isSelectMode && (
            <View style={styles.selectCheckboxWrap}>
              <View style={[styles.selectCheckbox, isSelected && styles.selectCheckboxChecked]}>
                {isSelected && <Text style={styles.selectCheckmark}>✓</Text>}
              </View>
            </View>
          )}
          {!isSelectMode && (
            <TouchableOpacity
              style={[styles.pinButton, isActive && styles.pinButtonOn]}
              hitSlop={8}
              disabled={!inStock || isActive}
              onPress={e => {
                e.stopPropagation();
                if (!inStock || isActive) return;
                onSetActive?.(listing.plantCode);
              }}>
              <PinkPin filled />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.body}>
          <Text
            style={[globalStyles.textSMGreyDark, globalStyles.textBold, styles.genus]}
            numberOfLines={1}>
            {listing.genus || '—'}
          </Text>
          <Text
            style={[globalStyles.textSMGreyDark, styles.species]}
            numberOfLines={1}>
            {listing.species || '—'}
          </Text>
          {!!priceLabel && (
            <Text style={styles.price} numberOfLines={1}>
              {priceLabel}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <FlatList
      data={data}
      keyExtractor={(item) => item.id || item.plantCode || String(Math.random())}
      renderItem={renderCard}
      numColumns={NUM_COLUMNS}
      columnWrapperStyle={styles.row}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        ) : undefined
      }
      onEndReached={onLoadMore}
      onEndReachedThreshold={0.3}
      ListFooterComponent={
        isLoadingMore ? (
          <View style={styles.footer}>
            <ActivityIndicator size="small" />
          </View>
        ) : null
      }
    />
  );
};

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: SCREEN_PADDING,
    paddingBottom: 24,
  },
  footer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: GAP,
  },
  card: {
    width: cardWidth,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E4E7E9',
    overflow: 'hidden',
  },
  imageWrap: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#E4E7E9',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  noImagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E4E7E9',
  },
  noImageIndexText: {
    fontSize: 22,
    color: '#6B7280',
    fontWeight: '800',
    letterSpacing: 1,
  },
  indexBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  indexBadgeText: {
    fontSize: 22,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.9)',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
    letterSpacing: 1,
  },
  activeOverlay: {
    position: 'absolute',
    top: 6,
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(35, 193, 107, 0.95)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
  activeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  soldOverlay: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: '#FFE7E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  soldText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#000000',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  body: {
    padding: 8,
  },
  index: {
    fontSize: 12,
    marginBottom: 4,
  },
  genus: {
    marginBottom: 2,
  },
  species: {
    fontSize: 14,
  },
  price: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '700',
    color: '#202325',
  },
  pinButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFE7E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinButtonOn: {
    borderWidth: 1.5,
    borderColor: '#FF4D8D',
  },
  selectCheckboxWrap: {
    position: 'absolute',
    top: 6,
    left: 6,
    zIndex: 5,
  },
  selectCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectCheckboxChecked: {
    backgroundColor: '#48A7F8',
    borderColor: '#48A7F8',
  },
  selectCheckmark: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 15,
  },
});

export default LiveListingGrid;
