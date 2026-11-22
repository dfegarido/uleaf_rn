export const B2B_APP_SHELL_KEY = 'b2bAppShell';

export function accountClassFromUserInfo(userInfo) {
  return (
    userInfo?.user?.accountClass ||
    userInfo?.data?.accountClass ||
    userInfo?.accountClass ||
    ''
  );
}

export function isUsBusinessUser(userInfo) {
  return accountClassFromUserInfo(userInfo) === 'US Business';
}

/** Temporary: only these US Business accounts may create US plant listings. */
const US_PLANT_LISTING_CREATOR_EMAILS = new Set([
  'sunflowerfields1221@gmail.com',
  'rorounifix@gmail.com',
]);

export function signedInEmailFromUserInfo(userInfo) {
  return String(
    userInfo?.email ||
      userInfo?.user?.email ||
      userInfo?.data?.email ||
      '',
  )
    .trim()
    .toLowerCase();
}

export function isUsPlantListingCreatorUser(userInfo) {
  return US_PLANT_LISTING_CREATOR_EMAILS.has(signedInEmailFromUserInfo(userInfo));
}

/** Accounts that use exact-USD listing editor + B2B commission model. */
export function isB2BBusinessUser(userInfo) {
  return canEditListingsInUsd(accountClassFromUserInfo(userInfo));
}

/** Only Asia Business / US Business — not Asia Seller or Inhouse. */
export function canEditListingsInUsd(accountClass) {
  const cls = String(accountClass || '').trim();
  return cls === 'US Business' || cls === 'Asia Business';
}

export function isAsiaBusinessAccount(accountClass) {
  return String(accountClass || '').trim().toLowerCase() === 'asia business';
}

export function isGroupChatListingStatus(status) {
  return String(status || '').trim() === 'GroupChatListing';
}

/**
 * Asia Business chat / After Live Backstage listings (status GroupChatListing)
 * are view-only for Edit — Delete / Export / To cart / Discount / Stocks stay.
 */
export function isAsiaBusinessChatListingEditDisabled(accountClass, status) {
  return (
    isAsiaBusinessAccount(accountClass) && isGroupChatListingStatus(status)
  );
}

/** Matches AFTER LIVE Backstage shop naming (same idea as afterLiveBackstage.js). */
export function isAfterLiveBackstageChatShop(shop) {
  const name = String(shop?.name || shop?.shopName || shop?.groupChatName || '');
  return /after\s+live\s+backstage/i.test(name);
}

/**
 * Asia Business: hide supplier chat shops except AFTER LIVE Backstage.
 * US Business / others: unchanged list.
 */
export function filterSellerChatShopsForAccount(shops, accountClass) {
  const list = Array.isArray(shops) ? shops : [];
  if (!isAsiaBusinessAccount(accountClass)) return list;
  return list.filter(isAfterLiveBackstageChatShop);
}

/** Seller-home label: exact-USD business accounts vs the in-house conversion model. */
export function pricingModelLabel(accountClass) {
  const cls = String(accountClass || '').trim();
  if (!cls) return '';
  if (canEditListingsInUsd(cls)) return 'B2B Asia';
  return 'In-house';
}

export function mergeB2BAccountIntoUserInfo(userInfo, account) {
  if (!userInfo || !account) {
    return userInfo;
  }
  return {
    ...userInfo,
    canChatListing: account.canChatListing === true || userInfo.canChatListing === true,
    user: {
      ...(userInfo.user || {}),
      accountClass: account.accountClass,
      canLiveSell: account.canLiveSell,
      canMainstreamSell: account.canMainstreamSell,
      canPurchase: account.canPurchase,
      canChatListing: account.canChatListing === true || userInfo.user?.canChatListing === true,
      liveFlag: account.liveFlag || userInfo.user?.liveFlag,
      email: account.email || userInfo.user?.email,
    },
  };
}
