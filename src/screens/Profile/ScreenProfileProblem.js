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
  Platform,
  FlatList,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import {globalStyles} from '../../assets/styles/styles';
import {InputTextArea} from '../../components/Input';
import {ImagePickerModal} from '../../components/ImagePicker';
import {uploadImageToFirebase} from '../../utils/uploadImageToFirebase';
import NetInfo from '@react-native-community/netinfo';

import {postProfileReportProblemApi} from '../../components/Api';

import LeftIcon from '../../assets/icons/greylight/caret-left-regular.svg';
import AvatarIcon from '../../assets/images/avatar.svg';

const screenHeight = Dimensions.get('window').height;

const ScreenProfileProblem = ({navigation}) => {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);

  useFocusEffect(() => {
    if (Platform.OS === 'android') {
      StatusBar.setBarStyle('dark-content');
      StatusBar.setBackgroundColor('#fff');
    }
  });

  const [images, setImages] = useState([]);
  const handleImagePicked = uris => {
    setImages(uris); // This is an array of image URIs
    console.log(uris);
  };

  const [problemText, setProblemText] = useState('');

  // Form validation
  const validateForm = () => {
    let errors = [];

    if (!problemText) errors.push('Description is required.');
    if (images.length === 0) errors.push('At least one image is required.');

    return errors;
  };
  // Form validation

  // Update
  const onPressUpdate = async () => {
    const errors = validateForm();
    if (errors.length > 0) {
      Alert.alert('Validation', errors.join('\n'));
      return;
    }
    setLoading(true);

    try {
      let netState = await NetInfo.fetch();
      if (!netState.isConnected || !netState.isInternetReachable) {
        Alert.alert('Network', 'No internet connection.');
        throw new Error('No internet connection.');
      }

      // Upload images to Firebase
      const uploadedUrls = [];
      for (const uri of images) {
        const firebaseUrl = await uploadImageToFirebase(uri);
        uploadedUrls.push(firebaseUrl);
      }

      const response = await postProfileReportProblemApi(
        problemText,
        uploadedUrls.length > 0 ? uploadedUrls[0] : null,
      );

      if (!response?.success) {
        throw new Error(response?.message || 'Report problem failed.');
      }

      Alert.alert('Export', 'Problem reported successfully!');
      setProblemText('');
      setImages([]);
    } catch (error) {
      console.log('Report problem:', error.message);
      Alert.alert('Update password', error.message);
    } finally {
      setLoading(false);
    }
  };
  // Update

  return (
    <SafeAreaView
      style={{flex: 1, backgroundColor: '#fff', paddingBottom: insets.bottom}}>
      {loading && (
        <Modal transparent animationType="fade">
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#699E73" />
          </View>
        </Modal>
      )}
      <ScrollView
        style={[styles.container, {paddingTop: insets.top}]}
        // contentContainerStyle={{
        //   marginBottom: insets.bottom + 30,
        // }}
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
            <Text style={[globalStyles.textMDGreyDark, {paddingBottom: 5}]}>
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
                  contentContainerStyle={styles.imageListContainer}
                />
              </>
            )}
            <ImagePickerModal onImagePicked={handleImagePicked} limit={1} />
            <Text style={[globalStyles.textSMGreyLight, {textAlign: 'center'}]}>
              Take a photo(camera) or select from your library
            </Text>
          </View>
        </View>
        {/* Main Content */}
      </ScrollView>
      <View style={{padding: 20, backgroundColor: '#fff'}}>
        <TouchableOpacity
          style={[globalStyles.primaryButton]}
          onPress={() => onPressUpdate()}>
          <Text style={styles.buttonText}>Submit</Text>
        </TouchableOpacity>
      </View>
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
  image: {
    width: 200,
    height: 200,
    marginRight: 10,
    borderRadius: 8,
    backgroundColor: '#ddd',
  },
  imageListContainer: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ScreenProfileProblem;
