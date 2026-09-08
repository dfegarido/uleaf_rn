import {getStoredAuthToken} from '../../utils/getStoredAuthToken';
import {API_ENDPOINTS} from '../../config/apiConfig';

export const getAdminTaxonomyApi = async (filters = {}) => {
  try {
    const token = await getStoredAuthToken();
    console.log('getAdminTaxonomyApi token:', token ? 'Token exists' : 'No token found');
    // Build query parameters
    const params = new URLSearchParams();

    if (filters.search) {
      params.append('search', filters.search);
    }

    if (filters.page) {
      params.append('page', filters.page);
    }

    if (filters.limit) {
      params.append('limit', filters.limit);
    }

    // Add other filters like variegation, shipping index, etc.
    if (filters.variegation) {
      params.append('variegation', filters.variegation);
    }

    if (filters.shippingIndex) {
      params.append('shippingIndex', filters.shippingIndex);
    }

    if (filters.acclimationIndex) {
      params.append('acclimationIndex', filters.acclimationIndex);
    }

    const url = `${API_ENDPOINTS.GET_GENUS_LIST}${params.toString() ? `?${params.toString()}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    const json = await response.json();
    return json;
  } catch (error) {
    console.log('getAdminTaxonomyApi error:', error.message);
    throw error;
  }
};

export const updateTaxonomyItemApi = async (taxonomyId, data) => {
  try {
    const token = await getStoredAuthToken();

    const response = await fetch(
      `${API_ENDPOINTS.UPDATE_PLANT_TAXONOMY}/${taxonomyId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    const json = await response.json();
    return json;
  } catch (error) {
    console.log('updateTaxonomyItemApi error:', error.message);
    throw error;
  }
};
