import {getStoredAuthToken} from '../../utils/getStoredAuthToken';

export const postProfileUpdateInfoApi = async (
  firstName,
  lastName,
  contactNumber,
  country,
  gardenOrCompanyName,
) => {
  try {
    const token = await getStoredAuthToken();

    const status = 'Inactive';
    const response = await fetch(
      'https://updatesupplier-nstilwgvua-uc.a.run.app',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          firstName,
          lastName,
          contactNumber,
          country,
          gardenOrCompanyName,
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.log('postProfileUpdateInfoApi error:', error.message);
    throw error;
  }
};
