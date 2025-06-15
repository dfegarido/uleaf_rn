import {getStoredAuthToken} from '../../utils/getStoredAuthToken';

export const getSellMostLove = async () => {
  try {
    const token = await getStoredAuthToken();
    const params = new URLSearchParams();
    params.append('limit', '5');

    const response = await fetch(
      'https://getmostlovelisting-nstilwgvua-uc.a.run.app',
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`, // use token from AsyncStorage
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
    console.log('getSellMostLove error:', error.message);
    throw error;
  }
};
