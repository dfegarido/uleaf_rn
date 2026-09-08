import { API_ENDPOINTS } from '../../config/apiConfig';
import { getStoredAuthToken } from '../../utils/getStoredAuthToken';

const request = async (url, options = {}) => {
  const token = await getStoredAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };
  const res = await fetch(url, { ...options, headers });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) {
    throw new Error(data.message || data.error || `HTTP ${res.status}`);
  }
  return data;
};

// ---- Buyer Content (Deals / Rewards / News) ----

export const getAdminBuyerContentApi = async () => {
  try {
    const data = await request(`${API_ENDPOINTS.GET_BUYER_CONTENT}?action=list`);
    return { success: true, data: data.data || [] };
  } catch (e) {
    return { success: false, error: e.message };
  }
};

export const createBuyerContentApi = async (item) => {
  try {
    const data = await request(API_ENDPOINTS.GET_BUYER_CONTENT, { method: 'POST', body: JSON.stringify(item) });
    return { success: true, data };
  } catch (e) {
    return { success: false, error: e.message };
  }
};

export const updateBuyerContentApi = async (id, item) => {
  try {
    const data = await request(`${API_ENDPOINTS.GET_BUYER_CONTENT}?id=${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(item) });
    return { success: true, data };
  } catch (e) {
    return { success: false, error: e.message };
  }
};

export const deleteBuyerContentApi = async (id) => {
  try {
    const data = await request(`${API_ENDPOINTS.GET_BUYER_CONTENT}?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    return { success: true, data };
  } catch (e) {
    return { success: false, error: e.message };
  }
};

// ---- Chat Shops ----

export const getChatShopsAdminApi = async () => {
  try {
    const data = await request(API_ENDPOINTS.GET_CHAT_SHOPS);
    return { success: true, data: data.data || [] };
  } catch (e) {
    return { success: false, error: e.message };
  }
};

export const getGroupChatsApi = async () => {
  try {
    const data = await request(`${API_ENDPOINTS.GET_CHAT_SHOPS}?action=groupChats`);
    return { success: true, data: data.data || [] };
  } catch (e) {
    return { success: false, error: e.message };
  }
};

export const getGroupChatDetailApi = async (id) => {
  try {
    const data = await request(`${API_ENDPOINTS.GET_CHAT_SHOPS}?action=groupChat&id=${encodeURIComponent(id)}`);
    return { success: true, data: data.data };
  } catch (e) {
    return { success: false, error: e.message };
  }
};

export const createChatShopApi = async (shop) => {
  try {
    const data = await request(API_ENDPOINTS.GET_CHAT_SHOPS, { method: 'POST', body: JSON.stringify(shop) });
    return { success: true, data };
  } catch (e) {
    return { success: false, error: e.message };
  }
};

export const updateChatShopApi = async (id, shop) => {
  try {
    const data = await request(`${API_ENDPOINTS.GET_CHAT_SHOPS}?id=${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(shop) });
    return { success: true, data };
  } catch (e) {
    return { success: false, error: e.message };
  }
};

export const deleteChatShopApi = async (id) => {
  try {
    const data = await request(`${API_ENDPOINTS.GET_CHAT_SHOPS}?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    return { success: true, data };
  } catch (e) {
    return { success: false, error: e.message };
  }
};

// ---- Leaf Points / Credit Buyers ----

export const getLeafPointsApi = async () => {
  try {
    const data = await request(API_ENDPOINTS.LEAF_POINTS);
    return { success: true, data: data.data || [] };
  } catch (e) {
    return { success: false, error: e.message };
  }
};

export const getCreditBuyersApi = async () => {
  try {
    const data = await request(API_ENDPOINTS.CREDIT_BUYERS);
    return { success: true, data: data.data || [] };
  } catch (e) {
    return { success: false, error: e.message };
  }
};
