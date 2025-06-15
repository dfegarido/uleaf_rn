import {getStoredAuthToken} from '../../utils/getStoredAuthToken';

export const postListingRenewActionApi = async plantCodes => {
  try {
    const token = await getStoredAuthToken();

    const response = await fetch(
      'https://renewpublishnow-nstilwgvua-uc.a.run.app',
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
    console.log('postListingRenewActionApi error:', error.message);
    throw error;
  }
};
