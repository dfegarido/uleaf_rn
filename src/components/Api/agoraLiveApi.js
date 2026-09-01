import { getStoredAuthToken } from '../../utils/getStoredAuthToken';
import { API_ENDPOINTS } from '../../config/apiConfig';

export const generateAgoraToken = async (channelName, agoraUid=null) => {
  try {
    const token = await getStoredAuthToken();
    
    const response = await fetch(API_ENDPOINTS.POST_GENERATE_LIVE_SESSION, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ channelName, agoraUid }),
    });

    return await response.json();
  } catch (error) {
    console.error('generateAgoraToken error:', error.message);
    return error; 
  }
};

export const createLiveSession = async (data) => {
  try {
    const token = await getStoredAuthToken();
    const url = API_ENDPOINTS.CREATE_LIVE_SESSION;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('createLiveSession error:', error.message);
    throw error;
  }
};

export const updateLiveSession = async (sessionId, data) => {
  try {
    const token = await getStoredAuthToken();
    const url = API_ENDPOINTS.UPDATE_LIVE_SESSION;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ sessionId, ...data }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('updateLiveSession error:', error.message);
    return error;
  }
};

export const getLiveListingsBySessionApi = async (sessionId, status='Live', sellerCode) => {
  try {
    if (!sessionId && !sellerCode) {
      throw new Error('Session ID or sellerCode is required');
    }

    const authToken = await getStoredAuthToken();
    const params = new URLSearchParams();
    if (sessionId) params.append('sessionId', sessionId);
    if (sellerCode) params.append('sellerCode', sellerCode);
    params.append('status', status);
    
    const response = await fetch(
      `${API_ENDPOINTS.GET_LIVE_LISTINGS_BY_SESSION}?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || errorData.error || `HTTP error! status: ${response.status}`,
      );
    }

    return await response.json();
  } catch (error) {
    console.error('Get live listings by session API error:', error);
    return { success: false, error: error.message };
  }
};

export const setLiveListingActiveApi = async ({ plantCode }) => {
  try {
    const token = await getStoredAuthToken();
    const response = await fetch(API_ENDPOINTS.SET_ACTIVE_LIVE_LISTING, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ plantCode }),
    });

    return await response.json();
  } catch (error) {
    console.error('setLiveListingActiveApi error:', error.message);
    return error;
  }
};

export const getActiveLiveListingApi = async (sellerId) => {
  try {
    const token = await getStoredAuthToken();
    const url = sellerId
      ? `${API_ENDPOINTS.GET_ACTIVE_LIVE_LISTING}?sellerId=${encodeURIComponent(sellerId)}`
      : API_ENDPOINTS.GET_ACTIVE_LIVE_LISTING;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    return await response.json();
  } catch (error) {
    console.error('getActiveLiveListingApi error:', error.message);
    return error;
  }
};

export const updateLiveSessionStatusApi = async (sessionId, newStatus) => {
  try {
    const token = await getStoredAuthToken();
    const url = `${API_ENDPOINTS.UPDATE_LIVE_SESSION_STATUS}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ sessionId, newStatus }),
    });

    return await response.json();
  } catch (error) {
    console.error('updateLiveSessionStatus error:', error.message);
    return error;
  }
};

export const addViewerToLiveSession = async (sessionId, profilePhotoUrl) => {
  try {
    const token = await getStoredAuthToken();
    const url = API_ENDPOINTS.ADD_VIEWER_TO_LIVE_SESSION;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ sessionId, profilePhotoUrl }),
    });

    return await response.json();
  } catch (error) {
    console.error('addViewerToLiveSession error:', error.message);
    return error;
  }
};

export const removeViewerFromLiveSession = async (sessionId) => {
  try {
    const token = await getStoredAuthToken();
    const url = API_ENDPOINTS.REMOVE_VIEWER_FROM_LIVE_SESSION;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ sessionId }),
    });

    return await response.json();
  } catch (error) {
    console.error('removeViewerFromLiveSession error:', error.message);
    return error;
  }
};

export const toggleLoveLiveSession = async (sessionId) => {
  try {
    const token = await getStoredAuthToken();

    const url = API_ENDPOINTS.TOGGLE_LOVE_LIVE_SESSION;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ sessionId }),
    });
    
    return await response.json();
  } catch (error) {
    console.error('toggleLoveLiveSession error:', error.message);
    return error;
  }
};

