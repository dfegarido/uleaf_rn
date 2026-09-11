import {getStoredAuthToken} from '../../utils/getStoredAuthToken';
import {API_ENDPOINTS} from '../../config/apiConfig';

const postB2BAccount = async (url, body = {}) => {
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

export const getB2BAccountApi = async (params = {}) => {
  try {
    const data = await postB2BAccount(API_ENDPOINTS.GET_B2B_ACCOUNT, params);
    return {success: true, data: data.data, source: data.source};
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Could not load B2B account',
    };
  }
};

export const listB2BBusinessRequestApi = async (params = {}) => {
  try {
    const data = await postB2BAccount(
      API_ENDPOINTS.LIST_B2B_BUSINESS_REQUEST,
      params,
    );
    return {success: true, data: data.data, source: data.source};
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Could not load business requests',
    };
  }
};

export const updateB2BBusinessRequestApi = async payload => {
  try {
    const data = await postB2BAccount(
      API_ENDPOINTS.UPDATE_B2B_BUSINESS_REQUEST,
      payload,
    );
    return {success: true, data: data.data, source: data.source};
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Could not update business request',
    };
  }
};
