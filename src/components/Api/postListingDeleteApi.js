import {getStoredAuthToken} from '../../utils/getStoredAuthToken';

export const postListingDeleteApi = async plantCodes => {
  try {
    const token = await getStoredAuthToken();
    const params = new URLSearchParams();
    params.append('plantCode', plantCodes);

    const response = await fetch(
      `https://deletelistingbyplantcode-nstilwgvua-uc.a.run.app?${params.toString()}`,
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
    console.log('postListingDeleteApi error:', error.message);
    throw error;
  }
};
