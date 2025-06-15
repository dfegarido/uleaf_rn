import {getStoredAuthToken} from '../../utils/getStoredAuthToken';

export const postListingActivateActionApi = async plantCodes => {
  try {
    const token = await getStoredAuthToken();

    const status = 'Active';
    const response = await fetch(
      'https://updatelistingstatusbyplantcode-nstilwgvua-uc.a.run.app',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({plantCodes, status}),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.log('postListingActivateActionApi error:', error.message);
    throw error;
  }
};
