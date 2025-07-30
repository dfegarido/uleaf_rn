import React, {useLayoutEffect, useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  Dimensions,
  ScrollView,
  StyleSheet,
  Alert,
  Modal,
  ActivityIndicator,
  BackHandler,
} from 'react-native';
import {globalStyles} from '../../../assets/styles/styles';
import {
  InputBox,
  InputDropdown,
  InputCheckBox,
} from '../../../components/Input';
import {ImagePickerModal} from '../../../components/ImagePicker';
import {
  // getGenusApi,
  getSpeciesApi,
  getVariegationApi,
  getSellGenusApi,
  getSellSpeciesApi,
  getSellVariegationApi,
  postSellSinglePlantApi,
  getMutationApi,
  getListingDetails,
  postSellUpdateApi,
} from '../../../components/Api';
import {getApp} from '@react-native-firebase/app';
import {getAuth} from '@react-native-firebase/auth';
import NetInfo from '@react-native-community/netinfo';
import {retryAsync} from '../../../utils/utils';
import {uploadImageToFirebase} from '../../../utils/uploadImageToFirebase';
import SellConfirmDraft from './components/SellConfirmDraft';

import QuestionIcon from '../../../assets/icons/accent/question-regular.svg';
import ArrowUpIcon from '../../../assets/icons/accent/arrow-up-right-regular.svg';

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

import {useNavigationState} from '@react-navigation/native';

const ScreenSingleSell = ({navigation, route}) => {
  const app = getApp();
  const auth = getAuth(app);
  const [loading, setLoading] = useState(false);

  const routes = useNavigationState(state => state.routes);
  const previousRoute = routes[routes.length - 2]; // Previous screen
  const isFromDuplicateSell = previousRoute?.name === 'ScreenDuplicateSell';
  const isFromDraftSell = previousRoute?.name === 'ScreenDraftSell';

  useEffect(() => {
    if (isFromDuplicateSell || !plantCode || isFromDraftSell) {
      navigation.setOptions({
        headerRight: () => (
          <TouchableOpacity onPress={() => onPressSave()} color="#000">
            <Text style={globalStyles.textLGAccent}>Save</Text>
          </TouchableOpacity>
        ),
      });
    }
  }, [navigation, plantCode]);

  // Dropdown
  const [dropdownOptionGenus, setDropdownOptionGenus] = useState([]);
  const [dropdownOptionSpecies, setDropdownOptionSpecies] = useState([]);
  const [dropdownOptionVariegation, setDropdownOptionVariegation] = useState(
    [],
  );
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
    let localSpeciesData = getSpeciesApiData.data;
    // Set options
    setDropdownOptionSpecies(localSpeciesData);
  };

  const loadVariegationData = async (genus, species) => {
    let netState = await NetInfo.fetch();
    if (!netState.isConnected || !netState.isInternetReachable) {
      throw new Error('No internet connection.');
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
      const currentUser = auth.currentUser;

      if (currentUser) {
        try {
          // await loadGenusData();
          await Promise.all([loadGenusData(), loadMutationData()]);
        } catch (error) {
          console.log('Error get listing:', error);
        }
      } else {
        console.log('No user is logged in');
      }
    };

    fetchData();
  }, []);
  // Dropdown

  // Dropdown Genus
  const [selectedGenus, setSelectedGenus] = useState('');
  const handleGenusChange = async genus => {
    setSelectedGenus(genus);
    setLoading(true);
    try {
      await loadSpeciesData(genus); // fetch and update species dropdown
    } catch (error) {
      console.error('Error loading species data:', error.message);
      // Optionally show error to user
    } finally {
      setLoading(false);
    }
  };
  // Dropdown Genus

  // Dropdown Species
  const [selectedSpecies, setSelectedSpecies] = useState('');
  const handleSpeciesChange = async species => {
    // setdropdownVariegationDisable(false);
    setSelectedVariegation('');
    setSelectedSpecies(species);
    setLoading(true);
    try {
      await loadVariegationData(selectedGenus, species); // fetch and update species dropdown
    } catch (error) {
      console.error('Error loading species data:', error.message);
      // Optionally show error to user
    } finally {
      setLoading(false);
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
    if (!selectedVariegation) errors.push('Variegation is required.');
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

      // Upload images to Firebase
      const uploadedUrls = [];
      for (const uri of images) {
        const firebaseUrl = await uploadImageToFirebase(uri);
        uploadedUrls.push(firebaseUrl);
      }

      // Build final JSON using uploaded URLs
      const data = {
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
        status: 'Active',
        publishType: 'Publish Now',
      };

      const response = await postSellSinglePlantApi(data);

      if (!response?.success) {
        throw new Error(response?.message || 'Publish now failed.');
      }

      // console.log('✅ Submitting listing:', JSON.stringify(data, null, 2));

      // TODO: Replace this with your actual API call
      // await submitListing(data);
      isManuallyNavigating.current = true;
      showAlertSuccess('Publish Now', 'Listing published successfully!');
    } catch (error) {
      console.error('Upload or submission failed:', error);
      Alert.alert('Publish Now', error.message);
    } finally {
      setLoading(false);
    }
  };
  // Publish now

  // Publish on nursery drop
  const onPressPublishNurseryDrop = async () => {
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

      // Upload images to Firebase
      const uploadedUrls = [];
      for (const uri of images) {
        const firebaseUrl = await uploadImageToFirebase(uri);
        uploadedUrls.push(firebaseUrl);
      }

      // Build final JSON using uploaded URLs
      const data = {
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
        status: 'Scheduled',
        publishType: 'Publish on Nursery Drop',
      };

      const response = await postSellSinglePlantApi(data);

      if (!response?.success) {
        throw new Error(response?.message || 'Publish on Nursery Drop failed.');
      }

      // console.log('✅ Submitting listing:', JSON.stringify(data, null, 2));

      // TODO: Replace this with your actual API call
      // await submitListing(data);

      isManuallyNavigating.current = true;
      showAlertSuccess(
        'Publish on Nursery Drop',
        'Listing published on nursery drop successfully!',
      );
    } catch (error) {
      console.error('Upload or submission failed:', error);
      Alert.alert('Publish on Nursery Drop', error.message);
    } finally {
      setLoading(false);
    }
  };
  // Publish on nursery drop

  // Save as draft
  const onPressSave = async () => {
    // const errors = validateForm();
    // if (errors.length > 0) {
    //   Alert.alert('Validation', errors.join('\n'));
    //   return;
    // }
    setLoading(true);
    try {
      let netState = await NetInfo.fetch();
      if (!netState.isConnected || !netState.isInternetReachable) {
        throw new Error('No internet connection.');
      }

      // Upload images to Firebase
      const uploadedUrls = [];

      console.log(uploadedUrls);
      for (const uri of images) {
        const firebaseUrl = await uploadImageToFirebase(uri);
        uploadedUrls.push(firebaseUrl);
      }

      // Build final JSON using uploaded URLs
      const data = {
        listingType: 'Single Plant',
        genus: selectedGenus || null,
        species: selectedSpecies || null,
        variegation: selectedVariegation || null,
        isMutation: isChecked,
        mutation: isChecked ? selectedMutation : null,
        imagePrimary: uploadedUrls.length > 0 ? uploadedUrls[0] : null,
        imageCollection: uploadedUrls,
        potSize: selectedPotSize,
        localPrice: localPrice ? parseFloat(localPrice) : 0,
        approximateHeight:
          selectedMeasure === 'below' ? 'Below 12 inches' : '12 inches & above',
        status: 'Draft',
        publishType: '',
      };

      const response = await postSellSinglePlantApi(data);

      if (!response?.success) {
        throw new Error(response?.message || 'Save failed.');
      }

      // console.log('✅ Submitting listing:', JSON.stringify(data, null, 2));

      // TODO: Replace this with your actual API call
      // await submitListing(data);

      isManuallyNavigating.current = true;
      showAlertSuccess('Save Listing', 'Listing saved successfully!');
    } catch (error) {
      console.error('Upload or submission failed:', error);
      Alert.alert('Save Listing', error.message);
    } finally {
      setLoading(false);
    }
  };
  // Save as draft

  // Details
  const {
    plantCode = '',
    availableQty,
    status,
    publishType,
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

      // Upload images to Firebase
      const uploadedUrls = [];
      for (const uri of images) {
        const firebaseUrl = await uploadImageToFirebase(uri);
        uploadedUrls.push(firebaseUrl);
      }

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

  useEffect(() => {
    if (isFromDuplicateSell || !plantCode || isFromDraftSell) {
      const unsubscribeNav = navigation.addListener('beforeRemove', e => {
        if (isManuallyNavigating.current) {
          // Allow navigation without confirmation
          return;
        }

        if (onGobackModalVisible) {
          return;
        }

        e.preventDefault(); // Block default behavior
        setBlockNavEvent(e);
        setOnGobackModalVisible(true);
      });

      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        () => {
          if (onGobackModalVisible) return true;

          setOnGobackModalVisible(true);
          return true;
        },
      );

      return () => {
        unsubscribeNav();
        backHandler.remove();
      };
    }
  }, [navigation, onGobackModalVisible]);

  const handleConfirmExit = () => {
    setOnGobackModalVisible(false);
    if (blockNavEvent) {
      blockNavEvent?.preventDefault(); // just in case
      blockNavEvent?.target && navigation.dispatch(blockNavEvent.data.action); // proceed with original back
    } else {
      navigation.goBack(); // fallback
    }
  };

  const handleCancelExit = () => {
    setOnGobackModalVisible(false);
    setBlockNavEvent(null);
  };
  // On go back

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

  return (
    <ScrollView style={styles.mainContent}>
      {loading && (
        <Modal transparent animationType="fade">
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#699E73" />
          </View>
        </Modal>
      )}
      <View style={styles.formContainer}>
        <View style={[{paddingBottom: 10}]}>
          <Text style={[globalStyles.textLGGreyDark, {paddingBottom: 5}]}>
            Genus <Text style={globalStyles.textXSRed}>*</Text>
          </Text>
          <InputDropdown
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
          <InputDropdown
            options={dropdownOptionSpecies}
            selectedOption={selectedSpecies}
            onSelect={handleSpeciesChange}
            placeholder="Choose an option"
          />
        </View>
        <View style={[{paddingBottom: 20}]}>
          <Text style={[globalStyles.textLGGreyDark, {paddingBottom: 5}]}>
            Variegation <Text style={globalStyles.textXSRed}>*</Text>
          </Text>
          <InputDropdown
            options={dropdownOptionVariegation}
            selectedOption={selectedVariegation}
            onSelect={setSelectedVariegation}
            placeholder="Choose an option"
            disabled={dropdownVariegationDisable}
          />
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
        style={[styles.formContainer, {display: isChecked ? 'flex' : 'none'}]}>
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
                <Text style={globalStyles.primaryButtonText}>Publish Now</Text>
              </TouchableOpacity>

              <View style={[styles.loginAccountContainer, {paddingTop: 10}]}>
                <TouchableOpacity
                  onPress={() => onPressUpdate('Scheduled')}
                  style={globalStyles.secondaryButtonAccent}>
                  <Text
                    style={[globalStyles.textLGAccent, {textAlign: 'center'}]}>
                    Publish on Nursery Drop
                  </Text>
                </TouchableOpacity>
              </View>
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

                <View style={[styles.loginAccountContainer, {paddingTop: 10}]}>
                  <TouchableOpacity
                    onPress={onPressPublishNurseryDrop}
                    style={globalStyles.secondaryButtonAccent}>
                    <Text
                      style={[
                        globalStyles.textLGAccent,
                        {textAlign: 'center'},
                      ]}>
                      Publish on Nursery Drop
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

          {isFromDuplicateSell == true && (
            <>
              <TouchableOpacity
                style={globalStyles.primaryButton}
                onPress={onPressPublish}>
                <Text style={globalStyles.primaryButtonText}>Publish Now</Text>
              </TouchableOpacity>

              <View style={[styles.loginAccountContainer, {paddingTop: 10}]}>
                <TouchableOpacity
                  onPress={onPressPublishNurseryDrop}
                  style={globalStyles.secondaryButtonAccent}>
                  <Text
                    style={[globalStyles.textLGAccent, {textAlign: 'center'}]}>
                    Publish on Nursery Drop
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
      <SellConfirmDraft
        visible={onGobackModalVisible}
        onConfirm={onPressSave}
        onExit={handleConfirmExit}
        onCancel={handleCancelExit}
      />
    </ScrollView>
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

export default ScreenSingleSell;
