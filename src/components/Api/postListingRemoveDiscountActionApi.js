import {getStoredAuthToken} from '../../utils/getStoredAuthToken';

export const postListingRemoveDiscountActionApi = async plantCode => {
  try {
    const token = await getStoredAuthToken();

    console.log(JSON.stringify({plantCode}));
    const response = await fetch(
      'https://removelistingdiscountbyplantcode-nstilwgvua-uc.a.run.app',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({plantCode}),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.log('postListingRemoveDiscountActionApi error:', error.message);
    throw error;
  }
};
