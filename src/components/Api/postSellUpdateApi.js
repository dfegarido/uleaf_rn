import {getStoredAuthToken} from '../../utils/getStoredAuthToken';

export const postSellUpdateApi = async postData => {
  try {
    const token = await getStoredAuthToken();

    console.log(JSON.stringify(postData));
    const response = await fetch(
      'https://updatelisting-nstilwgvua-uc.a.run.app/',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(postData),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.log('postSellUpdateApi error:', error.message);
    throw error;
  }
};
