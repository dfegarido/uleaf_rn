export const BUSINESS_COUNTRIES = [
  {name: 'Philippines', code: 'PH', flag: '🇵🇭', dialCode: '+63'},
  {name: 'Thailand', code: 'TH', flag: '🇹🇭', dialCode: '+66'},
  {name: 'Indonesia', code: 'ID', flag: '🇮🇩', dialCode: '+62'},
  {name: 'Singapore', code: 'SG', flag: '🇸🇬', dialCode: '+65'},
  {name: 'Vietnam', code: 'VN', flag: '🇻🇳', dialCode: '+84'},
  {name: 'Taiwan', code: 'TW', flag: '🇹🇼', dialCode: '+886'},
  {name: 'United States', code: 'US', flag: '🇺🇸', dialCode: '+1'},
];

export const BUSINESS_COUNTRY_NAMES = BUSINESS_COUNTRIES.map(item => item.name);

export const isBusinessAccountClass = accountClass =>
  accountClass === 'US Business' || accountClass === 'Asia Business';
