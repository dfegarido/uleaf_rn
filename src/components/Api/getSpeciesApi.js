import {getStoredAuthToken} from '../../utils/getStoredAuthToken';

export const getSpeciesApi = async () => {
  try {
    const token = await getStoredAuthToken();

    const response = await fetch(
      'https://getspeciesdropdown-nstilwgvua-uc.a.run.app',
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
    console.log('getSpeciesApi error:', error.message);
    throw error; // optionally rethrow for use in UI
  }
};
