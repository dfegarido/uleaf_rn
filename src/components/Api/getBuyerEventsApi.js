import {getStoredAuthToken} from '../../utils/getStoredAuthToken';

export const getBuyerEventsApi = async () => {
  try {
    const token = await getStoredAuthToken();

    const response = await fetch(
      'https://getnewsandevent-nstilwgvua-uc.a.run.app',
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'User-Type': 'buyer', // Add user type to differentiate content
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
    console.log('getBuyerEventsApi error:', error.message);
    throw error;
  }
};
