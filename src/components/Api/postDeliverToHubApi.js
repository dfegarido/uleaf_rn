import {getStoredAuthToken} from '../../utils/getStoredAuthToken';

export const postDeliverToHubApi = async (trxNumbers, deliveryStatus) => {
  try {
    const token = await getStoredAuthToken();

    console.log(JSON.stringify({trxNumbers, deliveryStatus}));
    const response = await fetch(
      'https://updatedeliverystatusbytrxnumber-nstilwgvua-uc.a.run.app',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({trxNumbers, deliveryStatus}),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.log('postDeliverToHubApi error:', error.message);
    throw error;
  }
};
