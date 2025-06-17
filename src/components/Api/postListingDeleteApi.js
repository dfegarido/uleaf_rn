import {getStoredAuthToken} from '../../utils/getStoredAuthToken';

export const postListingDeleteApi = async plantCodes => {
  try {
    const token = await getStoredAuthToken();

    const response = await fetch(
      'https://deletelistingbyplantcode-nstilwgvua-uc.a.run.app',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({plantCodes}),
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
