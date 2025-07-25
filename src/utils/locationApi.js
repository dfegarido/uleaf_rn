const RAPIDAPI_KEY = 'cf179be3dbmsh487bc9fb98dd83ep1e8506jsn4e77aa02c61a';
const RAPIDAPI_HOST = 'wft-geo-db.p.rapidapi.com';

/**
 * Fetch US states from RapidAPI GeoDB with pagination
 * @param {number} offset - Starting offset for pagination
 * @param {number} limit - Number of items to fetch
 * @returns {Promise<{data: string[], hasMore: boolean, totalCount: number}>} States data with pagination info
 */
async function fetchUSStates(offset = 0, limit = 10) {
  try {
    console.log('fetchUSStates called with offset:', offset, 'limit:', limit);
    
    const url = `https://wft-geo-db.p.rapidapi.com/v1/geo/countries/US/regions?offset=${offset}&limit=${limit}`;
    const options = {
      method: 'GET',
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': RAPIDAPI_HOST
      }
    };

    console.log('Fetching states from:', url);
    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('States API response:', result);
    
    // Extract state data (name and isoCode) from the response
    const stateData = result.data.map(state => ({
      name: state.name,
      isoCode: state.isoCode
    }));
    
    // Check if there are more states to fetch
    const hasMore = result.metadata.currentOffset + result.data.length < result.metadata.totalCount;
    
    console.log(`Fetched ${stateData.length} states. HasMore: ${hasMore}`);
    
    return {
      data: stateData.sort((a, b) => a.name.localeCompare(b.name)), // Sort alphabetically by name
      hasMore,
      totalCount: result.metadata.totalCount,
      currentOffset: result.metadata.currentOffset
    };
  } catch (error) {
    console.error('Error fetching US states:', error);
    throw new Error('Failed to fetch US states. Please check your internet connection and try again.');
  }
}

/**
 * Fetch cities for a specific state from RapidAPI GeoDB with pagination
 * @param {string} stateCode - ISO code of the state (e.g., 'CA', 'NY')
 * @param {number} offset - Starting offset for pagination
 * @param {number} limit - Number of items to fetch
 * @returns {Promise<{data: string[], hasMore: boolean, totalCount: number}>} Cities data with pagination info
 */
async function fetchCitiesForState(stateCode, offset = 0, limit = 10) {
  try {
    console.log('fetchCitiesForState called for stateCode:', stateCode, 'offset:', offset, 'limit:', limit);
    
    if (!stateCode) {
      throw new Error(`State code is required`);
    }

    const url = `https://wft-geo-db.p.rapidapi.com/v1/geo/countries/US/regions/${stateCode}/cities?offset=${offset}&limit=${limit}`;
    const options = {
      method: 'GET',
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': RAPIDAPI_HOST
      }
    };

    console.log('Fetching cities from:', url);
    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('Cities API response:', result);
    
    // Extract city names from the response
    const cityNames = result.data.map(city => city.name);
    
    // Check if there are more cities to fetch
    const hasMore = result.metadata.currentOffset + result.data.length < result.metadata.totalCount;
    
    console.log(`Fetched ${cityNames.length} cities. HasMore: ${hasMore}`);
    
    return {
      data: cityNames.sort(), // Sort alphabetically
      hasMore,
      totalCount: result.metadata.totalCount,
      currentOffset: result.metadata.currentOffset
    };
  } catch (error) {
    console.error('Error fetching cities for state:', error);
    throw new Error(`Failed to fetch cities for state ${stateCode}. Please check your internet connection and try again.`);
  }
}

/**
 * Get the ISO code for a state name
 * @param {string} stateName - Name of the state
 * @returns {Promise<string|null>} ISO code of the state
 */
async function getStateCode(stateName) {
  try {
    console.log('getStateCode called for:', stateName);
    const allStates = [];
    let offset = 0;
    const limit = 10;
    let hasMore = true;

    while (hasMore) {
      const url = `https://wft-geo-db.p.rapidapi.com/v1/geo/countries/US/regions?offset=${offset}&limit=${limit}`;
      const options = {
        method: 'GET',
        headers: {
          'x-rapidapi-key': RAPIDAPI_KEY,
          'x-rapidapi-host': RAPIDAPI_HOST
        }
      };

      const response = await fetch(url, options);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      allStates.push(...result.data);

      hasMore = result.metadata.currentOffset + result.data.length < result.metadata.totalCount;
      offset += limit;
    }

    // Find the state by name and return its ISO code
    const state = allStates.find(s => s.name === stateName);
    return state ? state.isoCode : null;
  } catch (error) {
    console.error('Error getting state code:', error);
    return null;
  }
}

// Export functions
module.exports = {
  fetchUSStates,
  fetchCitiesForState
};
