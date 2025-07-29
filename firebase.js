import { getApps, initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyAl2oKT5-zpug-anxTZerCmgm5jGgP8Gao",
  authDomain: "i-leaf-u.firebaseapp.com",
  projectId: "i-leaf-u",
  storageBucket: "i-leaf-u.firebasestorage.app",
  messagingSenderId: "1045608501061",
  appId: "1:1045608501061:web:ef5e90fab58c9da239782c",
  measurementId: "G-TLSXYQ00XY"
};

// const firebaseConfig = {
//   apiKey: "AIzaSyAl2oKT5-zpug-anxTZerCmgm5jGgP8Gao",
//   authDomain: "i-leaf-u.firebaseapp.com",
//   projectId: "i-leaf-u",
//   storageBucket: "i-leaf-u.firebasestorage.app",
//   messagingSenderId: "1045608501061",
//   appId: "1:1045608501061:web:ef5e90fab58c9da239782c",
//   measurementId: "G-TLSXYQ00XY"
// };

let app;
let auth;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
  });
} else {
  app = getApps()[0];
  auth = getAuth(app);
}

export { auth };
export const db = getFirestore(app);

