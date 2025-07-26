// utils/firebaseUploader.js
import {LogBox} from 'react-native';

// Suppress deprecation warning only related to RN Firebase namespaced APIs
LogBox.ignoreLogs([
  'This method is deprecated (as well as all React Native Firebase namespaced API)',
]);

import {getApp} from '@react-native-firebase/app';
import storageModular from '@react-native-firebase/storage';
import auth from '@react-native-firebase/auth';
import {generateUUID} from './generateUUID';

// Modern modular upload function
export const uploadImageToFirebaseProfile = async fileUri => {
  try {
    const app = getApp(); // Use modular getApp()
    const storage = storageModular(app); // 👈 Use modular pattern (NOT getStorage from web SDK)
    const userId = auth().currentUser?.uid;

    if (!userId) throw new Error('User is not authenticated.');

    const extension = fileUri.split('.').pop().split('?')[0];
    const filename = `profile-photo/${userId}/${generateUUID()}.${
      extension || 'jpg'
    }`;

    // Convert to blob
    const response = await fetch(fileUri);
    const blob = await response.blob();

    // Upload using modular API
    const ref = storage.ref(filename);
    const task = ref.put(blob); // 👈 put() works in RN Firebase

    await task;

    // ✅ Get URL
    const downloadURL = await ref.getDownloadURL();
    return downloadURL;
  } catch (err) {
    console.error('❌ Upload to Firebase failed:', err);
    throw err;
  }
};
