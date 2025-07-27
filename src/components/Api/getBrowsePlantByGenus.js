import {getStoredAuthToken} from '../../utils/getStoredAuthToken';

export const getBrowsePlantByGenusApi = async genus => {
  try {
    const token = await getStoredAuthToken();
    const params = new URLSearchParams();

    // Only append genus parameter if it's provided
    if (genus) {
      params.append('genus', genus);
    }

    const response = await fetch(
      `https://us-central1-i-leaf-u.cloudfunctions.net/browsePlantsByGenus?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    const json = await response.json();
    return json;
  } catch (error) {
    console.log('getBrowsePlantByGenusApi error:', error.message);
    throw error;
  }
};
