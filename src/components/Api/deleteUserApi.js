import {getStoredAuthToken} from '../../utils/getStoredAuthToken';
import {API_CONFIG} from '../../config/apiConfig';

/**
 * Deletes a user account (Admin only)
 * 
 * @param {string} userId - The ID of the user to delete
 * @param {string} notes - Optional notes about the deletion
 * @returns {Promise} Promise that resolves to the API response
 */
export const deleteUserApi = async (userId, notes = null) => {
  try {
    const token = await getStoredAuthToken();
    
    // Use BASE_URL directly from API_CONFIG
    const url = `${API_CONFIG.BASE_URL}/deleteUser`;
    
    const response = await fetch(
      url,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId,
          notes
        }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      // Handle API errors
      console.error('Error deleting user:', data.message);
      throw new Error(data.message || 'Failed to delete user');
    }

    return data;
  } catch (error) {
    console.error('Error in deleteUserApi:', error);
    throw error;
  }
};
