import { getStoredAuthToken } from '../../utils/getStoredAuthToken';
import { API_ENDPOINTS } from '../../config/apiConfig';

/**
 * Update Flight Date Status - Activate or deactivate a flight date
 * @param {string} flightDate - Date in format YYYY-MM-DD
 * @param {boolean} isActive - true to activate, false to deactivate
 * @param {string} inactiveNote - Optional note explaining why the date is inactive
 * @returns {Promise<Object>} Response with success status
 */
export const updateFlightDateStatusApi = async (flightDate, isActive, inactiveNote = '') => {
  try {
    const token = await getStoredAuthToken();

    console.log(`📅 updateFlightDateStatusApi - Updating ${flightDate} to ${isActive ? 'active' : 'inactive'}`);
    console.log('API Endpoint:', `${API_ENDPOINTS.UPDATE_FLIGHT_DATE_STATUS}`);

    const response = await fetch(`${API_ENDPOINTS.UPDATE_FLIGHT_DATE_STATUS}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        flightDate: flightDate,
        isActive: isActive,
        inactiveNote: inactiveNote,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Flight date status updated successfully');
    console.log(`📦 ${data.message}`);

    return data;
  } catch (error) {
    console.error('❌ updateFlightDateStatusApi - Error:', error);
    throw error;
  }
};

