import { Alert, InteractionManager, Platform } from 'react-native';
import Share from 'react-native-share';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';

export function getInviteCode(uid) {
  if (!uid) return '------';
  let hash = 0;
  for (let i = 0; i < uid.length; i++) {
    hash = (hash << 5) - hash + uid.charCodeAt(i);
    hash |= 0;
  }
  return String(Math.abs(hash) % 1000000).padStart(6, '0');
}

export function buildInviteUrl(inviteCode) {
  return `https://ileafu.com/refer?code=${inviteCode}`;
}

export function buildInviteShareMessage(inviteCode, inviteUrl) {
  return `Join me on ileafU

ileafU is the first marketplace designed for plant imports.

It connects collectors in the United States with 80+ trusted suppliers across Asia, so you can discover and order rare plants in one place — without dealing with individual growers or complicated logistics.

With ileafU, we can:
Explore plants beyond imagination
Save on air cargo with the Shipping Buddy system
Shop confidently with a Live Arrival Guarantee

ileafU manages the logistics from their Bangkok consolidation hub to your doorstep in the U.S., saving you time and unnecessary shipping chaos.

When you buy your first plant, you'll receive 20 Leaf Coins, and I'll earn 20 Leaf Points.
Each Coin or Point is worth about $1 toward future purchases.

Import Smarter with ileafU.\n\nUse my link: ${inviteUrl}\nOr enter my code: ${inviteCode}`;
}

export function publishReferralCodeMapping(uid, inviteCode) {
  if (!uid || !inviteCode || inviteCode === '------') return Promise.resolve();
  return setDoc(doc(db, 'referralCodes', inviteCode), { uid }, { merge: true }).catch(() => {});
}

export function runShareAfterInteractions(fn) {
  InteractionManager.runAfterInteractions(() => {
    setTimeout(fn, Platform.OS === 'ios' ? 250 : 100);
  });
}

/**
 * Same share sheet as Invite Friends: referral link + long message via react-native-share.
 */
export function shareReferralInvite(uid, { onMissingUidAlert = true } = {}) {
  const inviteCode = getInviteCode(uid);
  if (!uid || inviteCode === '------') {
    if (onMissingUidAlert) {
      Alert.alert('Sign in required', 'Please sign in to share your invite.');
    }
    return;
  }
  publishReferralCodeMapping(uid, inviteCode);
  const inviteUrl = buildInviteUrl(inviteCode);
  const message = buildInviteShareMessage(inviteCode, inviteUrl);
  runShareAfterInteractions(async () => {
    try {
      await Share.open({
        message,
        url: inviteUrl,
        title: 'Join ileafU',
      });
    } catch (error) {
      if (error?.message !== 'User did not share') {
        Alert.alert('Error', 'Could not open share sheet. Please try again.');
      }
    }
  });
}
