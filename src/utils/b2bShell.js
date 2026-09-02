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
