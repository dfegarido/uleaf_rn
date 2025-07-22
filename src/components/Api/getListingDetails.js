import {getStoredAuthToken} from '../../utils/getStoredAuthToken';

export const getListingDetails = async plantCode => {
  try {
    const token = await getStoredAuthToken();
    const params = new URLSearchParams();
    params.append('plantCode', plantCode);
    console.log(`https://getlisting-nstilwgvua-uc.a.run.app?${params.toString()}`);

    const response = await fetch(
      `https://getlisting-nstilwgvua-uc.a.run.app?${params.toString()}`,
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

    const json = await response.json();
    return json;
  } catch (error) {
    console.log('getListingDetails error:', error.message);
    throw error;
  }
};
