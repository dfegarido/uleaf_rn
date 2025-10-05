// utils/firebaseUploader.js
import {LogBox} from 'react-native';

// Suppress deprecation warning only related to RN Firebase namespaced APIs
LogBox.ignoreLogs([
  'This method is deprecated (as well as all React Native Firebase namespaced API)',
]);

import storage from '@react-native-firebase/storage';
import auth from '@react-native-firebase/auth';
import {generateUUID} from './generateUUID';

// Modern modular upload function
export const uploadImageToFirebase = async fileUri => {
  try {
    // Don't pass app instance - React Native Firebase uses default app automatically
    const userId = auth().currentUser?.uid;

    if (!userId) throw new Error('User is not authenticated.');

    const extension = fileUri.split('.').pop().split('?')[0];
    const filename = `listings/${userId}/${generateUUID()}.${
      extension || 'jpg'
    }`;

    // Convert to blob
    const response = await fetch(fileUri);
    const blob = await response.blob();

    // Upload using React Native Firebase default app
    const ref = storage().ref(filename);
    const task = ref.put(blob);

    await task;

    // ✅ Get URL
    const downloadURL = await ref.getDownloadURL();
    return downloadURL;
  } catch (err) {
    console.error('❌ Upload to Firebase failed:', err);
    throw err;
  }
};
