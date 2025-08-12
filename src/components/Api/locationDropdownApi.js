import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_ENDPOINTS } from '../../config/apiConfig';

/**
 * Fetch US states from database
 */
export const getDropdownStatesApi = async (page = 1, limit = 50, search = '') => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search })
    });

    const response = await fetch(`${API_ENDPOINTS.GET_DROPDOWN_STATES}?${queryParams}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch states');
    }

    return {
      data: result.data.map(state => ({
        name: state.name,
        isoCode: state.isoCode,
        id: state.id
      })),
      pagination: result.pagination,
      success: true
    };
  } catch (error) {
    console.error('Error in getDropdownStatesApi:', error);
    throw error;
  }
};

/**
 * Fetch cities for a specific state from database
 */
export const getDropdownCitiesApi = async (stateCode, page = 1, limit = 50, search = '') => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const queryParams = new URLSearchParams({
      stateCode,
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search })
    });

    const response = await fetch(`${API_ENDPOINTS.GET_DROPDOWN_CITIES}?${queryParams}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch cities');
    }

    return {
      data: result.data.map(city => city.name),
      pagination: result.pagination,
      success: true
    };
  } catch (error) {
    console.error('Error in getDropdownCitiesApi:', error);
    throw error;
  }
};

/**
 * Fetch public states (no auth) from new endpoint
 */
export const getPublicStatesApi = async (limit = 1000) => {
  try {
    const response = await fetch(`${API_ENDPOINTS.PUBLIC_STATES}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) {
      const errorData = await response.json().catch(()=>({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    if (!result.success) throw new Error(result.error || 'Failed to fetch public states');
    return result.data.map(s => ({ name: s.name, isoCode: s.isoCode, id: s.id }));
  } catch (e) {
    console.error('Error in getPublicStatesApi:', e);
    throw e;
  }
};

/**
 * Fetch public cities (no auth) for a state using offset pagination
 */
export const getPublicCitiesApi = async (stateCode, limit = 50, offset = 0) => {
  try {
    const params = new URLSearchParams({ stateCode, limit: String(limit), offset: String(offset) });
    const response = await fetch(`${API_ENDPOINTS.PUBLIC_CITIES}?${params}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) {
      const errorData = await response.json().catch(()=>({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    if (!result.success) throw new Error(result.error || 'Failed to fetch public cities');
    return {
      cities: result.data.map(c => c.name || c.city || c.name),
      pagination: result.pagination
    };
  } catch (e) {
    console.error('Error in getPublicCitiesApi:', e);
    throw e;
  }
};

/**
 * Trigger location data update (No authentication required)
 */
export const triggerLocationDataUpdateApi = async (updateStates = true, updateCities = true, force = false) => {
  try {
    // No authentication token required for this endpoint
    const response = await fetch(API_ENDPOINTS.TRIGGER_LOCATION_DATA_UPDATE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        updateStates,
        updateCities,
        force
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error in triggerLocationDataUpdateApi:', error);
    throw error;
  }
};

/**
 * Populate states directly (No authentication required)
 */
export const populateDropdownStatesApi = async () => {
  try {
    const response = await fetch(API_ENDPOINTS.POPULATE_DROPDOWN_STATES, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error in populateDropdownStatesApi:', error);
    throw error;
  }
};

/**
 * Populate cities directly (No authentication required)
 */
export const populateDropdownCitiesApi = async () => {
  try {
    const response = await fetch(API_ENDPOINTS.POPULATE_DROPDOWN_CITIES, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error in populateDropdownCitiesApi:', error);
    throw error;
  }
};
