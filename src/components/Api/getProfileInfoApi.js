import {getStoredAuthToken} from '../../utils/getStoredAuthToken';
import {API_ENDPOINTS} from '../../config/apiConfig';

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
      console.log('Buyer endpoint failed, trying admin endpoint');
    }

    // Try admin endpoint second
    try {
      const adminResponse = await fetch(
        API_ENDPOINTS.GET_ADMIN_INFO,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (adminResponse.ok) {
        const adminJson = await adminResponse.json();
        return { 
          ...adminJson, 
          user: { 
            ...adminJson.user, 
            userType: adminJson.user?.role === 'sub_admin' ? 'sub_admin' : 'admin'
          } 
        };
      }
    } catch (adminError) {
      console.log('Admin endpoint failed, trying supplier endpoint');
    }

    // If buyer and admin endpoints fail, try supplier endpoint
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
    console.log('getProfileInfoApi error - all endpoints failed:', error.message);
    throw new Error('Unable to fetch user profile. User type not supported or network error.');
  }
};
