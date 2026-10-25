import { getAgoraUid } from './getAgoraUid';

/**
 * Co-hosted live: which remote broadcaster is the seller and which is the co-host.
 * Every account's Agora uid is getAgoraUid(accountId), so the seller's uid is known from the
 * session's `createdBy`. Any other broadcaster in the channel is the co-host.
 */
export function classifyRemoteUid(remoteUid, sellerAccountId) {
  return remoteUid === getAgoraUid(sellerAccountId) ? 'seller' : 'cohost';
}
