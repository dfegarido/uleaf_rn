import {getStoredAuthToken} from '../../utils/getStoredAuthToken';
import { API_CONFIG } from '../../config/apiConfig';

export const uploadProfilePhotoApi = async (imageUri, overrideToken = null) => {
  console.log('Starting uploadProfilePhotoApi...');
  const token = overrideToken || await getStoredAuthToken();

  // Build headers like your snippet
  const myHeaders = new Headers();
  myHeaders.append('Authorization', `Bearer ${token || ''}`);

  // Build formdata
  const formdata = new FormData();
  // For React Native, append an object with uri, name and type
  const filename = typeof imageUri === 'string' ? imageUri.split('/').pop() : 'photo.jpg';
  const ext = filename && filename.includes('.') ? filename.split('.').pop().toLowerCase() : '';
  const mimeMap = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp' };
  const mimeType = mimeMap[ext] || 'image/jpeg';
  formdata.append('profilePhoto', { uri: imageUri, name: filename, type: mimeType });

  // Use API_CONFIG to get base URL for local/prod
  const base = API_CONFIG.BASE_URL;
  const url = `${base}/uploadProfilePhoto`;
  console.log('Uploading to URL:', url);

  const requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: formdata,
    redirect: 'follow'
  };

  try {
    const response = await fetch(url, requestOptions);
    const text = await response.text();
    console.log('Upload response status:', response.status);
    console.log('Raw response text:', text);

    let result = null;
    try { result = JSON.parse(text); } catch (e) { /* not JSON */ }

    if (response.ok) {
      return result || { success: true, raw: text };
    }

    const err = new Error((result && (result.message || result.error)) || `Server error (${response.status})`);
    err.status = response.status;
    err.serverResponse = result || { raw: text };
    throw err;
  } catch (error) {
    console.error('Network error during upload (primary URL):', error);
    // Retry fallback: if using Android emulator address 10.0.2.2, try localhost/127.0.0.1
    try {
      if (base.includes('10.0.2.2')) {
        const altBase = base.replace('10.0.2.2', '127.0.0.1');
        const altUrl = `${altBase}/uploadProfilePhoto`;
        console.log('Retrying upload to alternate URL:', altUrl);
        const response2 = await fetch(altUrl, requestOptions);
        const text2 = await response2.text();
        let result2 = null;
        try { result2 = JSON.parse(text2); } catch (e) {}
        if (response2.ok) return result2 || { success: true, raw: text2 };
        const err2 = new Error((result2 && (result2.message || result2.error)) || `Server error (${response2.status})`);
        err2.status = response2.status;
        err2.serverResponse = result2 || { raw: text2 };
        throw err2;
      }
    } catch (retryErr) {
      console.error('Retry attempt failed:', retryErr);
      throw retryErr;
    }

    throw error;
  }
};
