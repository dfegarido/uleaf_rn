import {getStoredAuthToken} from '../../utils/getStoredAuthToken';

export const postListingPinActionApi = async (plantCode, pinTag) => {
  try {
    const token = await getStoredAuthToken();

    console.log(JSON.stringify({plantCode, pinTag}));
    const response = await fetch('https://pinlisting-nstilwgvua-uc.a.run.app', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({plantCode, pinTag}),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.log('postListingPinActionApi error:', error.message);
    throw error;
  }
};
