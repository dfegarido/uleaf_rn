import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../../../firebase';

// Add the token to the buyer's fcmTokens array (deduped by Firestore).
export async function addTokenToBuyer(uid, token) {
  if (!uid || !token) return;
  const ref = doc(db, 'buyer', uid);
  await updateDoc(ref, { fcmTokens: arrayUnion(token) });
}

// Remove the token from the buyer's fcmTokens array.
export async function removeTokenFromBuyer(uid, token) {
  if (!uid || !token) return;
  const ref = doc(db, 'buyer', uid);
  await updateDoc(ref, { fcmTokens: arrayRemove(token) });
}
