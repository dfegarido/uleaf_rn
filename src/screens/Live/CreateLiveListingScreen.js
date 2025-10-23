import React, { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import CloseIcom from '../../assets/live-icon/close-x.svg';
import { addListing } from '../../components/Api/listingApi'; // Assuming you have this API function
import ScreenSellLive from '../Seller/Sell/ScreenSellLive';

const CreateLiveListingScreen = ({ navigation, isVisible, onClose, sessionId }) => {
  // const route = useRoute(); // No longer needed as sessionId is passed as prop
  // const { sessionId } = route.params; // No longer needed

  const [genus, setGenus] = useState('');
  const [species, setSpecies] = useState('');
  const [variegation, setVariegation] = useState('');
  const [localPrice, setLocalPrice] = useState('');
  const [imagePrimary, setImagePrimary] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [goBackButtonVisible, setOnGobackModalVisible] = useState(false);

  const childBackRef = useRef(null);
  const childAddRef = useRef(null);

  const handleParentBackButtonClick = () => {
    if (childBackRef.current) {
      childBackRef.current.triggerChildFunction(); // Call the exposed child function
    }
  };

  const handleParentAddButtonClick = () => {
    if (childAddRef.current) {
      childAddRef.current.triggerChildFunction(); // Call the exposed child function
    }
  };

  const goBackButton = () => {
    setOnGobackModalVisible(!goBackButtonVisible);
  };

  const handleChoosePhoto = () => {
    launchImageLibrary(
      { mediaType: 'photo', includeBase64: true, quality: 0.5 },
      (response) => {
        if (response.didCancel) {
          console.log('User cancelled image picker');
        } else if (response.errorCode) {
          Alert.alert('Error', 'Could not select image. Please try again.');
        } else if (response.assets && response.assets.length > 0) {
          const asset = response.assets[0];
          setImagePrimary({
            uri: asset.uri,
            base64: `data:${asset.type};base64,${asset.base64}`,
          });
        }
      },
    );
  };

  const handleAddListing = async () => {
    if (!genus || !species || !localPrice || !imagePrimary) {
      Alert.alert('Missing Information', 'Please fill all fields and add a photo.');
      return;
    }

    setIsLoading(true);
    try {
      const listingData = {
        listingType: 'Single Plant',
        genus,
        species,
        variegation,
        localPrice: parseFloat(localPrice),
        imagePrimary: imagePrimary.base64,
        status: 'liveListing', // Special status for live listings
        publishType: 'Live',
        sessionId: sessionId, // Associate with the live session
      };

      // You'll need to create this API function if it doesn't exist.
      // It should call your backend's `addListing` endpoint.
      const response = await addListing(listingData);

      if (response.success) {
        Alert.alert('Success', 'Live listing created successfully!');
        onClose(); // Close the modal on success
      } else {
        throw new Error(response.message || 'Failed to create live listing.');
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
      // Optionally reset form fields here if you want
    }
  };

  return (
    <Modal animationType="slide" transparent={true} visible={isVisible} onRequestClose={onClose} statusBarTranslucent={true}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
        {isLoading && ( // This loading indicator will now cover the modal content
        <Modal transparent animationType="fade">
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#699E73" />
          </View>
        </Modal>
        )}
        <TouchableWithoutFeedback>
          <View style={styles.modalContainer}>
            <View style={styles.header}>
              <TouchableOpacity onPress={onClose}>
                <CloseIcom />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Add Live Listing</Text>
              <View style={{ width: 24 }} />
            </View>

      <ScrollView style={styles.container}>
        <ScreenSellLive sessionId={sessionId} addRef={childAddRef} backRef={childBackRef} navigation={navigation} goBackButton={goBackButton}></ScreenSellLive>
        {/* <Text style={styles.label}>Genus</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Monstera"
          value={genus}
          onChangeText={setGenus}
        />

        <Text style={styles.label}>Species</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., deliciosa"
          value={species}
          onChangeText={setSpecies}
        />

        <Text style={styles.label}>Variegation (Optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Albo"
          value={variegation}
          onChangeText={setVariegation}
        />

        <Text style={styles.label}>Price</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter price"
          value={localPrice}
          onChangeText={setLocalPrice}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Cover Photo</Text>
        <TouchableOpacity style={styles.imagePicker} onPress={handleChoosePhoto}>
          {imagePrimary ? (
            <Image source={{ uri: imagePrimary.uri }} style={styles.coverImage} />
          ) : (
            <>
              <UploadIcon width={48} height={48} />
              <Text style={styles.imagePickerText}>Upload Plant Photo</Text>
            </>
          )}
        </TouchableOpacity> */}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.goLiveButton} onPress={handleParentAddButtonClick}>
          <Text style={styles.goLiveButtonText}>Add Listing to Live</Text>
        </TouchableOpacity>
        {goBackButtonVisible && (<TouchableOpacity style={styles.goBackButton} onPress={handleParentBackButtonClick}>
          <Text style={styles.goBackButtonText}>Back</Text>
        </TouchableOpacity>)}
      </View>
          </View>
        </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50, // Add padding to account for status bar if statusBarTranslucent is true
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Dim background
  },
  modalContainer: {
    width: '90%', // Adjust width as needed
    height: '80%', // Adjust height as needed
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingTop: 0, // Reset padding if modalOverlay has it
    overflow: 'hidden', // Ensures content stays within rounded corners
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#000'},
  container: { flex: 1, padding: 20 },
  label: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 24,
    color: '#000',
  },
  imagePicker: {
    borderWidth: 2,
    borderColor: '#ccc',
    borderStyle: 'dashed',
    borderRadius: 8,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    marginBottom: 20,
  },
  imagePickerText: { fontSize: 16, color: '#555', marginTop: 12 },
  coverImage: { width: '100%', height: '100%', borderRadius: 6 },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: '#E0E0E0' },
  goLiveButton: {
    backgroundColor: '#539461',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  goLiveButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  goBackButton: {
    marginVertical: 5,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderColor: '#539461',
    borderWidth: 1,
    alignItems: 'center',
  },
  goBackButtonText: { color: '#539461', fontSize: 18, fontWeight: 'bold' },
  loadingOverlay: { // This style is for the inner loading modal
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CreateLiveListingScreen;