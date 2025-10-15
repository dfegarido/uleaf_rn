import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { IMAGE_CELL_WIDTH, IMAGE_CONTENT_GAP, COLUMN_INNER_PADDING } from './constants';
import CountryFlagIcon from '../../../components/CountryFlagIcon';

const getStatusColor = (status) => {
  switch ((status || '').toLowerCase()) {
    case 'active': return '#23C16B';
    case 'reserved': return '#48A7F8';
    case 'unicorn': return '#6B4EFF';
    case 'pending': return '#FFB323';
    case 'unavailable': return '#E7522F';
    default: return '#23C16B';
  }
};

// Helper to resolve a primary image from multiple possible legacy fields and
// from the images array. Preference order:
// 1) images array WebP thumb -> large -> original
// 2) imagePrimary if it's WebP or any explicit imagePrimary fields
// 3) other images (jpg) from images array
// 4) variation images
// This ensures frontends use optimized WebP thumbnails when available.
const getPrimaryImage = (listing) => {
  if (!listing) return null;

  const asString = (v) => {
    if (!v && v !== 0) return null;
    if (Array.isArray(v) && v.length > 0) return asString(v[0]);
    if (typeof v === 'object') return v?.url || v?.uri || v?.path || null;
    if (typeof v === 'string') return v;
    return null;
  };

  // Normalize images array into deduped list of strings
  const imageList = Array.isArray(listing.images) ? listing.images.map(asString).filter(Boolean) : [];
  if (Array.isArray(listing.imageCollection)) {
    listing.imageCollection.map(asString).filter(Boolean).forEach(u => { if (!imageList.includes(u)) imageList.push(u); });
  }

  // Helper to pick by preference substrings
  const findBySubstr = (subs) => {
    for (const s of subs) {
      const found = imageList.find(u => u && u.toLowerCase().includes(s));
      if (found) return found;
    }
    return null;
  };

  // 1) prefer WebP thumb/large/original in images array
  const webpPreferred = findBySubstr(['_thumb.webp', '_large.webp', '_original.webp', '.webp']);
  if (webpPreferred) return webpPreferred;

  // 2) if imagePrimary exists and is webp, return it; otherwise remember it
  const explicitPrimary = asString(listing.imagePrimary) || asString(listing.imagePrimaryUrl) || asString(listing.imagePrimaryWebp);
  if (explicitPrimary && explicitPrimary.toLowerCase().includes('.webp')) return explicitPrimary;

  // 3) fall back to any images array entries (jpg or others)
  if (imageList.length > 0) return imageList[0];

  // 4) variation images: prefer first variation's webp then jpg
  if (Array.isArray(listing.variations) && listing.variations.length > 0) {
    const v = listing.variations[0] || {};
    const vImgs = [];
    if (v.imagePrimary) vImgs.push(asString(v.imagePrimary));
    if (v.image) vImgs.push(asString(v.image));
    if (Array.isArray(v.imageCollection)) v.imageCollection.map(asString).filter(Boolean).forEach(u => vImgs.push(u));
    const vWebp = vImgs.find(u => u && u.toLowerCase().includes('.webp'));
    if (vWebp) return vWebp;
    if (vImgs.length) return vImgs[0];
  }

  // 5) explicit non-webp primary
  if (explicitPrimary) return explicitPrimary;

  // 6) last resorts
  const otherCandidates = [listing.image, listing.imagePrimaryOriginal, listing.imagePrimaryWebpUrl, listing.countryFlag];
  for (const c of otherCandidates) {
    const s = asString(c);
    if (s) return s;
  }

  return null;
};

const renderCell = (key, listing) => {
  // pick representative values, variations fallback to first variation
  const v0 = listing.variations && listing.variations.length ? listing.variations[0] : {};
  switch (key) {
    case 'code':
      return (
        <View>
          <Text style={styles.plantCode}>{listing.plantCode}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(listing.status) }]}>
            <Text style={styles.statusText}>{listing.status}</Text>
          </View>
        </View>
      );
    case 'name':
      return (
        <View>
          <Text style={styles.plantName}>{listing.plantName}</Text>
          {listing.variegation ? <Text style={styles.plantVariegation}>{listing.variegation}</Text> : null}
        </View>
      );
    case 'listingType':
      return <Text style={styles.listingTypeText}>{listing.listingType}</Text>;
    case 'size':
      return <Text style={styles.infoText}>{listing.potSize || v0.potSize || 'N/A'}</Text>;
    case 'quantity':
      return <Text style={styles.quantityText}>{listing.quantity ?? v0.availableQty ?? 0}</Text>;
    case 'localPrice':
      return <Text style={styles.priceText}>{(listing.localCurrencySymbol || v0.localCurrencySymbol || '') + (listing.localPrice ?? v0.localPrice ?? 0)}</Text>;
    case 'usdPrice':
      return <Text style={styles.priceText}>${listing.usdPrice ?? v0.usdPrice ?? 0}</Text>;
    case 'discount':
      return (listing.discountPercent || listing.discountPrice) ? <Text style={styles.discountText}>{listing.discountPercent ? `${listing.discountPercent}%` : `$${listing.discountPrice}`}</Text> : null;
    case 'garden': {
      // Top: garden/company name. Below: seller full name (first + last) or sellerName fallback.
      const gardenName = listing.garden || listing.sellerName || 'Unknown Garden';
      const sellerFull = listing.seller || listing.sellerName || '';
      return (
        <View>
          <Text style={styles.gardenName}>{gardenName}</Text>
          {sellerFull ? <Text style={styles.sellerNameText}>{sellerFull}</Text> : null}
        </View>
      );
    }
    case 'country': {
      // Resolve a short country code for flag rendering
      const resolveCountryCode = (country, localCurrency) => {
        const c = (country || '').toString().trim();
        const lc = (localCurrency || '').toString().trim().toUpperCase();

        if (c) {
          const lower = c.toLowerCase();
          if (lower.includes('philipp') || lower === 'ph' || lower === 'phillipines') return 'PH';
          if (lower.includes('thailand') || lower === 'th') return 'TH';
          if (lower.includes('indonesia') || lower === 'id') return 'ID';
          if (lower.includes('united states') || lower === 'us' || lower === 'usa') return 'US';
        }

        // Fallback to currency mapping
        if (lc) {
          if (lc.includes('PHP') || lc.includes('₱')) return 'PH';
          if (lc.includes('THB') || lc.includes('฿')) return 'TH';
          if (lc.includes('IDR') || lc.includes('RP')) return 'ID';
          if (lc.includes('USD') || lc.includes('$')) return 'US';
        }

        return null;
      };

      const code = resolveCountryCode(listing.country, listing.localCurrency || listing.localCurrencySymbol);
      return (
        <View style={styles.countryRow}>
          {code ? <CountryFlagIcon code={code} width={20} height={14} /> : null}
          <Text style={styles.countryText}>{listing.country || code || 'Unknown'}</Text>
        </View>
      );
    }
    case 'plantFlight':
      return <Text style={styles.infoText}>{listing.plantFlight}</Text>;
    case 'shippingIndex':
      return <Text style={styles.infoText}>{listing.shippingIndex}</Text>;
    case 'acclimationIndex':
      return <Text style={styles.infoText}>{listing.acclimationIndex}</Text>;
    default:
      return null;
  }
};

// lightweight in-memory cache for image availability checks
const imageAvailabilityCache = new Map(); // url -> boolean

const ListingRow = ({ listing, onPress = () => {}, columns = [] }) => {
  const [selectedUri, setSelectedUri] = useState(null);
  const [loadingImage, setLoadingImage] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    // Build candidate list in preferred order: explicit webp primary, explicit primary, images array
    const candidates = [];
    const addIf = (u) => { if (u) {
      try { const s = String(u); if (s && !candidates.includes(s)) candidates.push(s); } catch (e) {}
    }};

    addIf(listing?.imagePrimaryWebp);
    addIf(listing?.imagePrimary);
    if (Array.isArray(listing?.images)) listing.images.forEach(addIf);
    if (Array.isArray(listing?.imageCollection)) listing.imageCollection.forEach(addIf);

    // append other legacy fallbacks
    addIf(getPrimaryImage(listing));

    let cancelled = false;

    const checkSequential = async () => {
      for (const url of candidates) {
        if (cancelled) return;
        if (!url) continue;

        // If cached as available, pick it immediately
        if (imageAvailabilityCache.get(url) === true) {
          if (mountedRef.current) setSelectedUri(url);
          return;
        }
        if (imageAvailabilityCache.get(url) === false) {
          continue;
        }

        // Try prefetch to determine availability
        try {
          // Image.prefetch returns a Promise<boolean>
          const ok = await Image.prefetch(url);
          imageAvailabilityCache.set(url, !!ok);
          if (ok) {
            if (mountedRef.current) setSelectedUri(url);
            return;
          }
        } catch (e) {
          imageAvailabilityCache.set(url, false);
          // continue to next candidate
        }
      }

      // none successful
      if (mountedRef.current) setSelectedUri(null);
      // indicate loading finished even if no image found
      if (mountedRef.current) setLoadingImage(false);
    };

    checkSequential();

    return () => { cancelled = true; mountedRef.current = false; };
  }, [listing]);

  return (
    <TouchableOpacity style={styles.listingRow} activeOpacity={0.8} onPress={() => onPress(listing)}>
      {/* Image cell (fixed width matching design) */}
      <View style={styles.plantImage}>
        {selectedUri ? (
          <Image source={{ uri: selectedUri }} style={styles.plantImageActual} />
        ) : loadingImage ? (
          // Render a skeleton-style block while image check is in-flight
          <View style={styles.skeletonImagePlaceholder} />
        ) : (
          <View style={styles.imagePlaceholder}><Text style={styles.imagePlaceholderText}>No Img</Text></View>
        )}
      </View>

    {/* Render each configured column in order */}
    <View style={styles.contentContainer}>
      {columns && columns.length > 0 ? (
        columns.map((col) => (
          <View key={col.key} style={[styles.columnCell, { width: col.width || 120 }]}>
            {renderCell(col.key, listing)}
          </View>
        ))
      ) : (
        /* fallback small set */
        <>
          <View style={[styles.columnCell, { width: 160 }]}>{renderCell('code', listing)}</View>
          <View style={[styles.columnCell, { width: 320 }]}>{renderCell('name', listing)}</View>
          <View style={[styles.columnCell, { width: 160 }]}>{renderCell('listingType', listing)}</View>
        </>
      )}
    </View>
  </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  listingRow: { flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 15, borderBottomWidth: 1, borderBottomColor: '#eee', alignItems: 'flex-start', backgroundColor: '#FFF' },
  plantImage: { width: IMAGE_CELL_WIDTH, height: IMAGE_CELL_WIDTH, borderRadius: 12, backgroundColor: '#F5F6F6', overflow: 'hidden' },
  plantImageActual: { width: '100%', height: '100%' },
  imagePlaceholder: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  skeletonImagePlaceholder: { width: '100%', height: '100%', backgroundColor: '#eceff0' },
  imagePlaceholderText: { color: '#647276' },
  contentContainer: { flexDirection: 'row', marginLeft: IMAGE_CONTENT_GAP, alignItems: 'flex-start', gap: 12 },
  columnCell: { justifyContent: 'flex-start', alignItems: 'flex-start', gap: 6, paddingLeft: COLUMN_INNER_PADDING },
  plantCode: { fontWeight: '600', fontSize: 16, color: '#202325' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start', minHeight: 28, justifyContent: 'center' },
  statusText: { color: '#FFF', fontWeight: '600', textTransform: 'capitalize' },
  plantName: { color: '#202325', fontWeight: '600' },
  plantVariegation: { color: '#647276' },
  listingTypeText: { fontWeight: '600', color: '#FFFFFF', backgroundColor: '#202325', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start' },
  infoText: { color: '#647276',  },
  quantityText: { color: '#202325', fontWeight: '600' },
  priceText: { color: '#202325', fontWeight: '700' },
  discountText: { color: '#E7522F', fontWeight: '700' },
  gardenName: { color: '#202325', fontWeight: '600' },
  sellerNameText: { color: '#647276', fontSize: 12, marginTop: 4 },
  countryText: { color: '#556065', fontWeight: '600' },
  countryRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});

export default ListingRow;
