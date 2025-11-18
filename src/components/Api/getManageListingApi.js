import { API_ENDPOINTS } from '../../config/apiConfig';
import { getStoredAuthToken } from '../../utils/getStoredAuthToken';

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
  pinTag,
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
    // Ensure status is a valid string (not undefined or null)
    const statusValue = status && status.trim() !== '' ? status : 'All';
    params.append('status', statusValue);
    params.append('discount', String(discount ?? ''));
    
    console.log('📤 getManageListingApi - Status being sent:', statusValue);
    params.append('limit', limit ?? '');
    params.append('plant', plant ?? '');
    params.append('pinTag', pinTag ?? false);
    params.append('nextPageToken', nextPageToken ?? '');

    console.log(params.toString());

    const response = await fetch(
      `${API_ENDPOINTS.SEARCH_LISTING}?${params.toString()}`,
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
