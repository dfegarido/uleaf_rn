import {getStoredAuthToken} from '../../utils/getStoredAuthToken';
import {API_ENDPOINTS} from '../../config/apiConfig';

const postB2BListing = async (url, body = {}) => {
  const authToken = await getStoredAuthToken();
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.success === false) {
    throw new Error(data.error || data.message || `HTTP ${response.status}`);
  }
  return data;
};

export const updateB2BListingApi = async listings => {
  try {
    const data = await postB2BListing(API_ENDPOINTS.UPDATE_B2B_LISTING, {listings});
    return {success: true, data: data.data, source: data.source};
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Could not update B2B listings',
    };
  }
};
