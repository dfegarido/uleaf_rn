import {getStoredAuthToken} from '../../utils/getStoredAuthToken';

export const getManageListingApi = async (
  filterMine,
  sortBy,
  genus = [],
  variegation = [],
  listingType = [],
  status,
  discount,
  limit,
  plant,
  nextPageToken,
) => {
  try {
    const token = await getStoredAuthToken();
    const params = new URLSearchParams();

    params.append('filterMine', String(filterMine ?? ''));
    params.append('sortBy', sortBy ?? '');
    params.append('genus', Array.isArray(genus) ? genus.join(',') : '');
    params.append(
      'variegation',
      Array.isArray(variegation) ? variegation.join(',') : '',
    );
    params.append(
      'listingType',
      Array.isArray(listingType) ? listingType.join(',') : '',
    );
    params.append('status', status ?? '');
    params.append('discount', String(discount ?? ''));
    params.append('limit', limit ?? '');
    params.append('plant', plant ?? '');
    params.append('nextPageToken', nextPageToken ?? '');

    console.log(params.toString());

    const response = await fetch(
      `https://searchlisting-nstilwgvua-uc.a.run.app?${params.toString()}`,
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
    // console.error('getManageListingApi error:', error.message);
    throw error;
  }
};
