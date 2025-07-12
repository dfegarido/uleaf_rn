import { initializeApp } from 'firebase/app';
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

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
