import {getStoredAuthToken} from '../../utils/getStoredAuthToken';
import {API_ENDPOINTS} from '../../config/apiConfig';

/**
 * Get all plant genus data
 * @returns {Promise<Object>} Plant genus response
 */
export const getAllPlantGenusApi = async () => {
  try {
    // Prefer the admin-level combined genus list if available
  const authToken = await getStoredAuthToken();
    const headers = {
      'Content-Type': 'application/json',
    };
    if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

    // GET_GENUS_LIST is the ONLY correct source: it reads the authoritative
    // `genus` table (all 220). /dropdown-genus reads `dropdown_genus`, which holds
    // only the 8 curated buyer-Shop categories plus a synthetic "OTHERS" bucket —
    // a fallback to it would silently return 8 genera where 220 are expected.
    const tryEndpoints = [
      API_ENDPOINTS.GET_GENUS_LIST, // authoritative genus table (objects with name, receivedPlants)
    ];

    for (const url of tryEndpoints) {
      try {
        console.log('🌿 getAllPlantGenusApi: Trying endpoint:', url);
        const response = await fetch(url, { method: 'GET', headers });
        console.log('🌿 getAllPlantGenusApi: Response status:', response.status, response.ok);
        if (!response.ok) {
          // try next
          console.warn('⚠️ getAllPlantGenusApi: endpoint returned non-OK', url, response.status);
          continue;
        }

        const body = await response.json();
        console.log('🌿 getAllPlantGenusApi: Response body:', {
          hasData: !!body.data,
          dataIsArray: Array.isArray(body.data),
          dataLength: Array.isArray(body.data) ? body.data.length : 0,
          success: body.success,
          error: body.error
        });
        // Normalize: some endpoints return { data: [...] }, some return array
        const payload = Array.isArray(body) ? body : (body.data || []);
        if (payload.length > 0) {
          console.log('✅ getAllPlantGenusApi: Successfully loaded', payload.length, 'genus items from', url);
          return { success: true, data: payload };
        } else {
          console.warn('⚠️ getAllPlantGenusApi: Empty payload from', url);
        }
      } catch (innerErr) {
        // continue to next endpoint
        console.warn('❌ getAllPlantGenusApi endpoint failed, trying next:', url, innerErr?.message || innerErr);
      }
    }

    // If all attempts failed, return empty gracefully
    return { success: false, data: [], error: 'No genus endpoints responded successfully' };
  } catch (error) {
    console.error('Get all plant genus API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while fetching plant genus data',
    };
  }
};

/**
 * Get countries dropdown options
 * @returns {Promise<Object>} Countries response
 */
export const getCountryApi = async () => {
  try {
    const authToken = await getStoredAuthToken();
    
    // If no auth token, return empty result instead of error
    if (!authToken) {
      return {
        success: true,
        data: []
      };
    }
    
    const url = API_ENDPOINTS.GET_COUNTRY;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
    });

    

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('🌍 Country API error response:', errorData);
      throw new Error(
        errorData.message || errorData.error || `HTTP error! status: ${response.status}`,
      );
    }

  const data = await response.json();
  return data;
  } catch (error) {
    console.error('Get country API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while fetching countries',
    };
  }
};

/**
 * Get listing types dropdown options
 * @returns {Promise<Object>} Listing types response
 */
export const getListingTypeApi = async () => {
  try {
    const authToken = await getStoredAuthToken();
    
    // If no auth token, return empty result instead of error
    if (!authToken) {
      return {
        success: true,
        data: []
      };
    }
    
    const url = API_ENDPOINTS.GET_LISTING_TYPE;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
    });

    

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('📋 Listing Type API error response:', errorData);
      throw new Error(
        errorData.message || errorData.error || `HTTP error! status: ${response.status}`,
      );
    }

  const data = await response.json();
  return data;
  } catch (error) {
    console.error('Get listing type API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while fetching listing types',
    };
  }
};

/**
 * Get shipping index dropdown options
 * @returns {Promise<Object>} Shipping index response
 */
export const getShippingIndexApi = async () => {
  try {
    const authToken = await getStoredAuthToken();
    
    // If no auth token, return empty result instead of error
    if (!authToken) {
      return {
        success: true,
        data: []
      };
    }
    
    const url = API_ENDPOINTS.GET_SHIPPING_INDEX;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
    });

    

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('📦 Shipping Index API error response:', errorData);
      throw new Error(
        errorData.message || errorData.error || `HTTP error! status: ${response.status}`,
      );
    }

  const data = await response.json();
  return data;
  } catch (error) {
    console.error('Get shipping index API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while fetching shipping index',
    };
  }
};

/**
 * Get acclimation index dropdown options
 * @returns {Promise<Object>} Acclimation index response
 */
export const getAcclimationIndexApi = async () => {
  try {
    const authToken = await getStoredAuthToken();
    
    // If no auth token, return empty result instead of error
    if (!authToken) {
      return {
        success: true,
        data: []
      };
    }
    
    const url = API_ENDPOINTS.GET_ACCLIMATION_INDEX;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
    });

    

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('🌱 Acclimation Index API error response:', errorData);
      throw new Error(
        errorData.message || errorData.error || `HTTP error! status: ${response.status}`,
      );
    }

  const data = await response.json();
  return data;
  } catch (error) {
    console.error('Get acclimation index API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while fetching acclimation index',
    };
  }
};