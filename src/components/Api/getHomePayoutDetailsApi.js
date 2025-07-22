import {getStoredAuthToken} from '../../utils/getStoredAuthToken';

export const getHomePayoutDetailsApi = async workWeek => {
  try {
    const token = await getStoredAuthToken();
    // const params = new URLSearchParams();
    // params.append('workWeek', workWeek) ?? '';

    // console.log(params.toString());

    const response = await fetch(
      `https://listpayoutdetail-nstilwgvua-uc.a.run.app/`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({workWeek}),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    // console.error('getHomePayoutDetailsApi error:', error.message);
    throw error;
  }
};
