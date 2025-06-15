import React, {useLayoutEffect, useState, useEffect} from 'react';
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
} from '../../../components/Api';
import {getApp} from '@react-native-firebase/app';
import {getAuth} from '@react-native-firebase/auth';
import NetInfo from '@react-native-community/netinfo';
import {retryAsync} from '../../../utils/utils';
import {uploadImageToFirebase} from '../../../utils/uploadImageToFirebase';

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
    label: 'Above 12 inches',
    subLabel: '>30 cm',
    value: 'above',
  },
];

const ScreenSingleSell = ({navigation, route}) => {
  const app = getApp();
  const auth = getAuth(app);
  const [loading, setLoading] = useState(false);

  useLayoutEffect(() => {
    if (plantCode) return; // If plantCode is set, do not show Save button

    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={onPressSave} color="#000">
          <Text style={globalStyles.textLGAccent}>Save</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, plantCode]);

  // Dropdown
  const [dropdownOptionGenus, setDropdownOptionGenus] = useState([]);
  const [dropdownOptionSpecies, setDropdownOptionSpecies] = useState([]);
  const [dropdownOptionVariegation, setDropdownOptionVariegation] = useState(
    [],
  );
  const [dropdownOptionMutation, setDropdownOptionMutation] = useState([]);

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

    console.log;
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

    // const getSpeciesApiData = await getSellSpeciesApi(genus);
    const getSpeciesApiData = await getSpeciesApi(genus);
    // Check if API indicates failure
    if (!getSpeciesApiData?.success) {
      throw new Error(getSpeciesApiData?.message || 'Failed to load species');
    }
    // Extract sort option names as label/value pairs
    let localSpeciesData = getSpeciesApiData.data.map(item => item.name);
    // Set options
    setDropdownOptionSpecies(localSpeciesData);
  };

  const loadVariegationData = async (genus, species) => {
    let netState = await NetInfo.fetch();
    if (!netState.isConnected || !netState.isInternetReachable) {
      throw new Error('No internet connection.');
    }

    const getVariegationApiData = await getVariegationApi(genus, species);
    // const getVariegationApiData = await getSellVariegationApi(genus, species);
    // Check if API indicates failure
    if (!getVariegationApiData?.success) {
      throw new Error(
        getVariegationApiData?.message || 'Failed to load variegation',
      );
    }
    // Extract sort option names as label/value pairs
    let localVariegationData = getVariegationApiData.data.map(
      item => item.name,
    );
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

    console.log(getMutationApiData.data);
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
    console.log('Selected Genus:', genus);

    try {
      await loadSpeciesData(genus); // fetch and update species dropdown
    } catch (error) {
      console.error('Error loading species data:', error.message);
      // Optionally show error to user
    }
  };
  // Dropdown Genus

  // Dropdown Species
  const [selectedSpecies, setSelectedSpecies] = useState('');
  const handleSpeciesChange = async species => {
    setSelectedSpecies(species);
    console.log('Selected species:', species);

    try {
      await loadVariegationData(selectedGenus, species); // fetch and update species dropdown
    } catch (error) {
      console.error('Error loading species data:', error.message);
      // Optionally show error to user
    }
  };
  // Dropdown Species

  const [selectedVariegation, setSelectedVariegation] = useState('');

  const [localPrice, setLocalPrice] = useState('');
  const [selectedMutation, setSelectedMutation] = useState('');
  const [isChecked, setIsChecked] = useState(false);
  const [images, setImages] = useState([]);
  const handleImagePicked = uris => {
    setImages(uris); // This is an array of image URIs
    console.log(uris);
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
    if (!localPrice || isNaN(localPrice))
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
          selectedMeasure === 'below' ? 'Below 12 inches' : 'Above 12 inches',
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

      Alert.alert('Publish Now', 'Listing published successfully!');
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
          selectedMeasure === 'below' ? 'Below 12 inches' : 'Above 12 inches',
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

      Alert.alert(
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
          selectedMeasure === 'below' ? 'Below 12 inches' : 'Above 12 inches',
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

      Alert.alert('Save', 'Listing saved successfully!');
    } catch (error) {
      console.error('Upload or submission failed:', error);
      Alert.alert('Save', error.message);
    } finally {
      setLoading(false);
    }
  };
  // Save as draft

  // Details
  const {plantCode = ''} = route?.params ?? {};
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
    setImages(res.data.imageCollection || []);
    setLocalPrice(String(res.data.localPrice ?? ''));
    setSelectPotSize(res.data.potSize || null);
    setSelectMeasure(
      res.data.approximateHeight === 'Below 12 inches'
        ? 'below'
        : 'above' || null,
    );

    // console.log(res.data);
    // setSwitchActive(res.data.status == 'Active' ? true : false);
    // setListingData(res.data);
  };

  const onPressUpdate = () => {};
  // Details

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
            Genus
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
            Species
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
            Variegation
          </Text>
          <InputDropdown
            options={dropdownOptionVariegation}
            selectedOption={selectedVariegation}
            onSelect={setSelectedVariegation}
            placeholder="Choose an option"
          />
        </View>
        <Text style={[globalStyles.textMDGreyDark, {paddingBottom: 5}]}>
          Can't find genus or specie name?
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
          Is this is a mutation?
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
          Picture/s
        </Text>
        {images.length > 0 && (
          <>
            <Text style={styles.label}>Selected Images:</Text>
            <FlatList
              data={images}
              keyExtractor={(uri, index) => index.toString()}
              renderItem={({item}) => (
                <Image source={{uri: item}} style={styles.image} />
              )}
              horizontal
            />
          </>
        )}
        <ImagePickerModal onImagePicked={handleImagePicked} />
        <Text style={[globalStyles.textSMGreyLight, {textAlign: 'center'}]}>
          Take a photo(camera) or select from your library
        </Text>
      </View>
      <View style={styles.formContainer}>
        <Text style={[globalStyles.textMDGreyDark]}>Pot Size</Text>
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
              Local Price
            </Text>
            <InputBox
              placeholder={'Enter price'}
              value={localPrice}
              setValue={setLocalPrice}></InputBox>
          </View>
          <View style={{marginTop: 10}}>
            <Text style={globalStyles.textLGGreyDark}>Approximate Height</Text>
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
            For shipping calculation use.
          </Text>
        </View>
        <View style={{paddingTop: 30}}>
          <TouchableOpacity
            style={globalStyles.primaryButton}
            onPress={plantCode ? onPressUpdate : onPressPublish}>
            <Text style={globalStyles.primaryButtonText}>
              {plantCode ? 'Update Listing' : 'Publish Now'}
            </Text>
          </TouchableOpacity>
          <View style={[styles.loginAccountContainer, {paddingTop: 10}]}>
            {!plantCode && (
              <TouchableOpacity
                onPress={onPressPublishNurseryDrop}
                style={globalStyles.secondaryButtonAccent}>
                <Text
                  style={[globalStyles.textLGAccent, {textAlign: 'center'}]}>
                  Publish on Nursery Drop
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
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
});

export default ScreenSingleSell;
