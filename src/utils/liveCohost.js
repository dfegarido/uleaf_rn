import { getAgoraUid } from './getAgoraUid';

/**
 * Co-hosted live: which remote broadcaster is the seller and which is the co-host.
 * Every account's Agora uid is getAgoraUid(accountId), so the seller's uid is known from the
 * session's `createdBy`. Any other broadcaster in the channel is the co-host.
 */
export function classifyRemoteUid(remoteUid, sellerAccountId) {
  return remoteUid === getAgoraUid(sellerAccountId) ? 'seller' : 'cohost';
}

/**
 * Whether this broadcaster may run the seller's controls (listings, sticky note).
 * The seller (no `cohost`) and an admin co-host may; buyer/seller guests are camera-only.
 * No `guestKind` means an older server, where every co-host was an admin.
 */
export const canManageLive = (cohost) => !cohost || !cohost.guestKind || cohost.guestKind === 'admin';

/**
 * How CohostInviteGate behaves for this user. Admins keep the original flow (OS prompt, 5 s poll).
 * Buyers get no cold OS prompt at login: a "deny" is permanent and the buyer app has its own
 * enable-notifications card. Sellers have no such card, so they are prompted (else no invite push
 * could ever reach a closed app). Polling every 5 s for every user is too costly:
 * the push brings the invite at once, so 30 s polling (inside the 60 s invite) is only a backup.
 */
export function cohostGateMode(userInfo) {
  const type = userInfo?.user?.userType ?? userInfo?.userType;
  const admin = type === 'admin' || type === 'sub_admin';
  return { prompt: admin || type === 'supplier', pollMs: admin ? 5000 : 30000 };
}
