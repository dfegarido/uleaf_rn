import {getStoredAuthToken} from '../../utils/getStoredAuthToken';

export const getProfileInfoApi = async () => {
  try {
    const token = await getStoredAuthToken();

    // Try buyer endpoint first
    try {
      const buyerResponse = await fetch(
        'https://us-central1-i-leaf-u.cloudfunctions.net/getBuyerInfo',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (buyerResponse.ok) {
        const buyerJson = await buyerResponse.json();
        return { 
          ...buyerJson, 
          user: { 
            ...buyerJson.user, 
            userType: 'buyer' 
          } 
        };
      }
    } catch (buyerError) {
      console.log('Buyer endpoint failed, trying supplier endpoint');
    }

    // If buyer endpoint fails, try supplier endpoint
    const supplierResponse = await fetch(
      'https://getsupplierinfo-nstilwgvua-uc.a.run.app/',
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!supplierResponse.ok) {
      const errorText = await supplierResponse.text();
      throw new Error(`Error ${supplierResponse.status}: ${errorText}`);
    }

    const supplierJson = await supplierResponse.json();
    return { 
      ...supplierJson, 
      user: { 
        ...supplierJson.user, 
        userType: 'supplier' 
      } 
    };
  } catch (error) {
    console.log('getProfileInfoApi error:', error.message);
    throw error;
  }
};
