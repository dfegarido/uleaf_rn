import {getStoredAuthToken} from '../../utils/getStoredAuthToken';

export const getHomeBusinessPerformanceApi = async interval => {
  try {
    const token = await getStoredAuthToken();

    const response = await fetch(
      'https://getlistingreport-nstilwgvua-uc.a.run.app',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`, // use token from AsyncStorage
        },

        body: JSON.stringify({interval}),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    const json = await response.json();
    return json;
  } catch (error) {
    console.log('getHomeBusinessPerformanceApi error:', error.message);
    throw error;
  }
};
