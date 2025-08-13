/**
 * Utility functions for calculating plant flight dates
 */

/**
 * Calculate plant flight date based on country rules
 * @param {Object} plantData - The plant data object
 * @param {string} plantData.country - Country of origin
 * @param {Array} plantData.variations - Optional variations array that might contain country info
 * @returns {string} Formatted flight date (e.g., "Aug-15")
 */
export const calculatePlantFlightDate = (plantData = {}) => {
  // Try to get country from different possible locations in the data
  let country = plantData?.country?.toLowerCase();
  
  // If no country in main data, check variations for country info
  if (!country && plantData?.variations && plantData.variations.length > 0) {
    // Check if any variation has country info
    for (const variation of plantData.variations) {
      if (variation.country) {
        country = variation.country.toLowerCase();
        break;
      }
    }
  }
  
  // If still no country, default to Philippines
  if (!country) {
    // Default to Philippines since that seems to be the main origin
    country = 'philippines';
  }
  
  const currentDate = new Date();
  
  // Helper function to get next Saturday from a given date
  const getNextSaturday = (fromDate) => {
    const date = new Date(fromDate);
    const daysUntilSaturday = (6 - date.getDay()) % 7; // 6 = Saturday, 0 = Sunday
    const nextSaturday = new Date(date);
    
    if (daysUntilSaturday === 0 && date.getDay() === 6) {
      // If today is Saturday, get next Saturday (7 days from now)
      nextSaturday.setDate(date.getDate() + 7);
    } else if (daysUntilSaturday === 0) {
      // If today is Sunday, get this Saturday (6 days from now)
      nextSaturday.setDate(date.getDate() + 6);
    } else {
      // Get the upcoming Saturday
      nextSaturday.setDate(date.getDate() + daysUntilSaturday);
    }
    
    return nextSaturday;
  };

  // Format date as "Mon-DD" (e.g., "Aug-15")
  const formatFlightDate = (date) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]}-${date.getDate().toString().padStart(2, '0')}`;
  };

  if (country === 'philippines' || country === 'indonesia') {
    // Philippines/Indonesia: 28 days + nearest Saturday
    const date28DaysLater = new Date(currentDate);
    date28DaysLater.setDate(currentDate.getDate() + 28);
    const flightDate = getNextSaturday(date28DaysLater);
    return formatFlightDate(flightDate);
  } else if (country === 'thailand') {
    // Thailand: Next Saturday from current date
    const flightDate = getNextSaturday(currentDate);
    return formatFlightDate(flightDate);
  } else {
    // For other countries, default to Philippines rules (28 days + nearest Saturday)
    const date28DaysLater = new Date(currentDate);
    date28DaysLater.setDate(currentDate.getDate() + 28);
    const flightDate = getNextSaturday(date28DaysLater);
    return formatFlightDate(flightDate);
  }
};

/**
 * Get country-specific flight rules for display
 * @param {string} country - Country name
 * @returns {Object} Flight rule information
 */
export const getFlightRules = (country = '') => {
  const countryLower = country.toLowerCase();
  
  if (countryLower === 'philippines' || countryLower === 'indonesia') {
    return {
      days: 28,
      rule: '28 days + nearest Saturday',
      description: 'Ships 28 days from order date on the nearest Saturday'
    };
  } else if (countryLower === 'thailand') {
    return {
      days: 0,
      rule: 'Next Saturday',
      description: 'Ships on the next available Saturday'
    };
  } else {
    return {
      days: 28,
      rule: '28 days + nearest Saturday (default)',
      description: 'Ships 28 days from order date on the nearest Saturday (default rule)'
    };
  }
};

/**
 * Calculate days until flight date
 * @param {Object} plantData - The plant data object
 * @returns {number} Number of days until flight
 */
export const getDaysUntilFlight = (plantData = {}) => {
  const flightDateString = calculatePlantFlightDate(plantData);
  
  // Parse the flight date string (e.g., "Aug-15")
  const currentYear = new Date().getFullYear();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const [monthStr, dayStr] = flightDateString.split('-');
  const monthIndex = months.indexOf(monthStr);
  const day = parseInt(dayStr, 10);
  
  if (monthIndex === -1) {
    return 0; // Invalid date format
  }
  
  const flightDate = new Date(currentYear, monthIndex, day);
  const currentDate = new Date();
  
  // If the flight date is in the past (current year), assume next year
  if (flightDate < currentDate) {
    flightDate.setFullYear(currentYear + 1);
  }
  
  const timeDiff = flightDate.getTime() - currentDate.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
  
  return Math.max(0, daysDiff);
};

/**
 * Check if flight date is in current year or next year
 * @param {Object} plantData - The plant data object
 * @returns {Object} Year information
 */
export const getFlightYearInfo = (plantData = {}) => {
  const flightDateString = calculatePlantFlightDate(plantData);
  const currentYear = new Date().getFullYear();
  const daysUntil = getDaysUntilFlight(plantData);
  
  // If more than 300 days, likely next year
  const isNextYear = daysUntil > 300;
  
  return {
    flightDate: flightDateString,
    year: isNextYear ? currentYear + 1 : currentYear,
    isNextYear,
    daysUntil,
    fullDate: `${flightDateString}-${isNextYear ? currentYear + 1 : currentYear}`
  };
};
