import { getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyChIkiZaoE8u4o_T4El2vJWKD1KURYcU9k',
  authDomain: 'uleaf-36de7.firebaseapp.com',
  projectId: 'uleaf-36de7',
  storageBucket: 'uleaf-36de7.firebasestorage.app',
  messagingSenderId: '1053700505936',
  appId: '1:1053700505936:web:3404c9bcccdad8b97dec55',
  measurementId: 'G-Y66260BGRE',
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
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}
export const auth = getAuth(app);
export const db = getFirestore(app);

