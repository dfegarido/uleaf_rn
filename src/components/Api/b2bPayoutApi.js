import {getStoredAuthToken} from '../../utils/getStoredAuthToken';
import {API_ENDPOINTS} from '../../config/apiConfig';

const postB2BPayout = async (url, body = {}) => {
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

export const listB2BPayoutApi = async (params = {}) => {
  try {
    const data = await postB2BPayout(API_ENDPOINTS.LIST_B2B_PAYOUT, params);
    return {success: true, data: data.data, source: data.source};
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Could not load B2B payouts',
    };
  }
};

export const getB2BPayoutDetailApi = async payoutId => {
  try {
    const data = await postB2BPayout(API_ENDPOINTS.LIST_B2B_PAYOUT, {payoutId});
    return {success: true, data: data.data, source: data.source};
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Could not load B2B payout detail',
    };
  }
};

export const updateB2BPayoutApi = async payload => {
  try {
    const data = await postB2BPayout(API_ENDPOINTS.UPDATE_B2B_PAYOUT, payload);
    return {success: true, data: data.data, source: data.source};
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Could not update B2B payout',
    };
  }
};
