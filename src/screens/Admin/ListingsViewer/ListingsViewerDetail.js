import AppImage from '../../../components/AppImage/AppImage';

import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ScreenHeader from '../../../components/Admin/header';
import CountryFlagIcon from '../../../components/CountryFlagIcon/CountryFlagIcon';
import { formatDateListed, getStatusColor, resolveCountryCode } from './ListingRow';

const firstImage = (listing) => {
  const pick = (v) => (typeof v === 'string' ? v : v?.url || v?.uri || null);
  const candidates = [
    listing.imagePrimaryWebp,
    listing.imagePrimary,
    ...(Array.isArray(listing.images) ? listing.images : []),
    ...(Array.isArray(listing.imageCollection) ? listing.imageCollection : []),
  ];
  return candidates.map(pick).find(Boolean) || null;
};

const formatMoney = (symbol, value) =>
  value === undefined || value === null || value === '' ? '—' : `${symbol || ''}${value}`;

const StatusBadge = ({ label, color }) => (
  <View style={styles.statusBadge}>
    <View style={[styles.statusDot, { backgroundColor: color }]} />
    <Text style={styles.statusBadgeText}>{label}</Text>
  </View>
);

const SectionCard = ({ title, children }) => (
  <View style={styles.sectionCard}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

const InfoRow = ({ label, value, isLast }) => (
  <View style={[styles.infoRow, isLast && styles.infoRowLast]}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue} numberOfLines={2}>
      {value === undefined || value === null || value === '' ? '—' : String(value)}
    </Text>
  </View>
);

const ListingsViewerDetail = ({ navigation, route }) => {
  const listing = route.params?.listing || {};
  const imageUrl = route.params?.imageUrl || firstImage(listing);
  const variations = Array.isArray(listing.variations) ? listing.variations : [];
  const v0 = variations[0] || {};

  const quantity = parseInt(listing.quantity ?? v0.availableQty ?? 0, 10) || 0;
  const isMultiVariation =
    (listing.listingType === "Grower's Choice" || listing.listingType === 'Wholesale') &&
    variations.length > 0;
  const isSold = isMultiVariation
    ? variations.every((v) => !(parseInt(v.availableQty ?? v.quantity ?? 0, 10) > 0))
    : quantity === 0;
  const displayStatus = isSold ? 'Sold' : listing.hasDiscount ? 'Discounted' : listing.status || '—';

  const plantName =
    listing.plantName || [listing.genus, listing.species].filter(Boolean).join(' ') || 'Unknown plant';
  const currencySymbol = listing.localCurrencySymbol || v0.localCurrencySymbol || '';
  const countryCode = resolveCountryCode(listing.country, listing.localCurrency || currencySymbol);
  const garden = listing.garden || listing.gardenOrCompanyName || listing.sellerName || '—';
  const seller = listing.seller || listing.sellerName || '—';
  const discount = listing.discountPercent
    ? `${listing.discountPercent}%`
    : listing.discountPrice
      ? `$${listing.discountPrice}`
      : '—';

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <ScreenHeader navigation={navigation} title="Listing details" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          {imageUrl ? (
            <AppImage source={{ uri: imageUrl }} style={styles.heroImage} resizeMode="cover" />
          ) : (
            <View style={[styles.heroImage, styles.heroImagePlaceholder]}>
              <Text style={styles.heroPlaceholderEmoji}>🌿</Text>
              <Text style={styles.placeholderText}>No plant image</Text>
            </View>
          )}
          <View style={styles.heroBody}>
            <View style={styles.heroTopRow}>
              {countryCode ? <CountryFlagIcon code={countryCode} width={24} height={16} /> : null}
              <Text style={styles.plantCodePill}>{listing.plantCode}</Text>
              {listing.listingType ? (
                <View style={styles.listingBadge}>
                  <Text style={styles.listingBadgeText}>{listing.listingType}</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.plantName}>{plantName}</Text>
            {listing.variegation ? <Text style={styles.variegation}>{listing.variegation}</Text> : null}
          </View>
        </View>

        <View style={styles.summaryRow}>
          <StatusBadge label={`Status: ${displayStatus}`} color={getStatusColor(displayStatus)} />
          <StatusBadge
            label={isSold ? 'Qty: Sold out' : `Qty: ${quantity}`}
            color={isSold ? '#E7522F' : '#539461'}
          />
        </View>

        <SectionCard title="Pricing">
          <InfoRow label="Local price" value={formatMoney(currencySymbol, listing.localPrice ?? v0.localPrice)} />
          <InfoRow label="USD price" value={formatMoney('$', listing.usdPrice ?? v0.usdPrice)} />
          <InfoRow label="Discount" value={discount} isLast />
        </SectionCard>

        {isMultiVariation ? (
          <SectionCard title="Variations">
            {variations.map((v, i) => (
              <InfoRow
                key={`${v.potSize || 'v'}-${i}`}
                label={`${v.potSize || `Variation ${i + 1}`} · Qty ${v.availableQty ?? v.quantity ?? 0}`}
                value={`${formatMoney(v.localCurrencySymbol || currencySymbol, v.localPrice)} / ${formatMoney('$', v.usdPrice)}`}
                isLast={i === variations.length - 1}
              />
            ))}
          </SectionCard>
        ) : null}

        <SectionCard title="Seller">
          <InfoRow label="Garden" value={garden} />
          <InfoRow label="Seller" value={seller} />
          <InfoRow label="Country" value={listing.country || countryCode} isLast />
        </SectionCard>

        <SectionCard title="Plant details">
          <InfoRow label="Pot size" value={listing.potSize || v0.potSize} />
          <InfoRow label="Approx. height" value={listing.approximateHeight || v0.approximateHeight} />
          {listing.isMutation ? <InfoRow label="Mutation" value={listing.mutation || 'Yes'} /> : null}
          <InfoRow label="Plant flight" value={listing.plantFlight} />
          <InfoRow label="Shipping index" value={listing.shippingIndex} />
          <InfoRow label="Acclimation index" value={listing.acclimationIndex} isLast />
        </SectionCard>

        <SectionCard title="Dates">
          <InfoRow
            label="Date listed"
            value={formatDateListed(listing.listingDate || listing.dateCreated || listing.createdAt)}
          />
          <InfoRow label="Publish date" value={formatDateListed(listing.publishDate)} />
          <InfoRow label="Expiration" value={formatDateListed(listing.expirationDate)} />
          <InfoRow label="Last updated" value={formatDateListed(listing.updatedAt)} isLast />
        </SectionCard>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F5F6F6' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32, gap: 12 },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E4E7E9',
  },
  heroImage: { width: '100%', height: 320, backgroundColor: '#E8EEEA' },
  heroImagePlaceholder: { alignItems: 'center', justifyContent: 'center', gap: 8 },
  heroPlaceholderEmoji: { fontSize: 40 },
  heroBody: { padding: 16, gap: 4 },
  heroTopRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  plantCodePill: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 13,
    color: '#539461',
    backgroundColor: '#E8F5EB',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    overflow: 'hidden',
  },
  listingBadge: { backgroundColor: '#202325', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  listingBadgeText: { fontFamily: 'Inter', fontWeight: '600', fontSize: 11, color: '#FFFFFF' },
  plantName: { fontFamily: 'Inter', fontWeight: '700', fontSize: 22, color: '#202325', marginTop: 4 },
  variegation: { fontFamily: 'Inter', fontSize: 15, color: '#647276', fontStyle: 'italic' },
  placeholderText: { fontFamily: 'Inter', color: '#647276', fontSize: 14 },
  summaryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E4E7E9',
    backgroundColor: '#FFFFFF',
    flex: 1,
    minWidth: '45%',
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusBadgeText: { fontFamily: 'Inter', fontWeight: '600', fontSize: 13, color: '#202325', flexShrink: 1 },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E4E7E9',
  },
  sectionTitle: { fontFamily: 'Inter', fontWeight: '700', fontSize: 17, color: '#202325', marginBottom: 4 },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F2',
    gap: 12,
  },
  infoRowLast: { borderBottomWidth: 0, paddingBottom: 0 },
  infoLabel: { fontFamily: 'Inter', fontSize: 14, color: '#647276', flex: 1 },
  infoValue: { fontFamily: 'Inter', fontWeight: '600', fontSize: 14, color: '#202325', flex: 1.2, textAlign: 'right' },
});

export default ListingsViewerDetail;
