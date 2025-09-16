import { apiCall } from './apiCall';

import {getStoredAuthToken} from '../../utils/getStoredAuthToken';

export const deactivateBuyerApi = async () => {
  try {
    const token = await getStoredAuthToken();

    const response = await fetch(
      'https://us-central1-i-leaf-u.cloudfunctions.net/deactivateBuyer',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    const json = await response.json();
    return json;
  } catch (error) {
    console.log('deactivateBuyerApi error:', error.message);
    throw error;
  }
};