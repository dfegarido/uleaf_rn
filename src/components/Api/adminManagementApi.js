import {getStoredAuthToken} from '../../utils/getStoredAuthToken';
import {API_ENDPOINTS} from '../../config/apiConfig';

/**
 * Create a new admin or sub-admin user
 * @param {Object} adminData - Admin user data
 * @param {string} adminData.email - Email address
 * @param {string} adminData.password - Password (min 8 characters)
 * @param {string} adminData.firstName - First name
 * @param {string} adminData.lastName - Last name
 * @param {string} adminData.role - Role: "admin" or "sub_admin"
 * @param {Array<string>} adminData.permissions - Array of permissions for sub_admin
 * @param {string} [adminData.phoneNumber] - Optional phone number
 * @param {string} [adminData.department] - Optional department
 * @param {string} [adminData.notes] - Optional notes
 * @returns {Promise<Object>} Response with created admin data
 */
export const createAdminApi = async (adminData) => {
  try {
    const token = await getStoredAuthToken();

    const response = await fetch(API_ENDPOINTS.CREATE_ADMIN, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(adminData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || errorData.errors?.join(', ') || `Error ${response.status}`);
    }

    const json = await response.json();
    return json;
  } catch (error) {
    console.log('createAdminApi error:', error.message);
    throw error;
  }
};

/**
 * Update an existing admin user
 * @param {Object} updateData - Admin update data
 * @param {string} updateData.adminId - ID of admin to update
 * @param {string} [updateData.firstName] - First name
 * @param {string} [updateData.lastName] - Last name
 * @param {string} [updateData.phoneNumber] - Phone number
 * @param {string} [updateData.department] - Department
 * @param {string} [updateData.status] - Status (active/inactive) - only admin can change
 * @param {Array<string>} [updateData.permissions] - Permissions array - only admin can change
 * @param {string} [updateData.notes] - Notes
 * @returns {Promise<Object>} Response with updated admin data
 */
export const updateAdminApi = async (updateData) => {
  try {
    const token = await getStoredAuthToken();

    const response = await fetch(API_ENDPOINTS.UPDATE_ADMIN, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || errorData.errors?.join(', ') || `Error ${response.status}`);
    }

    const json = await response.json();
    return json;
  } catch (error) {
    console.log('updateAdminApi error:', error.message);
    throw error;
  }
};

/**
 * Delete an admin user
 * @param {string} adminId - ID of admin to delete
 * @returns {Promise<Object>} Response confirming deletion
 */
export const deleteAdminApi = async (adminId) => {
  try {
    const token = await getStoredAuthToken();

    const response = await fetch(API_ENDPOINTS.DELETE_ADMIN, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({adminId}),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || errorData.errors?.join(', ') || `Error ${response.status}`);
    }

    const json = await response.json();
    return json;
  } catch (error) {
    console.log('deleteAdminApi error:', error.message);
    throw error;
  }
};
