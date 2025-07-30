import { getApps, initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { initializeFirestore, getFirestore } from 'firebase/firestore';
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
let db;

if (!getApps().length) {
  try {
    app = initializeApp(firebaseConfig);
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(ReactNativeAsyncStorage)
    });
    db = initializeFirestore(app, {
      persistence: getReactNativePersistence(ReactNativeAsyncStorage)
    });
  } catch (error) {
    console.error("Firebase initialization error", error);
  }
} else {
  app = getApps()[0];
  auth = getAuth(app);
  db = getFirestore(app);
}

export { auth, db };
