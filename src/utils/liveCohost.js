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
