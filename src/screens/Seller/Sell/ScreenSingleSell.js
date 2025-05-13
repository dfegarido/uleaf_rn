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

import QuestionIcon from '../../../assets/icons/accent/question-regular.svg';
import ArrowUpIcon from '../../../assets/icons/accent/arrow-up-right-regular.svg';

const screenWidth = Dimensions.get('window').width;

const ScreenSingleSell = ({navigation}) => {
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={() => alert('Edit Profile')} color="#000">
          <Text style={globalStyles.textLGAccent}>Save</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const [selectedGenus, setSelectedGenus] = useState('');
  const [selectedSpecies, setSelectedSpecies] = useState('');
  const [selectedVariegation, setSelectedVariegation] = useState('');
  const [selectedMutation, setSelectedMutation] = useState('');
  const [isChecked, setIsChecked] = useState(false);
  const [images, setImages] = useState([]);
  const handleImagePicked = uris => {
    setImages(uris); // This is an array of image URIs
    console.log(uris);
  };
  const [selectedPotSize, setSelectPotSize] = useState('2');
  const [selectedMeasure, setSelectMeasure] = useState('below');

  const onpressSelectPotsize = ({size}) => {
    setSelectPotSize(size);
  };

  const onpressSelectAboveBelow = ({measure}) => {
    setSelectMeasure(measure);
  };

  const onPressPublish = () => {
    console.log('publish');
  };

  const onPressPublishNurseryDrop = () => {
    console.log('publish nursery drop');
  };

  return (
    <ScrollView style={styles.mainContent}>
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
      <View style={styles.formContainer}>
        <Text style={[globalStyles.textMDGrayDark, {paddingBottom: 5}]}>
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
          options={['Option 1', 'Option 2', 'Option 3']}
          selectedOption={selectedMutation}
          onSelect={setSelectedMutation}
          placeholder="Choose an option"
        />
      </View>
      <View style={styles.formContainer}>
        <Text style={[globalStyles.textMDGrayDark, {paddingBottom: 5}]}>
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
        <Text style={[globalStyles.textMDGrayDark]}>Pot Size</Text>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginVertical: 10,
          }}>
          <TouchableOpacity onPress={() => onpressSelectPotsize({size: 2})}>
            <View
              style={[
                selectedPotSize == 2
                  ? styles.cardSelectionSelected
                  : styles.cardSelection,
              ]}>
              <Text style={globalStyles.textMDGrayDark}>2"</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onpressSelectPotsize({size: 4})}>
            <View
              style={[
                selectedPotSize == 4
                  ? styles.cardSelectionSelected
                  : styles.cardSelection,
              ]}>
              <Text style={globalStyles.textMDGrayDark}>4"</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onpressSelectPotsize({size: 6})}>
            <View
              style={[
                selectedPotSize == 6
                  ? styles.cardSelectionSelected
                  : styles.cardSelection,
              ]}>
              <Text style={globalStyles.textMDGrayDark}>6"</Text>
            </View>
          </TouchableOpacity>
        </View>
        <View>
          <View style={{marginTop: 10}}>
            <Text style={[globalStyles.textLGGreyDark, {paddingBottom: 10}]}>
              Local Price
            </Text>
            <InputBox placeholder={'Enter price'}></InputBox>
          </View>
          <View style={{marginTop: 10}}>
            <Text style={[globalStyles.textLGGreyDark]}>
              Approximate Height
            </Text>
            <View
              style={{
                flexDirection: 'row',
                marginTop: 10,
                justifyContent: 'space-between',
              }}>
              <TouchableOpacity
                onPress={() => onpressSelectAboveBelow({measure: 'below'})}>
                <View
                  style={[
                    selectedMeasure == 'below'
                      ? styles.cardSelectionSelectedMeasure
                      : styles.cardSelectionMeasure,
                    {
                      width: 0.5 * screenWidth - 25,
                    },
                  ]}>
                  <Text style={globalStyles.textMDGrayDark}>
                    Below 12 inches
                  </Text>
                  <Text style={globalStyles.textSMGreyLight}>{`<`}30 cm</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onpressSelectAboveBelow({measure: 'above'})}>
                <View
                  style={[
                    selectedMeasure == 'above'
                      ? styles.cardSelectionSelectedMeasure
                      : styles.cardSelectionMeasure,
                    {
                      width: 0.5 * screenWidth - 25,
                    },
                  ]}>
                  <Text style={globalStyles.textMDGrayDark}>
                    Above 12 inches
                  </Text>
                  <Text style={globalStyles.textSMGreyLight}>{`>`}30 cm</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
          <Text style={[globalStyles.textSMGreyLight, {paddingTop: 10}]}>
            For shipping calculation use.
          </Text>
        </View>
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

export default ScreenSingleSell;
