import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Dimensions,
  Image,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import {globalStyles} from '../../assets/styles/styles';
import {InputTextArea} from '../../components/Input';
import {ImagePickerModal} from '../../components/ImagePicker';

import LeftIcon from '../../assets/icons/greylight/caret-left-regular.svg';
import AvatarIcon from '../../assets/images/avatar.svg';

const screenHeight = Dimensions.get('window').height;

const ScreenProfileProblem = ({navigation}) => {
  const insets = useSafeAreaInsets();

  useFocusEffect(() => {
    StatusBar.setBarStyle('dark-content');
    StatusBar.setBackgroundColor('#fff');
  });

  const [images, setImages] = useState([]);
  const handleImagePicked = uris => {
    setImages(uris); // This is an array of image URIs
    console.log(uris);
  };

  const [problemText, setProblemText] = useState('');
  return (
    <SafeAreaView style={{flex: 1, backgroundColor: '#fff'}}>
      <ScrollView
        style={[styles.container, {paddingTop: insets.top}]}
        stickyHeaderIndices={[0]}>
        {/* Header */}
        <View style={styles.stickyHeader}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{
                // padding: 5,
                // backgroundColor: '#fff',
                flexDirection: 'row',
                justifyContent: 'flex-start',
                alignItems: 'flex-start',
              }}>
              <LeftIcon width={30} hegiht={30} />
            </TouchableOpacity>
            <View style={{flex: 1}}>
              <Text
                style={[
                  globalStyles.textLGGreyDark,
                  {textAlign: 'center', paddingRight: 20},
                ]}>
                Report a Problem
              </Text>
            </View>
          </View>
        </View>
        {/* Header */}

        {/* Main Content */}
        <View>
          <View style={{marginHorizontal: 20, paddingTop: 10}}>
            <InputTextArea
              text={problemText}
              setText={setProblemText}
              lines={4}
              height={screenHeight * 0.5}
            />
          </View>
          <View style={{marginHorizontal: 20, paddingTop: 10}}>
            <Text style={[globalStyles.textMDGrayDark, {paddingBottom: 5}]}>
              Attachment/s
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
        </View>
        {/* Main Content */}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  mainContent: {
    flex: 1,
    backgroundColor: '#DFECDF',
  },
  mainContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  stickyHeader: {
    backgroundColor: '#fff',
    zIndex: 10,
    paddingTop: 12,
    paddingBottom: 12,
  },
});

export default ScreenProfileProblem;
