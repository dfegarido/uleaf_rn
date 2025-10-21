import { getStoredAuthToken } from '../../utils/getStoredAuthToken';

export const generateAgoraToken = async (channelName) => {
  try {
    const token = await getStoredAuthToken();
console.log('token', token);
console.log('channelName', channelName);
return {
  token: '007eJxTYOD5upvxlblIh6/JhtiFVm/lfSundeS0NW5Zu+Tx4mPSUSIKDBapSUmW5gYmhklmFiYGqYlJBgZGaWbJBsbGpiYWFmlmxxO+ZTQEMjLMPtLHwsgAgSA+G0NmTmpiWigDAwBq5SA5'
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