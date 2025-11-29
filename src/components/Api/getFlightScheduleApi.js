import { getStoredAuthToken } from '../../utils/getStoredAuthToken';
import { API_ENDPOINTS } from '../../config/apiConfig';

/**
 * Get flight schedule - All Saturday flight dates for the next 2 months
 * @returns {Promise<Object>} Flight schedule response with events
 */
export const getFlightScheduleApi = async () => {
  try {
    const token = await getStoredAuthToken();

    console.log('📅 getFlightScheduleApi - Fetching flight schedule...');
    console.log('API Endpoint:', `${API_ENDPOINTS.GET_FLIGHT_SCHEDULE}`);

    const response = await fetch(`${API_ENDPOINTS.GET_FLIGHT_SCHEDULE}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Flight schedule fetched successfully');
    console.log(`📦 Got ${data.data?.length || 0} flight dates`);

    return data;
  } catch (error) {
    console.error('❌ getFlightScheduleApi - Error:', error);
    throw error;
  }
};
