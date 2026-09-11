import {getStoredAuthToken} from '../../utils/getStoredAuthToken';
import {API_ENDPOINTS} from '../../config/apiConfig';

const postB2BFee = async (url, body = {}) => {
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

export const getB2BFeeConfigApi = async () => {
  try {
    const data = await postB2BFee(API_ENDPOINTS.GET_B2B_FEE_CONFIG, {});
    return {success: true, data: data.data, source: data.source};
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Could not load B2B fee configuration',
    };
  }
};

export const updateB2BFeeConfigApi = async payload => {
  try {
    const data = await postB2BFee(API_ENDPOINTS.UPDATE_B2B_FEE_CONFIG, payload);
    return {success: true, data: data.data, source: data.source};
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Could not save B2B fee configuration',
    };
  }
};
