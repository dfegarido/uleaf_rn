import {getStoredAuthToken} from '../../utils/getStoredAuthToken';
import {API_ENDPOINTS} from '../../config/apiConfig';

export const postListingPublishNowActionApi = async plantCodes => {
  try {
    const token = await getStoredAuthToken();
    const response = await fetch(API_ENDPOINTS.PUBLISH_LISTING, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({plantCodes, publishType: 'Publish Now'}),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.log('postListingPublishNowActionApi error:', error.message);
    throw error;
  }
};
