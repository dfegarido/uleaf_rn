import {getStoredAuthToken} from '../../utils/getStoredAuthToken';

export const getSellSpeciesApi = async genus => {
  try {
    const token = await getStoredAuthToken();
    const params = new URLSearchParams();
    params.append('genus', genus);

    const response = await fetch(
      `https://getspeciesfromplantcatalogdropdown-nstilwgvua-uc.a.run.app?${params.toString()}`,
      {
        method: 'GET', // or 'POST' if your function expects a body
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`, // Pass token in Authorization header
        },
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    const json = await response.json();
    return json;
  } catch (error) {
    console.log('getSellSpeciesApi error:', error.message);
    throw error; // optionally rethrow for use in UI
  }
};
