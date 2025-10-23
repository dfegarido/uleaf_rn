import { getStoredAuthToken } from '../../utils/getStoredAuthToken';

export const generateAgoraToken = async (channelName, agoraUid=null) => {
  try {
    const token = await getStoredAuthToken();
console.log('token', token);
// return {
//   token: '007eJxTYJjbfqwt/lHSC7EPRl9urqt/eszh+k2/lDKdwL07ZCfWf5JSYLBITUqyNDcwMUwyszAxSE1MMjAwSjNLNjA2NjWxsEgzm3b5R0ZDICNDsM5PRkYGCATx2Rgyc1IT00IZGAB6VCMA'
// }
    
    const response = await fetch('https://us-central1-i-leaf-u.cloudfunctions.net/generateLiveSessionData', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ channelName, agoraUid }),
    });

    return await response.json();
  } catch (error) {
    console.log('generateAgoraToken error:', error.message);
    return error; 
  }
};

export const createLiveSession = async ({ title, coverPhoto, filename, mimeType }) => {
  try {
    const token = await getStoredAuthToken();
    // Use the local development URL for now.
    const url = `https://us-central1-i-leaf-u.cloudfunctions.net/createLiveSession`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title,
        coverPhoto,
        filename,
        mimeType,
      }),
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

export const getLiveListingsBySessionApi = async (sessionId) => {
  try {
    if (!sessionId) {
      throw new Error('Session ID is required');
    }

    const authToken = await getStoredAuthToken();
    
    const response = await fetch(
      `https://us-central1-i-leaf-u.cloudfunctions.net/getLiveListingsBySession?sessionId=${sessionId}`,
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

export const setLiveListingActiveApi = async ({ sessionId, plantCode }) => {
  try {
    const token = await getStoredAuthToken();
    const response = await fetch('https://us-central1-i-leaf-u.cloudfunctions.net/setActiveLiveListing', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ sessionId, plantCode }),
    });

    return await response.json();
  } catch (error) {
    console.error('setLiveListingActiveApi error:', error.message);
    return error;
  }
};

export const getActiveLiveListingApi = async (sessionId) => {
  try {
    const token = await getStoredAuthToken();
    // Use the local development URL for now.
    const url = `https://us-central1-i-leaf-u.cloudfunctions.net/getActiveLiveListing?sessionId=${sessionId}`;

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
    const url = `https://us-central1-i-leaf-u.cloudfunctions.net/updateLiveSessionStatus`;

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