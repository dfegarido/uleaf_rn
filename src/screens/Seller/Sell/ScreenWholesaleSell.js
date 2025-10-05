import React, {
  useLayoutEffect,
  useState,
  useEffect,
  useRef,
  useContext,
} from 'react';
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
  InputDropdownSearch,
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
  postSellWholesaleOrGrowersPlantApi,
  getMutationApi,
  getListingDetails,
  postSellUpdateApi,
  uploadMultipleImagesToBackend,
} from '../../../components/Api';
import NetInfo from '@react-native-community/netinfo';
import {retryAsync} from '../../../utils/utils';
import SellConfirmDraft from './components/SellConfirmDraft';
import {AuthContext} from '../../../auth/AuthProvider';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import QuestionIcon from '../../../assets/icons/accent/question-regular.svg';
import ArrowUpIcon from '../../../assets/icons/accent/arrow-up-right-regular.svg';
import PlusIcon from '../../../assets/icons/white/plus-regular.svg';
import EditNoteIcon from '../../../assets/icons/greydark/edit-note.svg';
import TrashRedIcon from '../../../assets/icons/red/trash.svg';
import LeftIcon from '../../../assets/icons/greylight/caret-left-regular.svg';

const potSizes = [
  {label: '2"-4"', description: '5 - 11 cm'},
  {label: '5"-8"', description: '12 - 20 cm'},
];

const screenWidth = Dimensions.get('window').width;

import {useNavigationState} from '@react-navigation/native';

const ScreenSingleWholesale = ({navigation, route}) => {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);

  const routes = useNavigationState(state => state.routes);
  const previousRoute = routes[routes.length - 2]; // Previous screen
  const isFromDuplicateSell = previousRoute?.name === 'ScreenDuplicateSell';
  const isFromDraftSell = previousRoute?.name === 'ScreenDraftSell';

  const {userInfo} = useContext(AuthContext);

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
    //   getVariegationApiData.data.length == 0 ? true : false,
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

    console.log(getMutationApiData.data);
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
  const handleGenusChange = async genus => {
    setSelectedGenus(genus);
    // setTimeout(() => setLoading(true), 300);
    try {
      await loadSpeciesData(genus); // fetch and update species dropdown
    } catch (error) {
      console.error('Error loading species data:', error.message);
      // Optionally show error to user
    } finally {
      // setLoading(false);
    }
  };
  // Dropdown Genus

  // Dropdown Species
  const handleSpeciesChange = async species => {
    setSelectedSpecies(species);
    // setTimeout(() => setLoading(true), 300);
    try {
      await loadVariegationData(selectedGenus, species); // fetch and update species dropdown
    } catch (error) {
      console.error('Error loading species data:', error.message);
      // Optionally show error to user
    } finally {
      // setLoading(false);
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

  const handleImagePicked = uris => {
    setImages(prevImages => [...prevImages, ...uris]); // Append new images
    console.log('Appended URIs:', uris);
  };
  const removeImage = indexToRemove => {
    setImages(prevImages =>
      prevImages.filter((_, index) => index !== indexToRemove),
    );
  };
  const handleImagePickedPotSize = uris => setImagesPotSize(uris);
  const onpressSelectPotsize = size => setSelectPotSize(size);
  const onpressSelectAboveBelow = ({measure}) => setSelectMeasure(measure);

  const openSheet = sheetOpen => setShowSheet(!sheetOpen);

  const [userCurrency, setUserCurrency] = useState('');

  const onPressSavePotSize = () => {
    console.log(userInfo);

    const newPotSize = {
      id: idVariation,
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

    if (newPotSize.price == 0) {
      Alert.alert('Invalid Price', 'Price cannot be zero.');
      return;
    }

    if (newPotSize.quantity == 0) {
      Alert.alert('Invalid Quantity', 'Quantity cannot be zero.');
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
    setSelectPotSize('2"-4"');
    setPotPrice('');
    setPotQuantity('');
    setSelectMeasure('below');
    setIsEditing(false);
    setEditingIndex(null);
  };

  const [isEditing, setIsEditing] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [idVariation, setIdVariation] = useState(null);

  const handleEdit = item => {
    const index = potSizeList.findIndex(pot => pot === item);
    if (index !== -1) {
      setIdVariation(item.id);
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
    // if (!selectedVariegation) errors.push('Variegation is required.');
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
    setLoading(true);
    try {
      // Upload main listing images to Backend API
      console.log('📤 Uploading', images.length, 'main images to backend...');
      const uploadedMainImageUrls = await uploadMultipleImagesToBackend(images);
      console.log('✅ Main images uploaded:', uploadedMainImageUrls);

      // Upload variation images to Backend API
      console.log('📤 Uploading', potSizeList.length, 'variation images to backend...');
      const uploadedPotSizeList = await Promise.all(
        potSizeList.map(async item => {
          const imageUrl = await uploadMultipleImagesToBackend([item.image]);
          return {
            ...item,
            image: imageUrl[0], // Get first (and only) URL from array
          };
        }),
      );
      console.log('✅ Variation images uploaded');

      // Build JSON payload
      const data = {
        listingType: 'Wholesale',
        genus: selectedGenus || null,
        species: selectedSpecies || null,
        variegation: selectedVariegation || null,
        isMutation: isChecked,
        mutation: isChecked ? selectedMutation : null,
        imagePrimary:
          uploadedMainImageUrls.length > 0 ? uploadedMainImageUrls[0] : null,
        imageCollection: uploadedMainImageUrls,
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

      const response = await postSellWholesaleOrGrowersPlantApi(data);

      if (!response?.success) {
        throw new Error(response?.message || 'Publish now failed.');
      }

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
  // Publish Now

  // Publish on Nursery Drop
  const onPressPublishNurseryDrop = async () => {
    const errors = validateForm();
    if (errors.length > 0) {
      Alert.alert('Validation Error', errors.join('\n'));
      return;
    }
    setLoading(true);
    try {
      // Upload main listing images to Backend API
      console.log('📤 Uploading', images.length, 'main images to backend...');
      const uploadedMainImageUrls = await uploadMultipleImagesToBackend(images);
      console.log('✅ Main images uploaded:', uploadedMainImageUrls);

      // Upload variation images to Backend API
      console.log('📤 Uploading', potSizeList.length, 'variation images to backend...');
      const uploadedPotSizeList = await Promise.all(
        potSizeList.map(async item => {
          const imageUrl = await uploadMultipleImagesToBackend([item.image]);
          return {
            ...item,
            image: imageUrl[0], // Get first (and only) URL from array
          };
        }),
      );
      console.log('✅ Variation images uploaded');

      // Build JSON payload
      const data = {
        listingType: 'Wholesale',
        genus: selectedGenus || null,
        species: selectedSpecies || null,
        variegation: selectedVariegation || null,
        isMutation: isChecked,
        mutation: isChecked ? selectedMutation : null,
        imagePrimary:
          uploadedMainImageUrls.length > 0 ? uploadedMainImageUrls[0] : null,
        imageCollection: uploadedMainImageUrls,
        potSize: null,
        localPrice: null,
        approximateHeight: null,
        status: 'Scheduled',
        publishType: 'Publish on Nursery Drop',
        variation: uploadedPotSizeList.map(item => ({
          imagePrimary: item.image,
          potSize: item.size,
          localPrice: Number(item.price),
          availableQty: Number(item.quantity),
          approximateHeight:
            item.measure === 'below' ? 'Below 12 inches' : '12 inches & above',
        })),
      };

      const response = await postSellWholesaleOrGrowersPlantApi(data);

      if (!response?.success) {
        throw new Error(response?.message || 'Publish on nursery drop failed.');
      }

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
  // Publish on Nursery Drop

  // Save as draft
  const onPressSave = async () => {
    // const errors = validateForm();
    // if (errors.length > 0) {
    //   Alert.alert('Validation Error', errors.join('\n'));
    //   return;
    // }
    setLoading(true);
    try {
      // Upload main listing images to Backend API
      console.log('📤 Uploading', images.length, 'main images to backend...');
      const uploadedMainImageUrls = await uploadMultipleImagesToBackend(images);
      console.log('✅ Main images uploaded:', uploadedMainImageUrls);

      // Upload variation images to Backend API
      console.log('📤 Uploading', potSizeList.length, 'variation images to backend...');
      const uploadedPotSizeList = await Promise.all(
        potSizeList.map(async item => {
          const imageUrl = await uploadMultipleImagesToBackend([item.image]);
          return {
            ...item,
            image: imageUrl[0], // Get first (and only) URL from array
          };
        }),
      );
      console.log('✅ Variation images uploaded');

      // Build JSON payload
      const data = {
        listingType: 'Wholesale',
        genus: selectedGenus || null,
        species: selectedSpecies || null,
        variegation: selectedVariegation || null,
        isMutation: isChecked,
        mutation: isChecked ? selectedMutation : null,
        imagePrimary:
          uploadedMainImageUrls.length > 0 ? uploadedMainImageUrls[0] : null,
        imageCollection: uploadedMainImageUrls,
        potSize: null,
        localPrice: 0,
        approximateHeight: null,
        status: 'Draft',
        publishType: '',
        variation: uploadedPotSizeList.map(item => ({
          imagePrimary: item.image,
          potSize: item.size,
          localPrice: Number(item.price),
          availableQty: Number(item.quantity),
          approximateHeight:
            item.measure === 'below' ? 'Below 12 inches' : '12 inches & above',
        })),
      };

      const response = await postSellWholesaleOrGrowersPlantApi(data);

      if (!response?.success) {
        throw new Error(response?.message || 'Save failed.');
      }

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

    const newPotSize = res.data.variations.map(variation => ({
      // id: variation.id,
      id: variation.id,
      image: variation.imagePrimary ?? null,
      size: variation.potSize ?? '',
      price: variation.localPrice ?? 0,
      quantity: variation.availableQty ?? 0,
      measure: variation.approximateHeight ?? '', // if 'measure' refers to height
    }));

    setPotSizeList(newPotSize);
  };

  const onPressUpdate = async paramStatus => {
    const errors = validateForm();
    if (errors.length > 0) {
      Alert.alert('Validation Error', errors.join('\n'));
      return;
    }
    setLoading(true);
    try {
      // Upload main listing images to Backend API
      console.log('📤 Uploading', images.length, 'main images to backend...');
      const uploadedMainImageUrls = await uploadMultipleImagesToBackend(images);
      console.log('✅ Main images uploaded:', uploadedMainImageUrls);

      // Upload variation images to Backend API
      console.log('📤 Uploading', potSizeList.length, 'variation images to backend...');
      const uploadedPotSizeList = await Promise.all(
        potSizeList.map(async item => {
          const imageUrl = await uploadMultipleImagesToBackend([item.image]);
          return {
            ...item,
            image: imageUrl[0], // Get first (and only) URL from array
          };
        }),
      );
      console.log('✅ Variation images uploaded');

      // Build JSON payload
      const data = {
        plantCode: plantCode,
        listingType: 'Wholesale',
        genus: selectedGenus || null,
        species: selectedSpecies || null,
        variegation: selectedVariegation || null,
        isMutation: isChecked,
        mutation: isChecked ? selectedMutation : null,
        imagePrimary:
          uploadedMainImageUrls.length > 0 ? uploadedMainImageUrls[0] : null,
        imageCollection: uploadedMainImageUrls,
        potSize: null,
        localPrice: null,
        approximateHeight: null,
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
        variation: uploadedPotSizeList.map(item => ({
          id: item.id,
          imagePrimary: item.image,
          potSize: item.size,
          localPrice: Number(item.price),
          availableQty: Number(item.quantity),
          approximateHeight:
            item.measure === 'below' ? 'Below 12 inches' : '12 inches & above',
        })),
      };

      const response = await postSellUpdateApi(data);

      if (!response?.success) {
        throw new Error(response?.message || 'Update listing failed.');
      }

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
    <View
      style={[
        styles.mainContent,
        {paddingTop: insets.top + 10, paddingBottom: insets.bottom},
      ]}>
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
          onPress={() => navigation.goBack()}
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
          Wholesale
        </Text>
        {/* {(isFromDuplicateSell || !plantCode || isFromDraftSell) && (
          <TouchableOpacity onPress={onPressSave} style={styles.iconButton}>
            <Text style={globalStyles.textLGAccent}>Save</Text>
          </TouchableOpacity>
        )} */}
        {isFromDuplicateSell || !plantCode || isFromDraftSell ? (
          <TouchableOpacity onPress={onPressSave} style={styles.iconButton}>
            <Text style={globalStyles.textLGAccent}>Save</Text>
          </TouchableOpacity>
        ) : (
          <Text>{''}</Text> // empty string element
        )}
      </View>
      <ScrollView
        style={styles.mainContent}
        contentContainerStyle={{
          paddingBottom: insets.bottom,
        }}>
        {loading && (
          <Modal transparent animationType="fade">
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#699E73" />
            </View>
          </Modal>
        )}
        {/* ...Genus, Species, Variegation, Request... */}
        <View style={styles.formContainer}>
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
              placeholder="Choose an option"
            />
          </View>
          <View style={[{paddingBottom: 20}]}>
            <Text style={[globalStyles.textLGGreyDark, {paddingBottom: 5}]}>
              Variegation <Text style={globalStyles.textXSRed}>*</Text>
            </Text>
            <InputDropdownSearch
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
        {/* Mutations */}
        <View style={styles.formContainer}>
          <Text style={[globalStyles.textMDGreyDark, {paddingBottom: 5}]}>
            Is this a mutation?
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
              options={dropdownOptionMutation}
              selectedOption={selectedMutation}
              onSelect={setSelectedMutation}
              placeholder="Choose an option"
            />
          </View>
        )}

        {/* Main Image Upload */}
        <View style={styles.formContainer}>
          <Text style={[globalStyles.textMDGreyDark, {paddingBottom: 5}]}>
            Picture/s <Text style={globalStyles.textXSRed}>*</Text>
          </Text>
          {images.length > 0 && (
            <FlatList
              data={images}
              keyExtractor={(uri, index) => index.toString()}
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
            Pot Size <Text style={globalStyles.textXSRed}>*</Text>
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
                      <Text style={globalStyles.textLGGreyDark}>
                        {item.size}
                      </Text>
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
                      {userCurrency} {item.price}
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

                <View style={[styles.loginAccountContainer, {paddingTop: 10}]}>
                  <TouchableOpacity
                    onPress={() => onPressUpdate('Scheduled')}
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

                  <View
                    style={[styles.loginAccountContainer, {paddingTop: 10}]}>
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
              Select picture <Text style={globalStyles.textXSRed}>*</Text>
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
            <ImagePickerModal
              onImagePicked={handleImagePickedPotSize}
              limit={1}
            />
            <Text style={[globalStyles.textSMGreyLight, {textAlign: 'center'}]}>
              Take a photo(camera) or select from your library
            </Text>

            {/* Size options */}
            <Text style={[globalStyles.textMDGreyDark, {marginTop: 20}]}>
              Pot Size <Text style={globalStyles.textXSRed}>*</Text>
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
              Local Price <Text style={globalStyles.textXSRed}>*</Text>
            </Text>
            <InputBox
              value={potPrice}
              setValue={setPotPrice}
              placeholder={'Enter price'}
            />
            <Text style={[globalStyles.textLGGreyDark, {paddingTop: 10}]}>
              Quantity <Text style={globalStyles.textXSRed}>*</Text>
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
              Approximate Height <Text style={globalStyles.textXSRed}>*</Text>
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
                        : '12 inches & above'}
                    </Text>
                    <Text style={globalStyles.textSMGreyLight}>
                      {measure === 'below' ? '<30 cm' : '>=30 cm'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
            <Text
              style={[
                globalStyles.textSMGreyLight,
                {paddingTop: 10, paddingBottom: 30},
              ]}>
              For shipping costs calculations only.
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
        <SellConfirmDraft
          visible={onGobackModalVisible}
          onConfirm={onPressSave}
          onExit={handleConfirmExit}
          onCancel={handleCancelExit}
        />
      </ScrollView>
    </View>
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

export default ScreenSingleWholesale;
