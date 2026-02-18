import React from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { globalStyles } from '../../../../assets/styles/styles';

const SCREEN_PADDING = 16;
const GAP = 6;
const NUM_COLUMNS = 3;
const cardWidth =
  (Dimensions.get('window').width - SCREEN_PADDING * 2 - (NUM_COLUMNS - 1) * GAP) /
  NUM_COLUMNS;

const LiveListingGrid = ({
  data = [],
  onNavigateToDetail,
  onPressSetToActive,
  onLoadMore,
  isLoadingMore = false,
  refreshing = false,
  onRefresh,
  prevActivePlantCodes = new Set(),
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
    const showSetActive = !isActive && inStock;
    const displayIndex = index + 1;

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        style={[styles.card, { borderColor: cardBorderColor, backgroundColor: cardBgColor }]}
        onPress={() => onNavigateToDetail(listing.plantCode, listing.id)}>
        <View style={styles.imageWrap}>
          <Image
            style={styles.image}
            source={{
              uri:
                listing.imagePrimary ||
                listing.image ||
                'https://via.placeholder.com/80x80.png?text=No+Image',
            }}
          />
          {isActive && (
            <View style={styles.activeOverlay}>
              <View style={styles.activeDot} />
              <Text style={styles.activeText}>Active</Text>
            </View>
          )}
          {isSold && (
            <View style={styles.soldOverlay}>
              <Text style={styles.soldText}>Sold</Text>
            </View>
          )}
        </View>
        <View style={styles.body}>
          <Text style={[globalStyles.textSMGreyLight, globalStyles.textBold, styles.index]}>
            {displayIndex}
          </Text>
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
        </View>
        {showSetActive && (
          <TouchableOpacity
            style={styles.setActiveButton}
            onPress={(e) => {
              e.stopPropagation();
              onPressSetToActive(listing.plantCode);
            }}>
            <Text style={styles.setActiveButtonText}>Set Active</Text>
          </TouchableOpacity>
        )}
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
    fontWeight: '600',
    color: '#000000',
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
  setActiveButton: {
    marginHorizontal: 8,
    marginBottom: 8,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#48A7F8',
    alignItems: 'center',
  },
  setActiveButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
});

export default LiveListingGrid;
