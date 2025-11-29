import { getStoredAuthToken } from '../../utils/getStoredAuthToken';
import { API_ENDPOINTS } from '../../config/apiConfig';

/**
 * Bulk update flight dates for a schedule date.
 *
 * @param {string} oldFlightDate - Old date in format YYYY-MM-DD
 * @param {string} newFlightDate - New date in format YYYY-MM-DD
 * @returns {Promise<Object>} API response
 */
export const updateFlightDateForScheduleApi = async (oldFlightDate, newFlightDate) => {
  try {
    const token = await getStoredAuthToken();

    console.log(
      '📅 updateFlightDateForScheduleApi - Updating schedule flight date:',
      oldFlightDate,
      '->',
      newFlightDate
    );
    console.log('API Endpoint:', `${API_ENDPOINTS.UPDATE_FLIGHT_DATE_FOR_SCHEDULE}`);

    const response = await fetch(`${API_ENDPOINTS.UPDATE_FLIGHT_DATE_FOR_SCHEDULE}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        oldFlightDate,
        newFlightDate,
      }),
    });

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData && errorData.error) {
          errorMessage = errorData.error;
        }
      } catch (e) {
        // ignore JSON parse errors
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('✅ updateFlightDateForScheduleApi - Success:', data);
    return data;
  } catch (error) {
    console.error('❌ updateFlightDateForScheduleApi - Error:', error);
    throw error;
  }
};


