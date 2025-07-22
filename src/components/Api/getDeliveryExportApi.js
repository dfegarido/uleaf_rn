import {getStoredAuthToken} from '../../utils/getStoredAuthToken';

export const getDeliveryExportApi = async (startDate, endDate) => {
  try {
    const token = await getStoredAuthToken();

    // Get current month's first and last day as defaults
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    
    const defaultStartDate = firstDayOfMonth.toISOString().split('T')[0];
    const defaultEndDate = lastDayOfMonth.toISOString().split('T')[0];

    // Construct the URL with query parameters
    const baseUrl = 'https://us-central1-i-leaf-u.cloudfunctions.net/deliveryExport';
    const params = new URLSearchParams({
      startDate: startDate || defaultStartDate,
      endDate: endDate || defaultEndDate,
      format: 'excel'
    });
    const url = `${baseUrl}?${params.toString()}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`, // use token from AsyncStorage
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    const json = await response.json();
    return json;
  } catch (error) {
    console.log('getDeliveryExportApi error:', error.message);
    throw error;
  }
};
