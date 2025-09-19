import {getStoredAuthToken} from '../../utils/getStoredAuthToken';

export const getAdminTaxonomyApi = async (filters = {}) => {
  try {
    const token = await getStoredAuthToken();

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

    const url = `https://us-central1-i-leaf-u.cloudfunctions.net/getAdminTaxonomy${params.toString() ? `?${params.toString()}` : ''}`;
    
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
      `https://us-central1-i-leaf-u.cloudfunctions.net/updateTaxonomyItem/${taxonomyId}`,
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
