import { getStoredAuthToken } from '../../utils/getStoredAuthToken';

export const generateAgoraToken = async (channelName) => {
  try {
    const token = await getStoredAuthToken();
console.log('token', token);
console.log('channelName', channelName);
return {
  token: '007eJxTYJjbfqwt/lHSC7EPRl9urqt/eszh+k2/lDKdwL07ZCfWf5JSYLBITUqyNDcwMUwyszAxSE1MMjAwSjNLNjA2NjWxsEgzm3b5R0ZDICNDsM5PRkYGCATx2Rgyc1IT00IZGAB6VCMA'
}
    const url = `https://us-central1-i-leaf-u.cloudfunctions.net/generateAgoraToken`
    
    const response = await fetch(
      url,
      {
        method: 'POST', 
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          channelName
        })
      },
    );
console.log('response', response);

    const json = await response.json();
    return json;
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