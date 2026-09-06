import { collection, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { db } from '../../firebase';

export function getSellerUid(userInfo) {
  return (
    userInfo?.uid ||
    userInfo?.id ||
    userInfo?.user?.uid ||
    userInfo?.user?.id ||
    userInfo?.data?.uid ||
    ''
  );
}

/** Prefer an in-progress session (live, then waiting). */
export async function resolveCurrentLiveSessionId(sellerUid) {
  if (!sellerUid) return null;
  const snap = await getDocs(
    query(collection(db, 'live'), where('createdBy', '==', sellerUid)),
  );
  const sessions = snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((s) => {
      const st = String(s.status || '').toLowerCase();
      return st === 'live' || st === 'waiting';
    });
  const liveNow = sessions.find((s) => String(s.status).toLowerCase() === 'live');
  return (liveNow || sessions[0])?.id || null;
}

/**
 * Batch Excel/manual listings are status Live but often have no sessionId.
 * List only queries sessionId == this live, so attach orphans to the current session.
 */
export async function attachOrphanLiveListingsToSession(sellerUid, sessionId) {
  if (!sellerUid || !sessionId) return 0;
  const snap = await getDocs(
    query(
      collection(db, 'listing'),
      where('sellerCode', '==', sellerUid),
      where('status', '==', 'Live'),
    ),
  );
  let attached = 0;
  await Promise.all(
    snap.docs.map(async (docSnap) => {
      const sid = docSnap.data()?.sessionId;
      if (sid) return;
      await updateDoc(docSnap.ref, { sessionId });
      attached += 1;
    }),
  );
  return attached;
}
