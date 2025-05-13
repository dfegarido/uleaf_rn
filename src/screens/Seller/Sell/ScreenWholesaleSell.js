import React, {useLayoutEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  Dimensions,
  ScrollView,
  StyleSheet,
} from 'react-native';
import {globalStyles} from '../../../assets/styles/styles';
import {
  InputBox,
  InputDropdown,
  InputCheckBox,
} from '../../../components/Input';
import {ImagePickerModal} from '../../../components/ImagePicker';
import ActionSheet from '../../../components/ActionSheet/ActionSheet';

import QuestionIcon from '../../../assets/icons/accent/question-regular.svg';
import ArrowUpIcon from '../../../assets/icons/accent/arrow-up-right-regular.svg';
import PlusIcon from '../../../assets/icons/white/plus-regular.svg';
import EditNoteIcon from '../../../assets/icons/greydark/edit-note.svg';
import TrashRedIcon from '../../../assets/icons/red/trash.svg';

const screenWidth = Dimensions.get('window').width;

const ScreenSingleWholesale = ({navigation}) => {
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={() => alert('Edit Profile')} color="#000">
          <Text style={globalStyles.textLGAccent}>Save</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const [showSheet, setShowSheet] = useState(false);
  const [selectedGenus, setSelectedGenus] = useState('');
  const [selectedSpecies, setSelectedSpecies] = useState('');
  const [selectedVariegation, setSelectedVariegation] = useState('');
  const [selectedMutation, setSelectedMutation] = useState('');
  const [isChecked, setIsChecked] = useState(false);
  const [images, setImages] = useState([]);
  const [imagesPotSize, setImagesPotSize] = useState([]);
  const [selectedPotSize, setSelectPotSize] = useState('1');
  const [selectedMeasure, setSelectMeasure] = useState('below');
  const [potPrice, setPotPrice] = useState('');
  const [potQuantity, setPotQuantity] = useState('');
  const [potSizeList, setPotSizeList] = useState([]);

  const handleImagePicked = uris => setImages(uris);
  const handleImagePickedPotSize = uris => setImagesPotSize(uris);
  const onpressSelectPotsize = ({size}) => setSelectPotSize(size);
  const onpressSelectAboveBelow = ({measure}) => setSelectMeasure(measure);

  const openSheet = sheetOpen => setShowSheet(!sheetOpen);

  const onPressPublish = () => {
    console.log('publish');
  };

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
      alert('Please complete all pot size fields.');
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

  return (
    <ScrollView style={styles.mainContent}>
      {/* ...Genus, Species, Variegation, Request... */}
      <View style={styles.formContainer}>
        <View style={[{paddingBottom: 10}]}>
          <Text style={[globalStyles.textLGGreyDark, {paddingBottom: 5}]}>
            Genus
          </Text>
          <InputDropdown
            options={['Option 1', 'Option 2', 'Option 3']}
            selectedOption={selectedGenus}
            onSelect={setSelectedGenus}
            placeholder="Choose an option"
          />
        </View>
        <View style={[{paddingBottom: 10}]}>
          <Text style={[globalStyles.textLGGreyDark, {paddingBottom: 5}]}>
            Species
          </Text>
          <InputDropdown
            options={['Option 1', 'Option 2', 'Option 3']}
            selectedOption={selectedSpecies}
            onSelect={setSelectedSpecies}
            placeholder="Choose an option"
          />
        </View>
        <View style={[{paddingBottom: 20}]}>
          <Text style={[globalStyles.textLGGreyDark, {paddingBottom: 5}]}>
            Variegation
          </Text>
          <InputDropdown
            options={['Option 1', 'Option 2', 'Option 3']}
            selectedOption={selectedVariegation}
            onSelect={setSelectedVariegation}
            placeholder="Choose an option"
          />
        </View>
        <Text style={[globalStyles.textMDGrayDark, {paddingBottom: 5}]}>
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
        <Text style={[globalStyles.textMDGrayDark, {paddingBottom: 5}]}>
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
        <Text style={[globalStyles.textMDGrayDark, {paddingBottom: 5}]}>
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
        <Text style={[globalStyles.textMDGrayDark, {paddingBottom: 10}]}>
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
                    <Text style={globalStyles.textLGGreyDark}>
                      {item.size === 1 ? `2"-4"` : `5"-8"`}
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
                Publish to nursery drop
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
          <Text style={[globalStyles.textXLPrimaryDark, {paddingBottom: 30}]}>
            Add pot size
          </Text>

          {/* Pot image */}
          <Text style={[globalStyles.textMDGrayDark, {paddingBottom: 5}]}>
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
          <Text style={[globalStyles.textMDGrayDark, {marginTop: 20}]}>
            Pot Size
          </Text>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginVertical: 10,
            }}>
            {[1, 2].map(size => (
              <TouchableOpacity
                key={size}
                onPress={() => onpressSelectPotsize({size})}>
                <View
                  style={
                    selectedPotSize == size
                      ? styles.cardSelectionSelected
                      : styles.cardSelection
                  }>
                  <Text style={globalStyles.textMDGrayDark}>
                    {size == 1 ? `2"-4"` : `5"-8"`}
                  </Text>
                  <Text style={globalStyles.textSMGreyLight}>
                    {size == 1 ? '5 - 11 cm' : '12 - 20 cm'}
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
                  <Text style={globalStyles.textMDGrayDark}>
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

export default ScreenSingleWholesale;
