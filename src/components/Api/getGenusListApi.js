import {getStoredAuthToken} from '../../utils/getStoredAuthToken';
import { API_ENDPOINTS } from '../../config/apiConfig';

export const getGenusListApi = async () => {
  try {
    console.log('🌿 Starting getGenusListApi call...');
    
    const token = await getStoredAuthToken();
    console.log('🔑 Token retrieved:', token ? 'Token exists' : 'No token found');
    
    const url = API_ENDPOINTS.GET_GENUS_LIST;
    console.log('🌐 API URL:', url);
    
    // For local testing, we'll still send the request even without a token
    const headers = {
      'Content-Type': 'application/json',
    };
    
    // Only add authorization header if we have a token
    if (token) {
      headers.Authorization = `Bearer ${token}`;
      console.log('🔐 Added authorization header');
    } else {
      console.log('⚠️ No token available, proceeding without auth (local testing)');
    }
    
    console.log('📡 Making API request...');
    const response = await fetch(url, {
      method: 'GET',
      headers: headers,
    });

    console.log('📡 Response status:', response.status);
    console.log('📡 Response OK:', response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error Response:', errorText);
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    const json = await response.json();
    console.log('✅ API Response received:', {
      success: json.success,
      count: json.data?.length || 0,
      source: json.source
    });
    
    if (!json.success) {
      throw new Error(json.error || 'API request failed');
    }

    return json;
  } catch (error) {
    console.error('🚨 getGenusListApi error:', error.message);
    console.error('🚨 Full error:', error);
    throw error;
  }
};
