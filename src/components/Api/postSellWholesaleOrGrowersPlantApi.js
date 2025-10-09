import {getStoredAuthToken} from '../../utils/getStoredAuthToken';
import {API_ENDPOINTS} from '../../config/apiConfig';

export const postSellWholesaleOrGrowersPlantApi = async postData => {
  try {
    const token = await getStoredAuthToken();

    console.log(JSON.stringify(postData));
    const response = await fetch(API_ENDPOINTS.ADD_LISTING, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(postData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.log('postSellWholesaleOrGrowersPlantApi error:', error.message);
    throw error;
  }
};
