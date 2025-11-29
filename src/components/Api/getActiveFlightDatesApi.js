import { getStoredAuthToken } from '../../utils/getStoredAuthToken';
import { API_ENDPOINTS } from '../../config/apiConfig';

/**
 * Get Active Flight Dates - Returns only active Saturday flight dates
 * @param {string} startDate - Start date in format YYYY-MM-DD
 * @param {number} count - Number of active dates to return (default: 3)
 * @returns {Promise<Object>} Response with active flight dates array
 */
export const getActiveFlightDatesApi = async (startDate, count = 3) => {
  try {
    const token = await getStoredAuthToken();

    console.log(`📅 getActiveFlightDatesApi - Fetching active dates from: ${startDate}, count: ${count}`);
    console.log('API Endpoint:', API_ENDPOINTS.GET_ACTIVE_FLIGHT_DATES);

    const response = await fetch(API_ENDPOINTS.GET_ACTIVE_FLIGHT_DATES, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        startDate: startDate,
        count: count,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Active flight dates fetched successfully');
    console.log(`📦 Received ${data.data?.activeDates?.length || 0} active dates`);

    return data;
  } catch (error) {
    console.error('❌ getActiveFlightDatesApi - Error:', error);
    throw error;
  }
};

