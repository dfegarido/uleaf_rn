/**
 * Get currency symbol from user info or derive from country
 * @param {Object} userInfo - User information object
 * @param {string} userInfo.currencySymbol - Direct currency symbol from user profile
 * @param {string} userInfo.country - User's country
 * @returns {string} Currency symbol
 */
export const getCurrencySymbol = (userInfo) => {
  // Return direct currency symbol if available
  if (userInfo?.currencySymbol) {
    return userInfo.currencySymbol;
  }

  // Map country to currency symbol
  const countryToCurrency = {
    'Philippines': '₱',
    'United States': '$',
    'USA': '$',
    'US': '$',
    'Canada': 'C$',
    'United Kingdom': '£',
    'UK': '£',
    'Australia': 'A$',
    'Singapore': 'S$',
    'Malaysia': 'RM',
    'Thailand': '฿',
    'Indonesia': 'Rp',
    'Vietnam': '₫',
    'India': '₹',
    'Japan': '¥',
    'China': '¥',
    'South Korea': '₩',
    'Hong Kong': 'HK$',
    'Taiwan': 'NT$',
    'European Union': '€',
    'Germany': '€',
    'France': '€',
    'Spain': '€',
    'Italy': '€',
    'Netherlands': '€',
    'Belgium': '€',
    'Austria': '€',
    'Portugal': '€',
    'Ireland': '€',
    'Finland': '€',
    'Greece': '€'
  };

  return countryToCurrency[userInfo?.country] || '₱'; // Default to Philippine Peso
};