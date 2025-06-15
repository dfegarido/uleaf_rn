import {getStoredAuthToken} from '../../utils/getStoredAuthToken';

export const postListingApplyDiscountActionApi = async (
  plantCodes,
  discountPrice,
  discountPercent,
) => {
  try {
    const token = await getStoredAuthToken();
    console.log(JSON.stringify({plantCodes, discountPrice, discountPercent}));
    const response = await fetch(
      'https://updatelistingdiscountbyplantcode-nstilwgvua-uc.a.run.app',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({plantCodes, discountPrice, discountPercent}),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.log('postListingApplyDiscountActionApi error:', error.message);
    throw error;
  }
};
