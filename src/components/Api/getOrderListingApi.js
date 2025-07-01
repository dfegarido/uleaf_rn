import {getStoredAuthToken} from '../../utils/getStoredAuthToken';

export const getOrderListingApi = async (
  limit,
  sortBy,
  date,
  deliveryStatus,
  listingType = [],
  nextPageToken,
  startDate,
  endDate,
) => {
  try {
    const token = await getStoredAuthToken();
    const params = new URLSearchParams();

    params.append('limit', limit ?? '');
    params.append('sortBy', sortBy ?? '');
    params.append('date', date ?? '');
    params.append('deliveryStatus', deliveryStatus ?? '');
    params.append(
      'listingType',
      Array.isArray(listingType) ? listingType.join(',') : '',
    );
    params.append('startDate', startDate ?? '');
    params.append('endDate', endDate ?? '');
    params.append('nextPageToken', nextPageToken ?? '');

    console.log(params.toString());

    const response = await fetch(
      `https://getorders-nstilwgvua-uc.a.run.app?${params.toString()}`,
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
    // console.error('getOrderListingApi error:', error.message);
    throw error;
  }
};
