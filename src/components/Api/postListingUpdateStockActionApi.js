import {getStoredAuthToken} from '../../utils/getStoredAuthToken';

export const postListingUpdateStockActionApi = async (
  plantCode,
  potSize,
  availableQty,
) => {
  try {
    const token = await getStoredAuthToken();

    console.log(JSON.stringify({plantCode, potSize, availableQty}));
    const response = await fetch(
      'https://updatelistingvariationqtybypotsize-nstilwgvua-uc.a.run.app',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({plantCode, potSize, availableQty}),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.log('postListingUpdateStockActionApi error:', error.message);
    throw error;
  }
};
