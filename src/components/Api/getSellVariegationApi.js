import {getStoredAuthToken} from '../../utils/getStoredAuthToken';

export const getSellVariegationApi = async (genus, species) => {
  try {
    const token = await getStoredAuthToken();
    const params = new URLSearchParams();
    params.append('genus', genus);
    params.append('species', species);

    const response = await fetch(
      `https://getvariegationfromplantcatalogdropdown-nstilwgvua-uc.a.run.app?${params.toString()}`,
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
    console.log('getSellVariegationApi error:', error.message);
    throw error; // optionally rethrow for use in UI
  }
};
