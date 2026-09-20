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

/** Accounts that use exact-USD listing editor + B2B commission model. */
export function isB2BBusinessUser(userInfo) {
  return canEditListingsInUsd(accountClassFromUserInfo(userInfo));
}

/** Only Asia Business / US Business — not Asia Seller or Inhouse. */
export function canEditListingsInUsd(accountClass) {
  const cls = String(accountClass || '').trim();
  return cls === 'US Business' || cls === 'Asia Business';
}

export function mergeB2BAccountIntoUserInfo(userInfo, account) {
  if (!userInfo || !account) {
    return userInfo;
  }
  return {
    ...userInfo,
    user: {
      ...(userInfo.user || {}),
      accountClass: account.accountClass,
      canLiveSell: account.canLiveSell,
      canMainstreamSell: account.canMainstreamSell,
      canPurchase: account.canPurchase,
      liveFlag: account.liveFlag || userInfo.user?.liveFlag,
    },
  };
}
