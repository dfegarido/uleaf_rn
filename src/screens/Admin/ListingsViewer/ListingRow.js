import AppImage from '../../../components/AppImage/AppImage';

import React, { useEffect, useState, useRef, memo } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Modal, Pressable } from 'react-native';
import { ActivityIndicator } from 'react-native';
import { IMAGE_CELL_WIDTH, IMAGE_CONTENT_GAP, COLUMN_INNER_PADDING } from './constants';
import CountryFlagIcon from '../../../components/CountryFlagIcon';
import ReservedForBadge from '../../../components/ReservedForBadge';
import EyeClosedIcon from '../../../assets/icons/greydark/eye-closed-regular.svg';
import EyeIcon from '../../../assets/icons/greydark/eye-regular.svg';
import TrashIcon from '../../../assets/icons/red/trash.svg';
import DotsVerticalIcon from '../../../assets/icons/greydark/dots-three-vertical-regular.svg';
import EditIcon from '../../../assets/admin-icons/edit.svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const MenuAction = ({ icon, tint, title, titleStyle, subtitle, onPress }) => (
  <TouchableOpacity
    style={styles.menuItem}
    activeOpacity={0.6}
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={title}
  >
    <View style={[styles.menuIconTile, { backgroundColor: tint }]}>{icon}</View>
    <View style={styles.menuItemBody}>
      <Text style={[styles.menuItemText, titleStyle]}>{title}</Text>
      <Text style={styles.menuItemSub} numberOfLines={1}>{subtitle}</Text>
    </View>
  </TouchableOpacity>
);

export const getStatusColor = (status) => {
  switch ((status || '').toLowerCase()) {
    case 'active': return '#27ae60'; // green
    case 'inactive': return '#e67e22'; // orange
    case 'draft': return '#95a5a6'; // gray
    case 'discounted': return '#8e44ad'; // purple
    case 'scheduled': return '#3498db'; // blue
    case 'expired': return '#e74c3c'; // red
    case 'out of stock':
    case 'out_of_stock': return '#7f8c8d'; // dark gray
    case 'sold': return '#E7522F'; // red-orange for sold
    default: return '#bdc3c7';
  }
};

export const formatDateListed = (value) => {
  if (!value) return null;

  let dateObj = null;

  if (value instanceof Date) {
    dateObj = value;
  } else if (typeof value?.toDate === 'function') {
    dateObj = value.toDate();
  } else if (typeof value === 'object' && value?._seconds) {
    dateObj = new Date(value._seconds * 1000);
  } else if (typeof value === 'number') {
    dateObj = new Date(value);
  } else if (typeof value === 'string') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) dateObj = parsed;
  }

  if (!dateObj || Number.isNaN(dateObj.getTime())) return null;

  return dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
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

// Resolve a short country code for flag rendering
export const resolveCountryCode = (country, localCurrency) => {
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

const renderCell = (key, listing, activeStatusFilter = null) => {
  // pick representative values, variations fallback to first variation
  const v0 = listing.variations && listing.variations.length ? listing.variations[0] : {};
  switch (key) {
      case 'code':
        // Determine display status: priority order is Sold > Discounted > actual status
        // However, if filtering by a specific status (like "Active"), respect that filter
        // Check if listing is sold (quantity = 0)
        const qty = listing.quantity ?? v0.availableQty ?? 0;
        const quantityValue = parseInt(qty) || 0;
        
        // For listings with variations, check if all variations are sold out
        let isSold = false;
        if (quantityValue === 0) {
          isSold = true;
        } else if (listing.listingType === "Grower's Choice" || listing.listingType === "Wholesale") {
          // Check if all variations are sold out
          if (listing.variations && listing.variations.length > 0) {
            isSold = listing.variations.every(v => {
              const vQty = parseInt(v.availableQty ?? v.quantity ?? 0) || 0;
              return vQty === 0;
            });
          }
        }
        
        // Check if we're filtering by a specific status
        const statusFilter = activeStatusFilter;
        const isFilteringByStatus = statusFilter && (
          (Array.isArray(statusFilter) && statusFilter.length > 0) ||
          (typeof statusFilter === 'string' && statusFilter.trim() !== '')
        );
        
        // Normalize status filter to check if it's "Active" or "Inactive"
        let isFilteringActive = false;
        let isFilteringInactive = false;
        if (isFilteringByStatus) {
          const filterArray = Array.isArray(statusFilter) ? statusFilter : [statusFilter];
          isFilteringActive = filterArray.some(f => 
            String(f).toLowerCase().trim() === 'active'
          );
          isFilteringInactive = filterArray.some(f => 
            String(f).toLowerCase().trim() === 'inactive'
          );
        }
        
        // If filtering by "Active" status, show "Active" badge regardless of discount/sold
        // If filtering by "Inactive" status, show "Inactive" badge only (no Sold/Discounted badges)
        // Otherwise, use priority: Sold > Discounted > actual status
        let displayStatus;
        if (isFilteringActive) {
          displayStatus = listing.status || 'Active';
        } else if (isFilteringInactive) {
          displayStatus = listing.status || 'Inactive';
        } else {
          displayStatus = isSold ? 'Sold' : (listing.hasDiscount ? 'Discounted' : (listing.status || ''));
        }
        
        const rawListedDate = listing.listingDate || listing.dateCreated || listing.createdAt;
        const listedDateText = formatDateListed(rawListedDate);

        return (
          <View>
            <Text style={styles.plantCode}>{listing.plantCode}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(displayStatus) }]}>
              <Text style={styles.statusText}>{String(displayStatus).replace(/_/g, ' ')}</Text>
            </View>
            {listedDateText ? (
              <Text style={styles.dateListedText}>Date Listed: {listedDateText}</Text>
            ) : null}
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
    case 'quantity': {
      const qty = listing.quantity ?? v0.availableQty ?? 0;
      const quantityValue = parseInt(qty) || 0;
      return (
        <Text style={[
          styles.quantityText,
          quantityValue === 0 && {color: '#E7522F', fontWeight: '600'}
        ]}>
          {quantityValue === 0 ? 'SOLD' : quantityValue}
        </Text>
      );
    }
    case 'localPrice':
      return <Text style={styles.priceText}>{(listing.localCurrencySymbol || v0.localCurrencySymbol || '') + (listing.localPrice ?? v0.localPrice ?? 0)}</Text>;
    case 'usdPrice':
      return <Text style={styles.priceText}>${listing.usdPrice ?? v0.usdPrice ?? 0}</Text>;
    case 'discount':
      return (listing.discountPercent || listing.discountPrice) ? <Text style={styles.discountText}>{listing.discountPercent ? `${listing.discountPercent}%` : `$${listing.discountPrice}`}</Text> : null;
    case 'garden': {
      // Top: garden/company name. Below: seller full name (first + last) or sellerName fallback.
  // Prefer normalized garden/company fields when available. Backend may
  // return `garden`, `gardenOrCompanyName`, or `sellerName` depending on
  // how supplier docs are populated; include `seller` (full name) as a
  // secondary fallback before showing the Unknown placeholder.
  const gardenName = listing.garden || listing.gardenOrCompanyName || listing.sellerName || listing.seller || 'Unknown Garden';
      const sellerFull = listing.seller || listing.sellerName || '';
      return (
        <View>
          <Text style={styles.gardenName}>{gardenName}</Text>
          {sellerFull ? <Text style={styles.sellerNameText}>{sellerFull}</Text> : null}
        </View>
      );
    }
    case 'country': {
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

const canActivateListing = (listing) => {
  const status = String(listing?.status || '').toLowerCase();
  return status === 'inactive' || status === 'expired';
};

const ListingRow = ({
  listing,
  onPress = () => {},
  onImagePress = null,
  onEdit = null,
  columns = [],
  onToggleStatus = () => {},
  onDelete = () => {},
  isProcessing = false,
  isDeleting = false,
  activeStatusFilter = null,
  selectMode = false,
  selected = false,
}) => {
  const [selectedUri, setSelectedUri] = useState(null);
  const [loadingImage, setLoadingImage] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);
  const insets = useSafeAreaInsets();
  const mountedRef = useRef(true);
  const canActivate = canActivateListing(listing);
  const menuPlantName =
    listing?.plantName || [listing?.genus, listing?.species].filter(Boolean).join(' ') || 'Listing';

  // iOS drops an Alert opened while a Modal is still closing, and Delete/Deactivate confirm with one.
  const runMenuAction = (action) => {
    setMenuVisible(false);
    if (action) setTimeout(() => action(listing), 350);
  };

  useEffect(() => {
    mountedRef.current = true;

    const candidates = [];
    const addIf = (u) => {
      if (u) {
        try {
          const s = String(u);
          if (s && !candidates.includes(s)) candidates.push(s);
        } catch (e) {
          // ignore
        }
      }
    };

    // Build candidate list in preferred order
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

        if (imageAvailabilityCache.get(url) === true) {
          if (mountedRef.current) setSelectedUri(url);
          return;
        }
        if (imageAvailabilityCache.get(url) === false) continue;

        try {
          const ok = await Image.prefetch(url);
          imageAvailabilityCache.set(url, !!ok);
          if (ok) {
            if (mountedRef.current) setSelectedUri(url);
            return;
          }
        } catch (e) {
          imageAvailabilityCache.set(url, false);
        }
      }

      if (mountedRef.current) setSelectedUri(null);
      if (mountedRef.current) setLoadingImage(false);
    };

    checkSequential();

    return () => { cancelled = true; mountedRef.current = false; };
  }, [listing]);

  return (
    <TouchableOpacity style={styles.listingRow} activeOpacity={0.8} onPress={() => onPress(listing)}>
      {selectMode ? (
        <View style={[styles.selectBox, selected && styles.selectBoxChecked]}>
          {selected ? <Text style={styles.selectCheck}>✓</Text> : null}
        </View>
      ) : null}
      {/* Image cell (fixed width matching design) */}
      <TouchableOpacity
        style={styles.plantImage}
        activeOpacity={0.8}
        onPress={() =>
          selectMode || !onImagePress ? onPress(listing) : onImagePress(listing, selectedUri)
        }
      >
        {selectedUri ? (
          <AppImage source={{ uri: selectedUri }} style={styles.plantImageActual} />
        ) : loadingImage ? (
          <View style={styles.skeletonImagePlaceholder} />
        ) : (
          <View style={styles.imagePlaceholder}><Text style={styles.imagePlaceholderText}>No Img</Text></View>
        )}
        <ReservedForBadge listing={listing} />
      </TouchableOpacity>

      {/* Render each configured column in order */}
      <View style={styles.contentContainer}>
        {columns && columns.length > 0 ? (
          columns.map((col) => (
            <View key={col.key} style={[styles.columnCell, { width: col.width || 120 }]}>
              {col.key === 'action' ? (
                  <TouchableOpacity
                    style={[styles.menuButton, (isProcessing || isDeleting) && styles.actionButtonDisabled]}
                    activeOpacity={0.7}
                    onPress={() => !isProcessing && !isDeleting && setMenuVisible(true)}
                    disabled={!!isProcessing || !!isDeleting}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityRole="button"
                    accessibilityLabel="Listing actions"
                  >
                    {isProcessing || isDeleting ? (
                      <ActivityIndicator size="small" color={isDeleting ? '#C8342A' : '#393D40'} />
                    ) : (
                      <DotsVerticalIcon width={20} height={20} />
                    )}
                  </TouchableOpacity>
                ) : (
                  renderCell(col.key, listing, activeStatusFilter)
                )}
            </View>
          ))
        ) : (
          /* fallback small set */
          <>
            <View style={[styles.columnCell, { width: 160 }]}>{renderCell('code', listing, activeStatusFilter)}</View>
            <View style={[styles.columnCell, { width: 320 }]}>{renderCell('name', listing, activeStatusFilter)}</View>
            <View style={[styles.columnCell, { width: 160 }]}>{renderCell('listingType', listing, activeStatusFilter)}</View>
          </>
        )}
      </View>

      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable style={styles.menuBackdrop} onPress={() => setMenuVisible(false)}>
          <Pressable style={[styles.menuSheet, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
            <View style={styles.menuHandle} />

            <View style={styles.menuHeader}>
              <View style={styles.menuThumb}>
                {selectedUri ? (
                  <AppImage source={{ uri: selectedUri }} style={styles.menuThumbImage} resizeMode="cover" />
                ) : (
                  <Text style={styles.menuThumbEmpty}>🌿</Text>
                )}
              </View>
              <View style={styles.menuHeaderText}>
                <Text style={styles.menuTitle} numberOfLines={1}>{menuPlantName}</Text>
                <View style={styles.menuMetaRow}>
                  <Text style={styles.menuCode} numberOfLines={1}>{listing?.plantCode || '—'}</Text>
                  {listing?.status ? (
                    <View style={styles.menuStatus}>
                      <View style={[styles.menuStatusDot, { backgroundColor: getStatusColor(listing.status) }]} />
                      <Text style={styles.menuStatusText}>{listing.status}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </View>

            <View style={styles.menuGroup}>
              <MenuAction
                icon={canActivate ? <EyeIcon width={20} height={20} /> : <EyeClosedIcon width={20} height={20} />}
                tint={canActivate ? '#E6F4EB' : '#F2F3F3'}
                title={canActivate ? 'Activate listing' : 'Deactivate listing'}
                subtitle={canActivate ? 'Show this plant to buyers again' : 'Hide this plant from buyers'}
                onPress={() => runMenuAction(onToggleStatus)}
              />
              <View style={styles.menuDivider} />
              <MenuAction
                icon={<EditIcon width={20} height={20} />}
                tint="#E8F2FC"
                title="Edit listing"
                subtitle="Picture, price, genus and more"
                onPress={() => runMenuAction(onEdit)}
              />
            </View>

            <View style={styles.menuGroup}>
              <MenuAction
                icon={<TrashIcon width={20} height={20} />}
                tint="#FDECEA"
                title="Delete listing"
                titleStyle={styles.menuDangerText}
                subtitle="Permanently remove this plant"
                onPress={() => runMenuAction(onDelete)}
              />
            </View>

            <TouchableOpacity
              style={styles.menuCancel}
              activeOpacity={0.7}
              onPress={() => setMenuVisible(false)}
              accessibilityRole="button"
            >
              <Text style={styles.menuCancelText}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
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
  dateListedText: { color: '#647276', fontSize: 12, marginTop: 6 },
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
  menuButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E4E7E9',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonDisabled: { opacity: 0.5 },
  menuBackdrop: { flex: 1, backgroundColor: 'rgba(16,20,22,0.45)', justifyContent: 'flex-end' },
  menuSheet: {
    backgroundColor: '#F5F6F6',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 16,
  },
  menuHandle: {
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#CDD3D4',
    marginBottom: 4,
  },
  menuHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 4, paddingVertical: 4 },
  menuThumb: {
    width: 52,
    height: 52,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#E8EEEA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuThumbImage: { width: '100%', height: '100%' },
  menuThumbEmpty: { fontSize: 22 },
  menuHeaderText: { flex: 1, gap: 4 },
  menuTitle: { fontSize: 17, fontWeight: '700', color: '#202325' },
  menuMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  menuCode: { fontSize: 13, fontWeight: '600', color: '#539461' },
  menuStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E7E9',
  },
  menuStatusDot: { width: 6, height: 6, borderRadius: 3 },
  menuStatusText: { fontSize: 12, fontWeight: '600', color: '#393D40', textTransform: 'capitalize' },
  menuGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E4E7E9',
    overflow: 'hidden',
  },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 14, paddingVertical: 12 },
  menuIconTile: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  menuItemBody: { flex: 1, gap: 2 },
  menuItemText: { fontSize: 16, fontWeight: '600', color: '#202325' },
  menuItemSub: { fontSize: 13, color: '#647276' },
  menuDangerText: { color: '#C8342A' },
  menuDivider: { height: 1, backgroundColor: '#F0F2F2', marginLeft: 68 },
  menuCancel: {
    paddingVertical: 15,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E7E9',
    alignItems: 'center',
  },
  menuCancelText: { fontSize: 16, fontWeight: '700', color: '#202325' },
  selectBox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#9DA5A7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 4,
  },
  selectBoxChecked: {
    backgroundColor: '#48A7F8',
    borderColor: '#48A7F8',
  },
  selectCheck: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 14,
  },
});

// Rows are rendered 50-per-page; memoizing keeps parent state changes (filter
// toggles, selection, image load) from re-rendering every mounted row.
export default memo(ListingRow);
