import {getStoredAuthToken} from '../../utils/getStoredAuthToken';

export const postProfileRequestGenusApi = async (genus, species) => {
  try {
    const token = await getStoredAuthToken();

    const status = 'Inactive';
    const response = await fetch(
      'https://insertgenusrequest-nstilwgvua-uc.a.run.app',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({genus, species}),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.log('postProfileRequestGenusApi error:', error.message);
    throw error;
  }
};
