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
} from 'react-native';
import {globalStyles} from '../../../assets/styles/styles';
import {
  InputBox,
  InputDropdown,
  InputCheckBox,
} from '../../../components/Input';
import {ImagePickerModal} from '../../../components/ImagePicker';
import ActionSheet from '../../../components/ActionSheet/ActionSheet';
import {
  // getGenusApi,
  getSpeciesApi,
  getVariegationApi,
  getSellGenusApi,
  getSellSpeciesApi,
  getSellVariegationApi,
} from '../../../components/Api';
import {getApp} from '@react-native-firebase/app';
import {getAuth} from '@react-native-firebase/auth';
import NetInfo from '@react-native-community/netinfo';
import {retryAsync} from '../../../utils/utils';
import {uploadImageToFirebase} from '../../../utils/uploadImageToFirebase';

import QuestionIcon from '../../../assets/icons/accent/question-regular.svg';
import ArrowUpIcon from '../../../assets/icons/accent/arrow-up-right-regular.svg';
import PlusIcon from '../../../assets/icons/white/plus-regular.svg';
import EditNoteIcon from '../../../assets/icons/greydark/edit-note.svg';
import TrashRedIcon from '../../../assets/icons/red/trash.svg';

const potSizes = [
  {label: '2"-4"', description: '5 - 11 cm'},
  {label: '5"-8"', description: '12 - 20 cm'},
];

const screenWidth = Dimensions.get('window').width;

const ScreenGrowersSell = ({navigation}) => {
  const app = getApp();
  const auth = getAuth(app);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={() => alert('Edit Profile')} color="#000">
          <Text style={globalStyles.textLGAccent}>Save</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  // Dropdown
  const [dropdownOptionGenus, setDropdownOptionGenus] = useState([]);
  const [dropdownOptionSpecies, setDropdownOptionSpecies] = useState([]);
  const [dropdownOptionVariegation, setDropdownOptionVariegation] = useState(
    [],
  );
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

  useEffect(() => {
    const fetchData = async () => {
      const currentUser = auth.currentUser;

      if (currentUser) {
        try {
          const token = await currentUser.getIdToken();
          await loadGenusData(token);
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

  const [showSheet, setShowSheet] = useState(false);
  const [selectedGenus, setSelectedGenus] = useState('');
  const [selectedSpecies, setSelectedSpecies] = useState('');
  const [selectedVariegation, setSelectedVariegation] = useState('');
  const [selectedMutation, setSelectedMutation] = useState('');
  const [isChecked, setIsChecked] = useState(false);
  const [images, setImages] = useState([]);
  const [imagesPotSize, setImagesPotSize] = useState([]);
  const [selectedPotSize, setSelectPotSize] = useState('2"-4"');
  const [selectedMeasure, setSelectMeasure] = useState('below');
  const [potPrice, setPotPrice] = useState('');
  const [potQuantity, setPotQuantity] = useState('');
  const [potSizeList, setPotSizeList] = useState([]);

  const handleImagePicked = uris => setImages(uris);
  const handleImagePickedPotSize = uris => setImagesPotSize(uris);
  const onpressSelectPotsize = ({size}) => setSelectPotSize(size);
  const onpressSelectAboveBelow = ({measure}) => setSelectMeasure(measure);

  const openSheet = sheetOpen => setShowSheet(!sheetOpen);

  const onPressPublishNurseryDrop = () => {
    console.log('publish nursery drop');
  };

  const onPressSavePotSize = () => {
    const newPotSize = {
      image: imagesPotSize?.[0] ?? null,
      size: selectedPotSize,
      price: potPrice,
      quantity: potQuantity,
      measure: selectedMeasure,
    };

    if (!newPotSize.image || !newPotSize.price || !newPotSize.quantity) {
      Alert.alert('Please complete all pot size fields.');
      return;
    }

    if (isEditing && editingIndex !== null) {
      const updatedList = [...potSizeList];
      updatedList[editingIndex] = newPotSize;
      setPotSizeList(updatedList);
    } else {
      setPotSizeList(prev => [...prev, newPotSize]);
    }

    setShowSheet(false);
    setImagesPotSize([]);
    setSelectPotSize('1');
    setPotPrice('');
    setPotQuantity('');
    setSelectMeasure('below');
    setIsEditing(false);
    setEditingIndex(null);
  };

  const [isEditing, setIsEditing] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);

  const handleEdit = item => {
    const index = potSizeList.findIndex(pot => pot === item);
    if (index !== -1) {
      setEditingIndex(index);
      setImagesPotSize(item.image ? [item.image] : []);
      setSelectPotSize(item.size);
      setPotPrice(item.price);
      setPotQuantity(item.quantity);
      setSelectMeasure(item.measure);
      setIsEditing(true);
      setShowSheet(true);
    }
  };

  const handleDelete = item => {
    const updatedList = potSizeList.filter(pot => pot !== item);
    setPotSizeList(updatedList);
  };

  // Form validation
  const validateForm = () => {
    let errors = [];

    if (!selectedGenus) errors.push('Genus is required.');
    if (!selectedSpecies) errors.push('Species is required.');
    if (!selectedVariegation) errors.push('Variegation is required.');
    if (isChecked && !selectedMutation)
      errors.push('Mutation type must be selected.');
    if (images.length === 0) errors.push('At least one image is required.');
    if (potSizeList.length === 0)
      errors.push('At least one pot size is required.');

    // Check each pot entry for required fields
    potSizeList.forEach((item, index) => {
      if (!item.price || isNaN(item.price))
        errors.push(`Pot size ${index + 1}: valid local price is required.`);
      if (!item.size) errors.push(`Pot size ${index + 1}: size is required.`);
      if (!item.quantity || isNaN(item.quantity))
        errors.push(`Pot size ${index + 1}: valid quantity is required.`);
      if (!item.measure)
        errors.push(`Pot size ${index + 1}: height is required.`);
    });

    return errors;
  };
  // Form validation

  // Publish Now
  const onPressPublish = async () => {
    const errors = validateForm();
    if (errors.length > 0) {
      Alert.alert('Validation Error', errors.join('\n'));
      return;
    }

    try {
      // Upload main listing images
      const uploadedMainImageUrls = [];
      for (const uri of images) {
        const firebaseUrl = await uploadImageToFirebase(uri);
        uploadedMainImageUrls.push(firebaseUrl);
      }

      // Upload variation images
      const uploadedPotSizeList = await Promise.all(
        potSizeList.map(async item => {
          const imageUrl = await uploadImageToFirebase(item.image);
          return {
            ...item,
            image: imageUrl,
          };
        }),
      );

      // Build JSON payload
      const data = {
        listingType: "Grower's Choice",
        genus: selectedGenus || null,
        species: selectedSpecies || null,
        variegation: selectedVariegation || null,
        isMutation: isChecked,
        mutation: isChecked ? selectedMutation : null,
        imagePrimary:
          uploadedMainImageUrls.length > 0 ? uploadedMainImageUrls[0] : null,
        imageCollection: uploadedMainImageUrls.slice(1),
        potSize: null,
        localPrice: null,
        approximateHeight: null,
        status: 'Active',
        publishType: 'Publish Now',
        variation: uploadedPotSizeList.map(item => ({
          imagePrimary: item.image,
          potSize: item.size,
          localPrice: Number(item.price),
          availableQty: Number(item.quantity),
          approximateHeight:
            item.measure === 'below' ? 'Below 12 inches' : '12 inches & above',
        })),
      };

      console.log('✅ Submitting listing:', JSON.stringify(data, null, 2));

      // TODO: Replace this with your actual API call
      // await submitListing(data);

      Alert.alert('Publish Now', 'Listing published successfully!');
    } catch (error) {
      console.error('Upload or submission failed:', error);
      Alert.alert(
        'Publish Now',
        'Failed to upload images or submit listing. Please try again.',
      );
    }
  };
  // Publish Now

  return (
    <ScrollView style={styles.mainContent}>
      {/* ...Genus, Species, Variegation, Request... */}
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
      {/* Mutations */}
      <View style={styles.formContainer}>
        <Text style={[globalStyles.textMDGreyDark, {paddingBottom: 5}]}>
          Is this is a mutation?
        </Text>
        <InputCheckBox
          label="Yes"
          checked={isChecked}
          onChange={setIsChecked}
        />
      </View>
      {isChecked && (
        <View style={styles.formContainer}>
          <Text style={[globalStyles.textLGGreyDark, {paddingBottom: 5}]}>
            Please select one that best discribes the mutated plant
          </Text>
          <InputDropdown
            options={['Option 1', 'Option 2', 'Option 3']}
            selectedOption={selectedMutation}
            onSelect={setSelectedMutation}
            placeholder="Choose an option"
          />
        </View>
      )}

      {/* Main Image Upload */}
      <View style={styles.formContainer}>
        <Text style={[globalStyles.textMDGreyDark, {paddingBottom: 5}]}>
          Picture/s
        </Text>
        {images.length > 0 && (
          <FlatList
            data={images}
            keyExtractor={(uri, index) => index.toString()}
            renderItem={({item}) => (
              <Image source={{uri: item}} style={styles.image} />
            )}
            horizontal
          />
        )}
        <ImagePickerModal onImagePicked={handleImagePicked} />
        <Text style={[globalStyles.textSMGreyLight, {textAlign: 'center'}]}>
          Take a photo(camera) or select from your library
        </Text>
      </View>

      {/* Add Pot Size */}
      <View style={styles.formContainer}>
        <Text style={[globalStyles.textMDGreyDark, {paddingBottom: 10}]}>
          Pot Size
        </Text>
        {/* Display saved pot sizes */}
        {potSizeList.length > 0 && (
          <View style={{}}>
            {potSizeList.map((item, index) => (
              <View
                key={index}
                style={{
                  borderColor: '#CDD3D4',
                  borderWidth: 1,
                  borderRadius: 10,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  // alignItems: 'center',
                  marginBottom: 10, // Optional: spacing between list items
                }}>
                {/* Left Side: Image + Info */}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 10,
                    flex: 1,
                  }}>
                  <Image
                    source={{uri: item.image}}
                    style={{width: 80, height: 80, borderRadius: 10}}
                    resizeMode="cover"
                  />
                  <View style={{marginLeft: 10, justifyContent: 'center'}}>
                    <Text style={globalStyles.textLGGreyDark}>{item.size}</Text>
                    <Text style={globalStyles.textLGGreyLight}>
                      {item.quantity} in stocks
                    </Text>
                  </View>
                </View>

                {/* Right Side: Price + Edit Button */}
                <View
                  style={{
                    flexDirection: 'row',
                  }}>
                  <Text
                    style={[
                      globalStyles.textLGGreyLight,
                      {paddingHorizontal: 5, paddingTop: 10},
                    ]}>
                    USD {item.price}
                  </Text>
                  <View
                    style={{
                      flexDirection: 'column',
                      backgroundColor: '#F5F6F6',
                      justifyContent: 'center',
                      alignItems: 'center',
                      borderTopRightRadius: 10,
                    }}>
                    <TouchableOpacity
                      style={{
                        padding: 6,
                        borderRadius: 6,
                      }}
                      onPress={() => handleEdit(item)} // Add your edit handler
                    >
                      <EditNoteIcon width={20} height={20} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{
                        padding: 6,
                        marginTop: 10,
                        borderRadius: 6,
                      }}
                      onPress={() => handleDelete(item)} // Add your edit handler
                    >
                      <TrashRedIcon width={20} height={20} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={globalStyles.grayButton}
          onPress={() => openSheet(showSheet)}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <PlusIcon width={20} height={20} />
            <Text style={globalStyles.grayButtonText}> Add pot size</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Publish buttons */}
      <View style={styles.formContainer}>
        <View style={{paddingTop: 30}}>
          <TouchableOpacity
            style={globalStyles.primaryButton}
            onPress={onPressPublish}>
            <Text style={globalStyles.primaryButtonText}>Publish Now</Text>
          </TouchableOpacity>
          <View style={[styles.loginAccountContainer, {paddingTop: 10}]}>
            <TouchableOpacity
              onPress={onPressPublishNurseryDrop}
              style={globalStyles.secondaryButtonAccent}>
              <Text style={[globalStyles.textLGAccent, {textAlign: 'center'}]}>
                Publish on Nursery Drop
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Action Sheet */}
      <ActionSheet
        visible={showSheet}
        onClose={() => setShowSheet(false)}
        heightPercent={'80%'}>
        <ScrollView style={{padding: 20}} showsVerticalScrollIndicator>
          <Text style={[globalStyles.textXLGreyDark, {paddingBottom: 30}]}>
            Add pot size
          </Text>

          {/* Pot image */}
          <Text style={[globalStyles.textMDGreyDark, {paddingBottom: 5}]}>
            Select picture
          </Text>
          {imagesPotSize.length > 0 && (
            <FlatList
              data={imagesPotSize}
              keyExtractor={(uri, index) => index.toString()}
              renderItem={({item}) => (
                <Image source={{uri: item}} style={styles.image} />
              )}
              horizontal
            />
          )}
          <ImagePickerModal onImagePicked={handleImagePickedPotSize} />
          <Text style={[globalStyles.textSMGreyLight, {textAlign: 'center'}]}>
            Take a photo(camera) or select from your library
          </Text>

          {/* Size options */}
          <Text style={[globalStyles.textMDGreyDark, {marginTop: 20}]}>
            Pot Size
          </Text>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginVertical: 10,
            }}>
            {potSizes.map((pot, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => onpressSelectPotsize(pot.label)}>
                <View
                  style={
                    selectedPotSize === pot.label
                      ? styles.cardSelectionSelected
                      : styles.cardSelection
                  }>
                  <Text style={globalStyles.textMDGreyDark}>{pot.label}</Text>
                  <Text style={globalStyles.textSMGreyLight}>
                    {pot.description}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Price and Quantity */}
          <Text style={[globalStyles.textLGGreyDark, {paddingTop: 10}]}>
            Local Price
          </Text>
          <InputBox
            value={potPrice}
            setValue={setPotPrice}
            placeholder={'Enter price'}
          />
          <Text style={[globalStyles.textLGGreyDark, {paddingTop: 10}]}>
            Quantity
          </Text>
          <InputBox
            value={potQuantity}
            setValue={setPotQuantity}
            placeholder={'Enter quantity'}
          />
          <Text style={globalStyles.textSMGreyLight}>
            e.g, 5 quantity is equal to 50 plants
          </Text>

          {/* Height selection */}
          <Text style={[globalStyles.textLGGreyDark, {paddingTop: 20}]}>
            Approximate Height
          </Text>
          <View
            style={{
              flexDirection: 'row',
              marginTop: 10,
              justifyContent: 'space-between',
            }}>
            {['below', 'above'].map(measure => (
              <TouchableOpacity
                key={measure}
                onPress={() => onpressSelectAboveBelow({measure})}>
                <View
                  style={
                    selectedMeasure == measure
                      ? styles.cardSelectionSelectedMeasure
                      : styles.cardSelectionMeasure
                  }>
                  <Text style={globalStyles.textMDGreyDark}>
                    {measure === 'below'
                      ? 'Below 12 inches'
                      : 'Above 12 inches'}
                  </Text>
                  <Text style={globalStyles.textSMGreyLight}>
                    {measure === 'below' ? '<30 cm' : '>30 cm'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={[globalStyles.textSMGreyLight, {paddingTop: 10}]}>
            For shipping calculation use.
          </Text>
        </ScrollView>

        {/* Save button */}
        <View style={{padding: 20, backgroundColor: '#fff'}}>
          <TouchableOpacity
            style={globalStyles.primaryButton}
            onPress={onPressSavePotSize}>
            <Text style={globalStyles.primaryButtonText}>Save pot size</Text>
          </TouchableOpacity>
        </View>
      </ActionSheet>
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
    width: 0.5 * screenWidth - 25,
  },
  cardSelectionSelected: {
    alignItems: 'center',
    padding: 33,
    backgroundColor: '#FFF',
    borderColor: '#539461',
    borderWidth: 1,
    borderRadius: 10,
    width: 0.5 * screenWidth - 25,
  },
  cardSelectionMeasure: {
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 30,
    backgroundColor: '#F2F7F3',
    borderColor: '#C0DAC2',
    borderWidth: 1,
    borderRadius: 10,
    width: 0.5 * screenWidth - 25,
  },
  cardSelectionSelectedMeasure: {
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 30,
    backgroundColor: '#FFF',
    borderColor: '#539461',
    borderWidth: 1,
    borderRadius: 10,
    width: 0.5 * screenWidth - 25,
  },
});

export default ScreenGrowersSell;
