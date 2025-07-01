import {getStoredAuthToken} from '../../utils/getStoredAuthToken';

export const postProfileReportProblemApi = async (description, imageUrl) => {
  try {
    const token = await getStoredAuthToken();

    const status = 'Inactive';
    const response = await fetch(
      'https://reportproblem-nstilwgvua-uc.a.run.app',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({description, imageUrl}),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.log('postProfileReportProblemApi error:', error.message);
    throw error;
  }
};
