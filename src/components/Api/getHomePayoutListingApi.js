import {getStoredAuthToken} from '../../utils/getStoredAuthToken';

export const getHomePayoutListingApi = async nextPageToken => {
  try {
    const token = await getStoredAuthToken();
    const params = new URLSearchParams();
    params.append('nextPageToken', nextPageToken ?? '');

    console.log(params.toString());

    const response = await fetch(
      `https://listpayout-nstilwgvua-uc.a.run.app?${params.toString()}`,
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

    return await response.json();
  } catch (error) {
    // console.error('getHomePayoutListingApi error:', error.message);
    throw error;
  }
};
