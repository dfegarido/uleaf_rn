import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Modal,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {launchImageLibrary} from 'react-native-image-picker';
import NetInfo from '@react-native-community/netinfo';
import {globalStyles} from '../../../assets/styles/styles';
import LeftIcon from '../../../assets/icons/greylight/caret-left-regular.svg';
import ExIcon from '../../../assets/icons/greylight/x-regular.svg';
import {
  getSellGenusApi,
  getSellSpeciesApi,
  getSellVariegationApi,
  postSellSinglePlantApi,
  uploadImageToBackend,
  uploadMultipleImagesToBackend,
} from '../../../components/Api';
import {getActiveLiveListingApi} from '../../../components/Api/agoraLiveApi';
import {InputDropdownSearch, InputBox} from '../../../components/Input';
import Toast from '../../../components/Toast/Toast';

const potSizes = ['2"', '4"', '6"'];
const heightOptions = [
  {label: 'Below 12"', value: 'below'},
  {label: '12" & above', value: 'above'},
];

function toOptionList(data) {
  if (!Array.isArray(data)) return [];
  return data.map((x) => (typeof x === 'string' ? x : (x?.name ?? x?.value ?? '')));
}

const createBlankRow = () => ({
  id: `row_${Date.now()}_${Math.random().toString(36).slice(2)}`,
  genus: '',
  species: '',
  variegation: '',
  potSize: '4"',
  localPrice: '',
  approximateHeight: 'below',
  image: null,
  speciesList: [],
  variegationList: [],
  loadingSpecies: false,
  loadingVariegation: false,
});

const ScreenBatchUpload = ({navigation}) => {
  const insets = useSafeAreaInsets();
  const [genusOptions, setGenusOptions] = useState([]);
  const [rows, setRows] = useState([createBlankRow()]);
  const [loadingGenus, setLoadingGenus] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({current: 0, total: 0});
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  const showToast = (message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  useEffect(() => {
    const load = async () => {
      try {
        const net = await NetInfo.fetch();
        if (!net.isConnected || !net.isInternetReachable) {
          setGenusOptions([]);
          return;
        }
        const res = await getSellGenusApi();
        if (res?.success && res?.data) {
          setGenusOptions(toOptionList(res.data));
        }
      } catch (e) {
        console.warn('BatchUpload load genus:', e?.message);
      } finally {
        setLoadingGenus(false);
      }
    };
    load();
  }, []);

  const updateRow = (rowId, updates) => {
    setRows((prev) =>
      prev.map((r) => (r.id === rowId ? {...r, ...updates} : r)),
    );
  };

  const loadSpeciesForRow = async (rowId, genus) => {
    updateRow(rowId, {
      species: '',
      variegation: '',
      speciesList: [],
      variegationList: [],
      loadingSpecies: true,
    });
    try {
      const res = await getSellSpeciesApi(genus);
      const list = res?.success && res?.data ? toOptionList(res.data) : [];
      updateRow(rowId, {speciesList: list, loadingSpecies: false});
    } catch (e) {
      updateRow(rowId, {speciesList: [], loadingSpecies: false});
    }
  };

  const loadVariegationForRow = async (rowId, genus, species) => {
    updateRow(rowId, {variegation: '', variegationList: [], loadingVariegation: true});
    try {
      const res = await getSellVariegationApi(genus, species);
      const list = res?.success && res?.data ? toOptionList(res.data) : [];
      updateRow(rowId, {variegationList: list, loadingVariegation: false});
    } catch (e) {
      updateRow(rowId, {variegationList: [], loadingVariegation: false});
    }
  };

  const handleGenusChange = (rowId, genus) => {
    updateRow(rowId, {genus});
    if (genus) loadSpeciesForRow(rowId, genus);
  };

  const handleSpeciesChange = (rowId, species) => {
    updateRow(rowId, {species});
    const row = rows.find((r) => r.id === rowId);
    if (row?.genus && species) loadVariegationForRow(rowId, row.genus, species);
  };

  const addRow = () => {
    setRows((prev) => [...prev, createBlankRow()]);
  };

  const removeRow = (rowId) => {
    if (rows.length <= 1) return;
    setRows((prev) => prev.filter((r) => r.id !== rowId));
  };

  const pickImageForRow = (rowId) => {
    launchImageLibrary(
      {mediaType: 'photo', selectionLimit: 1},
      (response) => {
        if (response.didCancel || response.errorCode || !response.assets?.length) return;
        const uri = response.assets[0].uri;
        updateRow(rowId, {image: uri});
      },
    );
  };

  const validateRow = (row) => {
    if (!row.genus?.trim()) return 'Genus is required';
    if (!row.species?.trim()) return 'Species is required';
    if (!row.potSize?.trim()) return 'Pot size is required';
    const price = parseFloat(row.localPrice);
    if (Number.isNaN(price) || price < 0) return 'Valid price is required';
    return null;
  };

  const onUploadAll = async () => {
    const validRows = rows.filter((r) => !validateRow(r));
    const invalid = rows.find((r) => validateRow(r));
    if (invalid) {
      const msg = validateRow(invalid);
      Alert.alert('Validation', msg);
      return;
    }

    setUploading(true);
    let withActiveLiveListing = false;
    try {
      const activeRes = await getActiveLiveListingApi();
      if (activeRes?.success) withActiveLiveListing = true;
    } catch (_) {}

    let successCount = 0;
    let failCount = 0;
    const total = rows.length;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      setUploadProgress({current: i + 1, total});

      try {
        let imagePrimary = null;
        let imageCollection = [];
        if (row.image) {
          const urls = await uploadMultipleImagesToBackend([row.image]);
          if (urls?.length) {
            imagePrimary = urls[0];
            imageCollection = urls;
          }
        }

        const variegation =
          row.variegation === 'Choose the most suitable variegation.' ? '' : (row.variegation || '');
        const data = {
          listingType: 'Single Plant',
          genus: row.genus || null,
          species: row.species || null,
          variegation,
          isMutation: false,
          mutation: null,
          imagePrimary,
          imageCollection,
          potSize: row.potSize,
          localPrice: parseFloat(row.localPrice),
          approximateHeight:
            row.approximateHeight === 'above' ? '12 inches & above' : 'Below 12 inches',
          status: 'Live',
          publishType: 'Publish Now',
          isActiveLiveListing: i === 0 && !withActiveLiveListing,
        };

        await postSellSinglePlantApi(data);
        successCount++;
      } catch (e) {
        console.warn('Batch upload row failed:', e?.message);
        failCount++;
      }
    }

    setUploading(false);
    setUploadProgress({current: 0, total: 0});
    if (failCount === 0) {
      showToast(`${successCount} listing(s) uploaded successfully.`);
      setRows([createBlankRow()]);
    } else {
      showToast(
        `${successCount} succeeded, ${failCount} failed.`,
        failCount === total ? 'error' : 'success',
      );
    }
  };

  return (
    <View style={[styles.root, {paddingTop: insets.top}]}>
      <View style={styles.header}>
        <TouchableOpacity
          hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
          onPress={() => navigation.goBack()}
          style={styles.backButton}>
          <LeftIcon width={30} height={30} />
        </TouchableOpacity>
        <Text style={[globalStyles.textMDGreyDark, globalStyles.textBold]}>
          Batch Upload
        </Text>
        <View style={styles.headerRight}>
          <Text style={globalStyles.textSMGreyDark}>{rows.length} listing(s)</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, {paddingBottom: insets.bottom + 100}]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {rows.map((row) => (
            <View key={row.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={globalStyles.textSMGreyDark}>Listing</Text>
                {rows.length > 1 && (
                  <TouchableOpacity
                    onPress={() => removeRow(row.id)}
                    hitSlop={8}
                    style={styles.deleteBtn}>
                    <ExIcon width={20} height={20} />
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Genus <Text style={globalStyles.textXSRed}>*</Text></Text>
                <InputDropdownSearch
                  options={genusOptions}
                  selectedOption={row.genus}
                  onSelect={(v) => handleGenusChange(row.id, v)}
                  placeholder={loadingGenus ? 'Loading...' : 'Choose genus'}
                  disabled={loadingGenus}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Species <Text style={globalStyles.textXSRed}>*</Text></Text>
                <InputDropdownSearch
                  options={row.speciesList}
                  selectedOption={row.species}
                  onSelect={(v) => handleSpeciesChange(row.id, v)}
                  placeholder={row.loadingSpecies ? 'Loading...' : 'Choose species'}
                  disabled={row.loadingSpecies || !row.genus}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Variegation</Text>
                <InputDropdownSearch
                  options={row.variegationList}
                  selectedOption={row.variegation}
                  onSelect={(v) => updateRow(row.id, {variegation: v})}
                  placeholder={row.loadingVariegation ? 'Loading...' : 'Optional'}
                  disabled={row.loadingVariegation || !row.species}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Pot Size <Text style={globalStyles.textXSRed}>*</Text></Text>
                <View style={styles.potRow}>
                  {potSizes.map((size) => (
                    <TouchableOpacity
                      key={size}
                      onPress={() => updateRow(row.id, {potSize: size})}
                      style={[
                        styles.potBtn,
                        row.potSize === size && styles.potBtnActive,
                      ]}>
                      <Text
                        style={[
                          globalStyles.textSMGreyDark,
                          row.potSize === size && styles.potBtnTextActive,
                        ]}>
                        {size}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Local Price <Text style={globalStyles.textXSRed}>*</Text></Text>
                <InputBox
                  placeholder="Enter price"
                  value={row.localPrice}
                  setValue={(v) => updateRow(row.id, {localPrice: v})}
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Approximate Height <Text style={globalStyles.textXSRed}>*</Text></Text>
                <View style={styles.potRow}>
                  {heightOptions.map((opt) => (
                    <TouchableOpacity
                      key={opt.value}
                      onPress={() => updateRow(row.id, {approximateHeight: opt.value})}
                      style={[
                        styles.potBtn,
                        row.approximateHeight === opt.value && styles.potBtnActive,
                      ]}>
                      <Text
                        style={[
                          globalStyles.textSMGreyDark,
                          row.approximateHeight === opt.value && styles.potBtnTextActive,
                        ]}
                        numberOfLines={1}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Image (optional)</Text>
                <View style={styles.imageRow}>
                  {row.image ? (
                    <View style={styles.thumbWrap}>
                      <Image source={{uri: row.image}} style={styles.thumb} />
                      <TouchableOpacity
                        style={styles.thumbRemove}
                        onPress={() => updateRow(row.id, {image: null})}>
                        <ExIcon width={14} height={14} />
                      </TouchableOpacity>
                    </View>
                  ) : null}
                  <TouchableOpacity
                    style={styles.addPhotoBtn}
                    onPress={() => pickImageForRow(row.id)}>
                    <Text style={globalStyles.textSMAccent}>+ Add photo</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}

          <TouchableOpacity style={styles.addRowBtn} onPress={addRow}>
            <Text style={globalStyles.textMDAccent}>+ Add Listing</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[globalStyles.primaryButton, styles.uploadBtn]}
            onPress={onUploadAll}
            disabled={uploading}>
            <Text style={globalStyles.primaryButtonText}>
              {uploading
                ? `Uploading ${uploadProgress.current}/${uploadProgress.total}...`
                : 'Upload All'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {uploading && (
        <Modal transparent animationType="fade">
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#699E73" />
            <Text style={styles.loadingText}>
              {uploadProgress.current} / {uploadProgress.total}
            </Text>
          </View>
        </Modal>
      )}

      <Toast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        duration={3000}
        position="bottom"
        onHide={() => setToastVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E7E9',
    backgroundColor: '#fff',
  },
  backButton: {padding: 5},
  headerRight: {minWidth: 60, alignItems: 'flex-end'},
  keyboardView: {flex: 1},
  scroll: {flex: 1},
  scrollContent: {padding: 16, paddingBottom: 120},
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E4E7E9',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  deleteBtn: {padding: 4},
  field: {marginBottom: 14},
  label: {
    ...globalStyles.textSMGreyDark,
    marginBottom: 6,
  },
  potRow: {
    flexDirection: 'row',
    gap: 8,
  },
  potBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CDD3D4',
    alignItems: 'center',
  },
  potBtnActive: {
    borderColor: '#23C16B',
    backgroundColor: '#E8F5E9',
  },
  potBtnTextActive: {
    color: '#23C16B',
    fontWeight: '600',
  },
  imageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  thumbWrap: {
    position: 'relative',
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 8,
  },
  thumbRemove: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 2,
  },
  addPhotoBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#23C16B',
    borderRadius: 8,
  },
  addRowBtn: {
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  uploadBtn: {marginTop: 8},
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#fff',
    fontSize: 16,
  },
});

export default ScreenBatchUpload;
