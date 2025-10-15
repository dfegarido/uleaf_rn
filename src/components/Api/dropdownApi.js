import {getStoredAuthToken} from '../../utils/getStoredAuthToken';
import {API_ENDPOINTS} from '../../config/apiConfig';

/**
 * Get plants dropdown data
 * @returns {Promise<Object>} Plants dropdown response
 */
export const getPlantsDropdownApi = async () => {
  try {
    const response = await fetch(
      API_ENDPOINTS.GET_PLANTS_DROPDOWN,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || errorData.error || `HTTP error! status: ${response.status}`,
      );
    }

    const data = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Get plants dropdown API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while fetching plants dropdown',
    };
  }
};

/**
 * Get all plant genus data
 * @returns {Promise<Object>} Plant genus response
 */
export const getAllPlantGenusApi = async () => {
  try {
    const response = await fetch(
      API_ENDPOINTS.GET_ALL_PLANT_GENUS,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || errorData.error || `HTTP error! status: ${response.status}`,
      );
    }

    const data = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Get all plant genus API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while fetching plant genus data',
    };
  }
};

/**
 * Get plant care tags
 * @returns {Promise<Object>} Plant care tags response
 */
export const getPlantCareTagsApi = async () => {
  try {
    const response = await fetch(
      API_ENDPOINTS.GET_PLANT_CARE_TAGS,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || errorData.error || `HTTP error! status: ${response.status}`,
      );
    }

    const data = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Get plant care tags API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while fetching plant care tags',
    };
  }
};

/**
 * Get plant types
 * @returns {Promise<Object>} Plant types response
 */
export const getPlantTypesApi = async () => {
  try {
    const response = await fetch(
      API_ENDPOINTS.GET_PLANT_TYPES,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || errorData.error || `HTTP error! status: ${response.status}`,
      );
    }

    const data = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Get plant types API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while fetching plant types',
    };
  }
};

/**
 * Get plant growth forms
 * @returns {Promise<Object>} Plant growth forms response
 */
export const getPlantGrowthFormsApi = async () => {
  try {
    const response = await fetch(
      API_ENDPOINTS.GET_PLANT_GROWTH_FORMS,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || errorData.error || `HTTP error! status: ${response.status}`,
      );
    }

    const data = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Get plant growth forms API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while fetching plant growth forms',
    };
  }
};

/**
 * Get regions dropdown data
 * @returns {Promise<Object>} Regions dropdown response
 */
export const getRegionsDropdownApi = async () => {
  try {
    const response = await fetch(
      API_ENDPOINTS.GET_REGIONS_DROPDOWN,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || errorData.error || `HTTP error! status: ${response.status}`,
      );
    }

    const data = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Get regions dropdown API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while fetching regions dropdown',
    };
  }
};

/**
 * Get delivery options
 * @returns {Promise<Object>} Delivery options response
 */
export const getDeliveryOptionsApi = async () => {
  try {
    const response = await fetch(
      API_ENDPOINTS.GET_DELIVERY_OPTIONS,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || errorData.error || `HTTP error! status: ${response.status}`,
      );
    }

    const data = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Get delivery options API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while fetching delivery options',
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
      console.log('No auth token available for getCountryApi, skipping...');
      return {
        success: true,
        data: []
      };
    }
    
    const url = API_ENDPOINTS.GET_COUNTRY;
    console.log('🌍 Calling Country API:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
    });

    console.log('🌍 Country API response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('🌍 Country API error response:', errorData);
      throw new Error(
        errorData.message || errorData.error || `HTTP error! status: ${response.status}`,
      );
    }

    const data = await response.json();
    console.log('🌍 Country API response:', data);
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
      console.log('No auth token available for getListingTypeApi, skipping...');
      return {
        success: true,
        data: []
      };
    }
    
    const url = API_ENDPOINTS.GET_LISTING_TYPE;
    console.log('📋 Calling Listing Type API:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
    });

    console.log('📋 Listing Type API response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('📋 Listing Type API error response:', errorData);
      throw new Error(
        errorData.message || errorData.error || `HTTP error! status: ${response.status}`,
      );
    }

    const data = await response.json();
    console.log('📋 Listing Type API response:', data);
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
      console.log('No auth token available for getShippingIndexApi, skipping...');
      return {
        success: true,
        data: []
      };
    }
    
    const url = API_ENDPOINTS.GET_SHIPPING_INDEX;
    console.log('📦 Calling Shipping Index API:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
    });

    console.log('📦 Shipping Index API response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('📦 Shipping Index API error response:', errorData);
      throw new Error(
        errorData.message || errorData.error || `HTTP error! status: ${response.status}`,
      );
    }

    const data = await response.json();
    console.log('📦 Shipping Index API response:', data);
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
      console.log('No auth token available for getAcclimationIndexApi, skipping...');
      return {
        success: true,
        data: []
      };
    }
    
    const url = API_ENDPOINTS.GET_ACCLIMATION_INDEX;
    console.log('🌱 Calling Acclimation Index API:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
    });

    console.log('🌱 Acclimation Index API response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('🌱 Acclimation Index API error response:', errorData);
      throw new Error(
        errorData.message || errorData.error || `HTTP error! status: ${response.status}`,
      );
    }

    const data = await response.json();
    console.log('🌱 Acclimation Index API response:', data);
    return data;
  } catch (error) {
    console.error('Get acclimation index API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while fetching acclimation index',
    };
  }
};