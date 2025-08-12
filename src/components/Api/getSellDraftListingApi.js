import {getStoredAuthToken} from '../../utils/getStoredAuthToken';

export const getSellDraftListingApi = async (limit, nextPageToken) => {
  try {
    const token = await getStoredAuthToken();
    const params = new URLSearchParams();
    params.append('limit', limit);
    params.append('nextPageToken', nextPageToken);

    const response = await fetch(
      `https://searchdraftlistings-nstilwgvua-uc.a.run.app?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`, // use token from AsyncStorage
        },
      },
    );
    // console.log(response.json());
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    const json = await response.json();
    return json;
  } catch (error) {
    console.log('getSellDraftListingApi error:', error.message);
    throw error;
  }
};
