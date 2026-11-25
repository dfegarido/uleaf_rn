import AppImage from '../../../components/AppImage/AppImage';

import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { launchImageLibrary } from 'react-native-image-picker';

import ScreenHeader from '../../../components/Admin/header';
import ZoomableImageModal from '../../../components/ZoomableImageModal/ZoomableImageModal';
import { updateListingApi } from '../../../components/Api/listingManagementApi';
import { uploadImageToBackend } from '../../../components/Api/uploadImageToBackend';

const firstImage = (listing) => {
  const pick = (v) => (typeof v === 'string' ? v : v?.url || v?.uri || null);
  const candidates = [
    listing?.imagePrimary,
    listing?.imagePrimaryWebp,
    ...(Array.isArray(listing?.images) ? listing.images : []),
    ...(Array.isArray(listing?.imageCollection) ? listing.imageCollection : []),
  ];
  return candidates.map(pick).find(Boolean) || null;
};

const asText = (value) => (value === undefined || value === null ? '' : String(value));

// Price conversion rules are keyed by these exact labels; any other height text fails to save.
const HEIGHT_OPTIONS = ['Below 12 inches', '12 inches & above'];

const parseNumber = (raw) => {
  const n = Number(String(raw).replace(/,/g, '').trim());
  return Number.isFinite(n) ? n : null;
};

const ListingsViewerEdit = ({ navigation, route }) => {
  const listing = route.params?.listing || {};
  const variations = Array.isArray(listing.variations) ? listing.variations : [];
  const isMulti =
    (listing.listingType === "Grower's Choice" || listing.listingType === 'Wholesale') &&
    variations.length > 0;
  const canEditPotPrices = !isMulti || variations.every((v) => v?.id);
  const symbol = listing.localCurrencySymbol || variations[0]?.localCurrencySymbol || '';

  const [genus, setGenus] = useState(asText(listing.genus));
  const [species, setSpecies] = useState(asText(listing.species));
  const [variegation, setVariegation] = useState(asText(listing.variegation));
  const [potSize, setPotSize] = useState(asText(listing.potSize || variations[0]?.potSize));
  const [localPrice, setLocalPrice] = useState(asText(listing.localPrice));
  const [quantity, setQuantity] = useState(asText(listing.quantity));
  const [height, setHeight] = useState(asText(listing.approximateHeight));
  const [potRows, setPotRows] = useState(() =>
    variations.map((v) => ({
      id: v.id || '',
      potSize: asText(v.potSize),
      localPrice: asText(v.localPrice),
      availableQty: asText(v.availableQty ?? v.quantity),
      approximateHeight: asText(v.approximateHeight),
      imagePrimary: v.imagePrimary || null,
    })),
  );
  const [photo, setPhoto] = useState(null);
  const [saving, setSaving] = useState(false);
  const [zoomVisible, setZoomVisible] = useState(false);

  const previewUri = photo?.uri || firstImage(listing);
  const plantCode = listing.plantCode || '';

  const title = useMemo(
    () => [genus, species].filter((part) => part && part.trim()).join(' ') || plantCode || 'Edit listing',
    [genus, species, plantCode],
  );

  const updatePot = (index, key, value) => {
    setPotRows((rows) => rows.map((row, i) => (i === index ? { ...row, [key]: value } : row)));
  };

  const choosePhoto = () => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.8, selectionLimit: 1 }, (response) => {
      if (response.didCancel) return;
      if (response.errorCode) {
        Alert.alert('Photo', 'Could not open that photo. Try another one.');
        return;
      }
      const asset = response.assets && response.assets[0];
      if (!asset?.uri) return;
      setPhoto({ uri: asset.uri });
    });
  };

  const save = async () => {
    const nextGenus = genus.trim();
    const nextSpecies = species.trim();
    const isDraft = String(listing.status || '').toLowerCase() === 'draft';
    if (!plantCode) {
      Alert.alert('Listing', 'This row has no plant code, so it cannot be saved.');
      return;
    }
    if (!isDraft && (!nextGenus || !nextSpecies)) {
      Alert.alert('Listing', 'Genus and species are both required.');
      return;
    }

    const heightsToCheck = isMulti ? (canEditPotPrices ? potRows.map((r) => r.approximateHeight) : []) : [height];
    if (heightsToCheck.some((h) => !HEIGHT_OPTIONS.includes(h))) {
      Alert.alert('Height', `Pick "${HEIGHT_OPTIONS[0]}" or "${HEIGHT_OPTIONS[1]}" for the approximate height.`);
      return;
    }

    let nextPrice = null;
    let nextQty = null;
    if (!isMulti) {
      nextPrice = parseNumber(localPrice);
      nextQty = parseNumber(quantity);
      if (nextPrice === null || nextPrice < 0) {
        Alert.alert('Price', 'Enter a price of 0 or more.');
        return;
      }
      if (nextQty === null || nextQty < 0) {
        Alert.alert('Quantity', 'Enter a quantity of 0 or more.');
        return;
      }
    }

    let nextPots = [];
    if (isMulti && canEditPotPrices) {
      for (const row of potRows) {
        const price = parseNumber(row.localPrice);
        const qty = parseNumber(row.availableQty);
        if (!row.id) {
          Alert.alert('Price', 'Reload Listings Viewer, then open this listing again to edit pot prices.');
          return;
        }
        if (price === null || price < 0) {
          Alert.alert('Price', `Enter a price for ${row.potSize || 'each pot size'}.`);
          return;
        }
        if (qty === null || qty < 0) {
          Alert.alert('Quantity', `Enter a quantity for ${row.potSize || 'each pot size'}.`);
          return;
        }
        nextPots.push({
          id: row.id,
          potSize: row.potSize.trim(),
          localPrice: price,
          availableQty: qty,
          approximateHeight: row.approximateHeight.trim(),
          imagePrimary: row.imagePrimary || undefined,
        });
      }
    }

    setSaving(true);
    try {
      let imagePrimary;
      let imageCollection;
      if (photo?.uri) {
        imagePrimary = await uploadImageToBackend(photo.uri);
        imageCollection = [imagePrimary];
      }

      const payload = {
        plantCode,
        listingType: listing.listingType,
        genus: nextGenus,
        species: nextSpecies,
        variegation: variegation.trim(),
        localCurrency: listing.localCurrency || undefined,
        localCurrencySymbol: listing.localCurrencySymbol || undefined,
        ...(imagePrimary ? { imagePrimary, imageCollection } : {}),
        ...(isMulti
          ? (nextPots.length ? { variation: nextPots } : {})
          : {
              potSize: potSize.trim(),
              localPrice: nextPrice,
              availableQty: nextQty,
              approximateHeight: height.trim(),
            }),
      };

      const result = await updateListingApi(payload);
      if (!result?.success) {
        Alert.alert('Could not save', result?.error || 'Try again.');
        return;
      }
      Alert.alert('Saved', `${plantCode} was updated.`, [
        {
          text: 'OK',
          onPress: () => navigation.navigate('ListingsViewer', { listingRefresh: Date.now() }),
        },
      ]);
    } catch (error) {
      Alert.alert('Could not save', error?.message || 'Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <ScreenHeader navigation={navigation} title="Edit listing" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.code}>{plantCode}</Text>
        <Text style={styles.title}>{title}</Text>
        {listing.listingType ? <Text style={styles.meta}>{listing.listingType}</Text> : null}

        <View style={styles.photoCard}>
          {previewUri ? (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => setZoomVisible(true)}
              accessibilityRole="imagebutton"
              accessibilityLabel="Open image to zoom"
            >
              <AppImage source={{ uri: previewUri }} style={styles.photo} resizeMode="cover" />
              <View style={styles.zoomBadge}>
                <Text style={styles.zoomBadgeText}>Tap to zoom</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <View style={[styles.photo, styles.photoEmpty]}>
              <Text style={styles.photoEmptyText}>No photo yet</Text>
            </View>
          )}
          <TouchableOpacity
            onPress={choosePhoto}
            disabled={saving}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Change picture"
          >
            <Text style={styles.photoAction}>{photo ? 'New photo selected · Change again' : 'Change picture'}</Text>
          </TouchableOpacity>
        </View>

        <Field label="Genus" value={genus} onChangeText={setGenus} editable={!saving} />
        <Field label="Species" value={species} onChangeText={setSpecies} editable={!saving} />
        <Field label="Variegation" value={variegation} onChangeText={setVariegation} editable={!saving} />

        {isMulti ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pot sizes</Text>
            {!canEditPotPrices ? (
              <Text style={styles.hint}>
                Reload Listings Viewer, then open this listing again to change pot prices.
              </Text>
            ) : null}
            {potRows.map((row, index) => (
              <View key={row.id || `pot-${index}`} style={styles.potCard}>
                <Field
                  label="Pot size"
                  value={row.potSize}
                  onChangeText={(value) => updatePot(index, 'potSize', value)}
                  editable={!saving && canEditPotPrices}
                />
                <Field
                  label={`Price${symbol ? ` (${symbol})` : ''}`}
                  value={row.localPrice}
                  onChangeText={(value) => updatePot(index, 'localPrice', value)}
                  keyboardType="decimal-pad"
                  editable={!saving && canEditPotPrices}
                />
                <Field
                  label="Quantity"
                  value={row.availableQty}
                  onChangeText={(value) => updatePot(index, 'availableQty', value)}
                  keyboardType="number-pad"
                  editable={!saving && canEditPotPrices}
                />
                <HeightPicker
                  value={row.approximateHeight}
                  onChange={(value) => updatePot(index, 'approximateHeight', value)}
                  disabled={saving || !canEditPotPrices}
                />
              </View>
            ))}
          </View>
        ) : (
          <>
            <Field label="Pot size" value={potSize} onChangeText={setPotSize} editable={!saving} />
            <Field
              label={`Local price${symbol ? ` (${symbol})` : ''}`}
              value={localPrice}
              onChangeText={setLocalPrice}
              keyboardType="decimal-pad"
              editable={!saving}
            />
            <Field
              label="Quantity"
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="number-pad"
              editable={!saving}
            />
            <HeightPicker value={height} onChange={setHeight} disabled={saving} />
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={save}
          disabled={saving}
          accessibilityRole="button"
          accessibilityLabel="Save listing"
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ZoomableImageModal uri={previewUri} visible={zoomVisible} onClose={() => setZoomVisible(false)} />
    </SafeAreaView>
  );
};

const Field = ({ label, value, onChangeText, editable, keyboardType }) => (
  <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChangeText}
      editable={editable}
      keyboardType={keyboardType || 'default'}
      autoCapitalize="words"
      autoCorrect={false}
      placeholderTextColor="#9AA3A6"
    />
  </View>
);

const HeightPicker = ({ value, onChange, disabled }) => {
  const unknown = value && !HEIGHT_OPTIONS.includes(value);
  return (
    <View style={styles.field}>
      <Text style={styles.label}>Approximate height</Text>
      <View style={styles.chipRow}>
        {HEIGHT_OPTIONS.map((option) => {
          const selected = value === option;
          return (
            <TouchableOpacity
              key={option}
              style={[styles.chip, selected && styles.chipSelected, disabled && styles.chipDisabled]}
              activeOpacity={0.7}
              onPress={() => onChange(option)}
              disabled={disabled}
              accessibilityRole="radio"
              accessibilityState={{ selected, disabled }}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{option}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {unknown ? <Text style={styles.hint}>Saved as "{value}". Pick one of the options above.</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F5F6F6' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 24 },
  code: { fontFamily: 'Inter', fontWeight: '700', fontSize: 13, color: '#539461' },
  title: { fontFamily: 'Inter', fontWeight: '700', fontSize: 22, color: '#202325', marginTop: 4 },
  meta: { fontFamily: 'Inter', fontSize: 14, color: '#647276', marginTop: 2, marginBottom: 12 },
  photoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E4E7E9',
    overflow: 'hidden',
    marginBottom: 16,
  },
  photo: { width: '100%', height: 240, backgroundColor: '#E8EEEA' },
  photoEmpty: { alignItems: 'center', justifyContent: 'center' },
  photoEmptyText: { fontFamily: 'Inter', color: '#647276', fontSize: 14 },
  zoomBadge: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  zoomBadgeText: { fontFamily: 'Inter', fontWeight: '600', fontSize: 12, color: '#FFFFFF' },
  photoAction: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 15,
    color: '#1F6FB5',
    textAlign: 'center',
    paddingVertical: 12,
  },
  field: { marginBottom: 12 },
  label: { fontFamily: 'Inter', fontWeight: '600', fontSize: 13, color: '#647276', marginBottom: 6 },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E7E9',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: 'Inter',
    fontSize: 16,
    color: '#202325',
  },
  section: { marginTop: 4 },
  sectionTitle: { fontFamily: 'Inter', fontWeight: '700', fontSize: 17, color: '#202325', marginBottom: 8 },
  hint: { fontFamily: 'Inter', fontSize: 13, color: '#8A6A3D', marginBottom: 8, marginTop: 6 },
  chipRow: { flexDirection: 'row', gap: 8 },
  chip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E4E7E9',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  chipSelected: { borderColor: '#539461', backgroundColor: '#E8F5EB' },
  chipDisabled: { opacity: 0.6 },
  chipText: { fontFamily: 'Inter', fontWeight: '600', fontSize: 14, color: '#393D40' },
  chipTextSelected: { color: '#23794A' },
  potCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E4E7E9',
    padding: 12,
    marginBottom: 12,
  },
  footer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E4E7E9',
  },
  saveButton: {
    backgroundColor: '#539461',
    borderRadius: 12,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: { opacity: 0.7 },
  saveButtonText: { fontFamily: 'Inter', fontWeight: '700', fontSize: 16, color: '#FFFFFF' },
});

export default ListingsViewerEdit;
