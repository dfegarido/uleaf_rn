import NetInfo from '@react-native-community/netinfo';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { globalStyles } from '../../../assets/styles/styles';
import {
  getListingDetails,
  getMutationApi,
  getSellGenusApi,
  getSellSpeciesApi,
  getSellVariegationApi,
  postSellSinglePlantApi,
  postSellUpdateApi,
  uploadMultipleImagesToBackend
} from '../../../components/Api';
import { ImagePickerModal } from '../../../components/ImagePicker';
import {
  InputBox,
  InputCheckBox,
  InputDropdown,
  InputDropdownSearch,
} from '../../../components/Input';
import { getCachedResponse, setCachedResponse } from '../../../utils/apiResponseCache';
import { retryAsync } from '../../../utils/utils';
// Remove Firebase upload import - we'll use backend API instead
// import {uploadImageToFirebase} from '../../../utils/uploadImageToFirebase';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ArrowUpIcon from '../../../assets/icons/accent/arrow-up-right-regular.svg';
import QuestionIcon from '../../../assets/icons/accent/question-regular.svg';
import LeftIcon from '../../../assets/icons/greylight/caret-left-regular.svg';
import { getActiveLiveListingApi } from '../../../components/Api/agoraLiveApi';

const screenWidth = Dimensions.get('window').width;

const potSizes = ['2"', '4"', '6"'];
const heightOptions = [
  {
    label: 'Below 12 inches',
    subLabel: '<30 cm',
    value: 'below',
  },
  {
    label: '12 inches & above',
    subLabel: '>=30 cm',
    value: 'above',
  },
];

import { useNavigationState } from '@react-navigation/native';

const ScreenSingleSellLive = ({navigation, route, nextIgIndex}) => {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);

  const routes = useNavigationState(state => state.routes);
  const previousRoute = routes[routes.length - 2]; // Previous screen
  const isFromDuplicateSell = previousRoute?.name === 'ScreenDuplicateSell';
  const isFromDraftSell = previousRoute?.name === 'ScreenDraftSell';

  // useEffect(() => {
  //   if (isFromDuplicateSell || !plantCode || isFromDraftSell) {
  //     navigation.setOptions({
  //       headerRight: () => (
  //         <TouchableOpacity onPress={() => onPressSave()} color="#000">
  //           <Text style={globalStyles.textLGAccent}>Save</Text>
  //         </TouchableOpacity>
  //       ),
  //     });
  //   }
  // }, [navigation, plantCode]);

  // Dropdown
  const [dropdownOptionGenus, setDropdownOptionGenus] = useState([]);
  const [dropdownOptionSpecies, setDropdownOptionSpecies] = useState([]);
  const [dropdownOptionVariegation, setDropdownOptionVariegation] = useState(
    [],
  );
  const [loadingSpecies, setLoadingSpecies] = useState(false);
  const [loadingVariegation, setLoadingVariegation] = useState(false);
  const [dropdownOptionMutation, setDropdownOptionMutation] = useState([]);
  const [dropdownVariegationDisable, setdropdownVariegationDisable] =
    useState(false);

  const loadGenusData = async () => {
    let netState = await NetInfo.fetch();
    if (!netState.isConnected || !netState.isInternetReachable) {
      throw new Error('No internet connection.');
    }

    const getGenusApiData = await getSellGenusApi();
    // Check if API indicates failure
    if (!getGenusApiData?.success) {
      throw new Error(getGenusApiData?.message || 'Failed to load genus');
    }
    // Extract sort option names as label/value pairs
    let localGenusData = getGenusApiData.data;
    // Set options
    setDropdownOptionGenus(localGenusData);
  };

  const loadSpeciesData = async genus => {
    let netState = await NetInfo.fetch();
    if (!netState.isConnected || !netState.isInternetReachable) {
      throw new Error('No internet connection.');
    }

    // Note: caching removed — always fetch fresh species data

    const getSpeciesApiData = await getSellSpeciesApi(genus);
    // console.log(getSpeciesApiData.data);
    // const getSpeciesApiData = await getSpeciesApi(genus);
    // Check if API indicates failure
    if (!getSpeciesApiData?.success) {
      throw new Error(getSpeciesApiData?.message || 'Failed to load species');
    }
    // Extract sort option names as label/value pairs
    // let localSpeciesData = getSpeciesApiData.data.map(item => item.name);
    setSelectedSpecies('');
    let localSpeciesDatas = getSpeciesApiData.data;
    // Set options
    setDropdownOptionSpecies(getSpeciesApiData.data);
  // Caching intentionally disabled for species dropdown
  };

  const loadVariegationData = async (genus, species) => {
    let netState = await NetInfo.fetch();
    if (!netState.isConnected || !netState.isInternetReachable) {
      throw new Error('No internet connection.');
    }

    // Check cache first (10 minute TTL)
    const cacheKey = `variegation_${genus}_${species}`;
    const cached = await getCachedResponse('variegation', `${genus}_${species}`, 'seller');
    if (cached && cached.success) {
      console.log('✅ Using cached variegation data for:', genus, species);
      setSelectedVariegation('');
      let localVariegationData = cached.data;
      setSelectedVariegation(cached.data[0]);
      setDropdownOptionVariegation(localVariegationData);
      return;
    }

    // const getVariegationApiData = await getVariegationApi(genus, species);
    const getVariegationApiData = await getSellVariegationApi(genus, species);
    // Check if API indicates failure
    if (!getVariegationApiData?.success) {
      throw new Error(
        getVariegationApiData?.message || 'Failed to load variegation',
      );
    }
    // Extract sort option names as label/value pairs
    // let localVariegationData = getVariegationApiData.data.map(
    //   item => item.name,
    // );
    let localVariegationData = getVariegationApiData.data;
    setSelectedVariegation('');
    // setdropdownVariegationDisable(
    //   getVariegationApiData.data.length != 0 ? true : false,
    // );
    setSelectedVariegation(getVariegationApiData.data[0]);
    // Set options
    setDropdownOptionVariegation(localVariegationData);
    // Cache the response for 10 minutes
    await setCachedResponse('variegation', `${genus}_${species}`, 'seller', getVariegationApiData, 600000);
  };

  const loadMutationData = async () => {
    let netState = await NetInfo.fetch();
    if (!netState.isConnected || !netState.isInternetReachable) {
      throw new Error('No internet connection.');
    }

    const getMutationApiData = await getMutationApi();
    // Check if API indicates failure
    if (!getMutationApiData?.success) {
      throw new Error(getMutationApiData?.message || 'Failed to load genus');
    }

    // console.log(getMutationApiData.data);
    // Extract sort option names as label/value pairs
    let localMutationData = getMutationApiData.data.map(item => item.name);
    // Set options
    setDropdownOptionMutation(localMutationData);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([loadGenusData(), loadMutationData()]);
      } catch (error) {
        console.log('Error get listing:', error);
      }
    };

    fetchData();
  }, []);
  // Dropdown

  // Dropdown Genus
  const [selectedGenus, setSelectedGenus] = useState('');
  const handleGenusChange = async genus => {
    setSelectedGenus(genus);
    setLoadingSpecies(true);
    // Clear dependent dropdowns while loading
    setSelectedSpecies('');
    setSelectedVariegation('');
    setDropdownOptionSpecies([]);
    setDropdownOptionVariegation([]);
    
    try {
      await loadSpeciesData(genus); // fetch and update species dropdown
    } catch (error) {
      console.error('Error loading species data:', error.message);
      Alert.alert('Error', 'Failed to load species options. Please try again.');
    } finally {
      setLoadingSpecies(false);
    }
  };
  // Dropdown Genus

  // Dropdown Species
  const [selectedSpecies, setSelectedSpecies] = useState('');
  const handleSpeciesChange = async species => {
    // setdropdownVariegationDisable(false);
    setSelectedVariegation('');
    setSelectedSpecies(species);
    setLoadingVariegation(true);
    // Clear variegation dropdown while loading
    setDropdownOptionVariegation([]);
    
    try {
      await loadVariegationData(selectedGenus, species); // fetch and update variegation dropdown
    } catch (error) {
      console.error('Error loading variegation data:', error.message);
      Alert.alert('Error', 'Failed to load variegation options. Please try again.');
    } finally {
      setLoadingVariegation(false);
    }
  };
  // Dropdown Species

  const [selectedVariegation, setSelectedVariegation] = useState('');

  const [localPrice, setLocalPrice] = useState('');
  const [selectedMutation, setSelectedMutation] = useState('');
  const [isChecked, setIsChecked] = useState(false);
  const [images, setImages] = useState([]);
  const handleImagePicked = uris => {
    setImages(prevImages => [...prevImages, ...uris]); // Append new images
    console.log('Appended URIs:', uris);
  };
  const removeImage = indexToRemove => {
    setImages(prevImages =>
      prevImages.filter((_, index) => index !== indexToRemove),
    );
  };
  const [selectedPotSize, setSelectPotSize] = useState('2"');
  const [selectedMeasure, setSelectMeasure] = useState('below');

  const renderPotSizes = () =>
    potSizes.map(size => (
      <TouchableOpacity key={size} onPress={() => setSelectPotSize(size)}>
        <View
          style={[
            selectedPotSize == size
              ? styles.cardSelectionSelected
              : styles.cardSelection,
          ]}>
          <Text style={globalStyles.textMDGreyDark}>{size}</Text>
        </View>
      </TouchableOpacity>
    ));

  const renderHeightOptions = () =>
    heightOptions.map(option => (
      <TouchableOpacity
        key={option.value}
        onPress={() => setSelectMeasure(option.value)}>
        <View
          style={[
            selectedMeasure === option.value
              ? styles.cardSelectionSelectedMeasure
              : styles.cardSelectionMeasure,
            {
              width: (screenWidth - 55) / 2, // 40 for padding/margin
            },
          ]}>
          <Text style={globalStyles.textMDGreyDark}>{option.label}</Text>
          <Text style={globalStyles.textSMGreyLight}>{option.subLabel}</Text>
        </View>
      </TouchableOpacity>
    ));

  // Form validation
  const validateForm = () => {
    let errors = [];

    if (!selectedGenus) errors.push('Genus is required.');
    if (!selectedSpecies) errors.push('Species is required.');
    // if (!selectedVariegation) errors.push('Variegation is required.');
    if (isChecked && !selectedMutation)
      errors.push('Mutation type must be selected.');
    if (images.length === 0) errors.push('At least one image is required.');
    if (!localPrice || isNaN(localPrice) || localPrice == 0)
      errors.push('Valid local price is required.');
    if (!selectedPotSize) errors.push('Pot size is required.');
    if (!selectedMeasure) errors.push('Approximate height is required.');

    return errors;
  };
  // Form validation

  // Publish now
  const onPressPublish = async () => {
    const errors = validateForm();
    if (errors.length > 0) {
      Alert.alert('Validation', errors.join('\n'));
      return;
    }
    setLoading(true);
    try {
      let netState = await NetInfo.fetch();
      if (!netState.isConnected || !netState.isInternetReachable) {
        throw new Error('No internet connection.');
      }

      let withActiveLiveListing = false;

      const activeListingRes = await getActiveLiveListingApi();
        
      if (activeListingRes?.success) {
          withActiveLiveListing = true;
      }

      // Upload images to Backend API (which handles Firebase Storage)
      console.log('📤 Uploading', images.length, 'images to backend...');
      const uploadedUrls = await uploadMultipleImagesToBackend(images);
      console.log('✅ All images uploaded:', uploadedUrls);

      const variegation = selectedVariegation === 'Choose the most suitable variegation.' ? '' : selectedVariegation;

      // Build final JSON using uploaded URLs
      const data = {
        listingType: 'Single Plant',
        genus: selectedGenus || null,
        species: selectedSpecies || null,
        variegation,
        isMutation: isChecked,
        mutation: isChecked ? selectedMutation : null,
        imagePrimary: uploadedUrls.length > 0 ? uploadedUrls[0] : null,
        imageCollection: uploadedUrls,
        potSize: selectedPotSize,
        localPrice: localPrice ? parseFloat(localPrice) : null,
        approximateHeight:
          selectedMeasure === 'below' ? 'Below 12 inches' : '12 inches & above',
        status: isPurge ? 'Purge' : 'Live',
        publishType: 'Publish Now',
        isActiveLiveListing: !withActiveLiveListing,
      };

      if (isPurge) {
        data.sessionId = sessionId;
      }

      const response = await postSellSinglePlantApi(data);

      if (!response?.success) {
        throw new Error(response?.message || 'Publish now failed.');
      }

      // console.log('✅ Submitting listing:', JSON.stringify(data, null, 2));

      // TODO: Replace this with your actual API call
      // await submitListing(data);
      setLoading(false);
      Alert.alert(
        "Success",
        "Listing published successfully!",
        [
          { 
            text: "Ok",
            onPress: () => isPurge ? navigation.goBack() : navigation.navigate('Sell')
          },
        ]
      );
    } catch (error) {
      console.error('Upload or submission failed:', error);
      Alert.alert('Publish Now', error.message);
    } finally {
      setLoading(false);
    }
  };
  // Publish now

  // Details
  const {
    plantCode = '',
    availableQty,
    status,
    publishType,
    isPurge = false,
    sessionId = ''
  } = route?.params ?? {};

  useEffect(() => {
    if (!plantCode) return; // Skip if plantCode is not set

    setLoading(true);

    const fetchDetailed = async () => {
      try {
        await loadListingDetail(plantCode);
      } catch (error) {
        console.log('Fetching details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDetailed();
  }, [plantCode]);

  const loadListingDetail = async plantCode => {
    let netState = await NetInfo.fetch();
    if (!netState.isConnected || !netState.isInternetReachable) {
      throw new Error('No internet connection.');
    }

    console.log(plantCode);

    const res = await retryAsync(() => getListingDetails(plantCode), 3, 1000);

    if (!res?.success) {
      throw new Error(res?.message || 'Failed to load sort api');
    }
    console.log(res.data.localPrice || '');
    setSelectedGenus(res.data.genus || null);
    setSelectedSpecies(res.data.species || null);
    setSelectedVariegation(res.data.variegation || null);
    setIsChecked(!!res.data.isMutation);
    setSelectedMutation(res.data.mutation || null);
    if (isFromDuplicateSell == false) {
      setImages(res.data.imageCollection || []);
    }
    setLocalPrice(String(res.data.localPrice ?? ''));
    setSelectPotSize(res.data.potSize || null);
    setSelectMeasure(
      res.data.approximateHeight === 'Below 12 inches'
        ? 'below'
        : 'above' || null,
    );

    console.log(res.data);
    // setSwitchActive(res.data.status == 'Active' ? true : false);
    // setListingData(res.data);
  };

  const onPressUpdate = async paramStatus => {
    const errors = validateForm();
    if (errors.length > 0) {
      Alert.alert('Validation', errors.join('\n'));
      return;
    }
    setLoading(true);
    try {
      let netState = await NetInfo.fetch();
      if (!netState.isConnected || !netState.isInternetReachable) {
        throw new Error('No internet connection.');
      }

      // Upload images to Backend API (which handles Firebase Storage)
      console.log('📤 Uploading', images.length, 'images to backend...');
      const uploadedUrls = await uploadMultipleImagesToBackend(images);
      console.log('✅ All images uploaded:', uploadedUrls);

      // Build final JSON using uploaded URLs
      const data = {
        plantCode: plantCode,
        availableQty: availableQty,
        listingType: 'Single Plant',
        genus: selectedGenus || null,
        species: selectedSpecies || null,
        variegation: selectedVariegation || null,
        isMutation: isChecked,
        mutation: isChecked ? selectedMutation : null,
        imagePrimary: uploadedUrls.length > 0 ? uploadedUrls[0] : null,
        imageCollection: uploadedUrls,
        potSize: selectedPotSize,
        localPrice: localPrice ? parseFloat(localPrice) : null,
        approximateHeight:
          selectedMeasure === 'below' ? 'Below 12 inches' : '12 inches & above',
        status:
          isFromDraftSell == false && isFromDuplicateSell == false
            ? status
            : paramStatus,
        publishType:
          isFromDraftSell == false && isFromDuplicateSell == false
            ? publishType
            : paramStatus == 'Active'
            ? 'Publish Now'
            : 'Publish on Nursery Drop',
      };
      // console.log(data);
      const response = await postSellUpdateApi(data);

      if (!response?.success) {
        throw new Error(response?.message || 'Update listing failed.');
      }

      // console.log('✅ Submitting listing:', JSON.stringify(data, null, 2));

      // TODO: Replace this with your actual API call
      // await submitListing(data);

      isManuallyNavigating.current = true;
      showAlertSuccess('Update Listing', 'Listing updated successfully!');
    } catch (error) {
      console.error('Upload or submission failed:', error);
      Alert.alert('Update Listing', error.message);
    } finally {
      setLoading(false);
    }
  };
  // Details

  // Confirm
  const [onGobackModalVisible, setOnGobackModalVisible] = useState(false);
  // Confirm

  // On go back
  const [blockNavEvent, setBlockNavEvent] = useState(null); // for delayed navigation

  const isManuallyNavigating = useRef(false);

  // Show success alert
  const showAlertSuccess = (titleText, messageText) => {
    Alert.alert(
      titleText,
      messageText,
      [
        {
          text: 'OK',
          onPress: () => navigation.goBack(), // 👈 Go back to the previous screen
        },
      ],
      {
        cancelable: false, // 🔒 Prevent dismiss on outside tap or back button
      },
    );
  };
  // Show success alert

  const goBack = () => {
    setLoading(true);
    navigation.goBack();
    setLoading(false);
  }   


  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.mainContent, {paddingTop: insets.top + 10}]}>
      {/* Sticky Header */}
      <View
        style={[
          {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingBottom: 10,
          },
        ]}>
        <TouchableOpacity
          onPress={() => goBack()}
          style={[
            styles.iconButton,
            {
              borderWidth: 1,
              borderColor: '#CDD3D4',
              padding: 5,
              borderRadius: 10,
              backgroundColor: '#fff',
            },
          ]}>
          <LeftIcon width={20} height={20} />
        </TouchableOpacity>
        <Text style={[globalStyles.textXLGreyDark, {fontWeight: 'bold'}]}>
          {isPurge ? 'Purge Single Plant': 'Live Single Plant'}
        </Text>
        {/* {(isFromDuplicateSell || !plantCode || isFromDraftSell) && (
          <TouchableOpacity onPress={onPressSave} style={styles.iconButton}>
            <Text style={globalStyles.textLGAccent}>Save</Text>
          </TouchableOpacity>
        )} */}
        <Text>{''}</Text>
      </View>
      <ScrollView
        style={styles.mainContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{
          paddingBottom: insets.bottom + 40,
        }}>
        {loading && (
          <Modal transparent animationType="fade">
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#699E73" />
            </View>
          </Modal>
        )}
        <View style={styles.formContainer}>
          {nextIgIndex > 0 && (
            <View style={styles.igIndexRow}>
              <View style={styles.igIndexBadge}>
                <Text style={styles.igIndexText}>IG{nextIgIndex}</Text>
              </View>
            </View>
          )}
          <View style={[{paddingBottom: 10}]}>
            <Text style={[globalStyles.textLGGreyDark, {paddingBottom: 5}]}>
              Genus <Text style={globalStyles.textXSRed}>*</Text>
            </Text>
            <InputDropdownSearch
              options={dropdownOptionGenus}
              selectedOption={selectedGenus}
              onSelect={handleGenusChange}
              placeholder="Choose an option"
            />
          </View>
          <View style={[{paddingBottom: 10}]}>
            <Text style={[globalStyles.textLGGreyDark, {paddingBottom: 5}]}>
              Species <Text style={globalStyles.textXSRed}>*</Text>
            </Text>
            <InputDropdownSearch
              options={dropdownOptionSpecies}
              selectedOption={selectedSpecies}
              onSelect={handleSpeciesChange}
              placeholder={loadingSpecies ? "Loading species..." : "Choose an option"}
              disabled={loadingSpecies || !selectedGenus}
            />
            {loadingSpecies && (
              <Text style={[globalStyles.textXSGreyDark, {paddingTop: 5, fontStyle: 'italic'}]}>
                ⏳ Loading species options...
              </Text>
            )}
          </View>
          <View style={[{paddingBottom: 20}]}>
            <Text style={[globalStyles.textLGGreyDark, {paddingBottom: 5}]}>
              Variegation <Text style={globalStyles.textXSRed}></Text>
            </Text>
            <InputDropdownSearch
              options={dropdownOptionVariegation}
              selectedOption={selectedVariegation}
              onSelect={setSelectedVariegation}
              placeholder={loadingVariegation ? "Loading variegation..." : "Choose an option"}
              disabled={dropdownVariegationDisable || loadingVariegation || !selectedSpecies}
            />
            {loadingVariegation && (
              <Text style={[globalStyles.textXSGreyDark, {paddingTop: 5, fontStyle: 'italic'}]}>
                ⏳ Loading variegation options...
              </Text>
            )}
          </View>
          <Text style={[globalStyles.textMDGreyDark, {paddingBottom: 5}]}>
            Can't find genus or species name?
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('ScreenProfileRequest')}>
            <View style={{flexDirection: 'row', paddingTop: 10}}>
              <QuestionIcon width={20} height={20}></QuestionIcon>
              <Text style={globalStyles.textMDAccent}> Request here</Text>
              <ArrowUpIcon width={20} height={20}></ArrowUpIcon>
            </View>
          </TouchableOpacity>
        </View>
        <View style={styles.formContainer}>
          <Text style={[globalStyles.textMDGreyDark, {paddingBottom: 5}]}>
            Is this a mutation?
          </Text>
          <View>
            <InputCheckBox
              label="Yes"
              checked={isChecked}
              onChange={setIsChecked}
            />
          </View>
        </View>
        <View
          style={[
            styles.formContainer,
            {display: isChecked ? 'flex' : 'none'},
          ]}>
          <Text style={[globalStyles.textLGGreyDark, {paddingBottom: 5}]}>
            Please select one that best discribes the mutated plant
          </Text>
          <InputDropdown
            options={dropdownOptionMutation}
            selectedOption={selectedMutation}
            onSelect={setSelectedMutation}
            placeholder="Choose an option"
          />
        </View>
        <View style={styles.formContainer}>
          <Text style={[globalStyles.textMDGreyDark, {paddingBottom: 5}]}>
            Picture/s <Text style={globalStyles.textXSRed}>*</Text>
          </Text>
          {images.length > 0 && (
            <>
              <Text style={styles.label}>Selected Images:</Text>
              <FlatList
                data={images}
                keyExtractor={(uri, index) => index.toString()}
                horizontal
                renderItem={({item, index}) => (
                  <View style={styles.imageContainer}>
                    <Image source={{uri: item}} style={styles.image} />
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => removeImage(index)}>
                      <Text style={styles.removeButtonText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                )}
              />
            </>
          )}

          <ImagePickerModal onImagePicked={handleImagePicked} />
          <Text style={[globalStyles.textSMGreyLight, {textAlign: 'center'}]}>
            Take a photo(camera) or select from your library
          </Text>
        </View>
        <View style={styles.formContainer}>
          <Text style={[globalStyles.textMDGreyDark]}>
            Pot Size <Text style={globalStyles.textXSRed}>*</Text>
          </Text>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginVertical: 10,
            }}>
            {renderPotSizes()}
          </View>
          <View>
            <View style={{marginTop: 10}}>
              <Text style={[globalStyles.textLGGreyDark, {paddingBottom: 10}]}>
                Local Price <Text style={globalStyles.textXSRed}>*</Text>
              </Text>
              <InputBox
                placeholder={'Enter price'}
                value={localPrice}
                setValue={setLocalPrice}></InputBox>
            </View>
            <View style={{marginTop: 10}}>
              <Text style={globalStyles.textLGGreyDark}>
                Approximate Height <Text style={globalStyles.textXSRed}>*</Text>
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  marginTop: 10,
                  justifyContent: 'space-between',
                }}>
                {renderHeightOptions()}
              </View>
            </View>
            <Text style={[globalStyles.textSMGreyLight, {paddingTop: 10}]}>
              For shipping costs calculations only.
            </Text>
          </View>
          <View style={{paddingTop: 30}}>
            {isFromDuplicateSell == false &&
              !plantCode == false &&
              isFromDraftSell == false && (
                <TouchableOpacity
                  style={globalStyles.primaryButton}
                  onPress={() => onPressUpdate('')}>
                  <Text style={globalStyles.primaryButtonText}>
                    Update Listing
                  </Text>
                </TouchableOpacity>
              )}

            {isFromDraftSell == true && (
              <>
                <TouchableOpacity
                  style={globalStyles.primaryButton}
                  onPress={() => onPressUpdate('Active')}>
                  <Text style={globalStyles.primaryButtonText}>
                    Publish Now
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {isFromDuplicateSell == false &&
              !plantCode &&
              isFromDraftSell == false && (
                <>
                  <TouchableOpacity
                    style={globalStyles.primaryButton}
                    onPress={onPressPublish}>
                    <Text style={globalStyles.primaryButtonText}>
                      Publish Now
                    </Text>
                  </TouchableOpacity>
                </>
              )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  mainContent: {
    flex: 1,
    backgroundColor: '#fff',
  },
  formContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomColor: '#E4E7E9',
    borderBottomWidth: 1,
  },
  igIndexRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  igIndexBadge: {
    backgroundColor: '#333',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  igIndexText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  image: {
    width: 150,
    height: 150,
    marginRight: 10,
    borderRadius: 10,
  },
  cardSelection: {
    alignItems: 'center',
    padding: 33,
    backgroundColor: '#F2F7F3',
    borderColor: '#C0DAC2',
    borderWidth: 1,
    borderRadius: 10,
    width: 0.33 * screenWidth - 20,
  },
  cardSelectionSelected: {
    alignItems: 'center',
    padding: 33,
    backgroundColor: '#FFF',
    borderColor: '#539461',
    borderWidth: 1,
    borderRadius: 10,
    width: 0.33 * screenWidth - 20,
  },
  cardSelectionMeasure: {
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 30,
    backgroundColor: '#F2F7F3',
    borderColor: '#C0DAC2',
    borderWidth: 1,
    borderRadius: 10,
    width: 0.4 * screenWidth - 25,
  },
  cardSelectionSelectedMeasure: {
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 30,
    backgroundColor: '#FFF',
    borderColor: '#539461',
    borderWidth: 1,
    borderRadius: 10,
    width: 0.4 * screenWidth - 25,
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButton: {
    position: 'absolute',
    top: 5,
    right: 15,
    backgroundColor: '#eee',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  removeButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default ScreenSingleSellLive;
