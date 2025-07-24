import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAl2oKT5-zpug-anxTZerCmgm5jGgP8Gao",
  authDomain: "i-leaf-u.firebaseapp.com",
  projectId: "i-leaf-u",
  storageBucket: "i-leaf-u.firebasestorage.app",
  messagingSenderId: "1045608501061",
  appId: "1:1045608501061:web:ef5e90fab58c9da239782c",
  measurementId: "G-TLSXYQ00XY"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
