import {getStoredAuthToken} from '../../utils/getStoredAuthToken';

/**
 * Get plants dropdown data
 * @returns {Promise<Object>} Plants dropdown response
 */
export const getPlantsDropdownApi = async () => {
  try {
    const response = await fetch(
      'https://us-central1-i-leaf-u.cloudfunctions.net/getPlantsDropdown',
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
      'https://us-central1-i-leaf-u.cloudfunctions.net/getAllPlantGenus',
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
      'https://us-central1-i-leaf-u.cloudfunctions.net/getPlantCareTags',
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
      'https://us-central1-i-leaf-u.cloudfunctions.net/getPlantTypes',
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
      'https://us-central1-i-leaf-u.cloudfunctions.net/getPlantGrowthForms',
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
      'https://us-central1-i-leaf-u.cloudfunctions.net/getRegionsDropdown',
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
      'https://us-central1-i-leaf-u.cloudfunctions.net/getDeliveryOptions',
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
