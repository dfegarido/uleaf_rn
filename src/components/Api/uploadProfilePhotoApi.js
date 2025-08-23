import {getStoredAuthToken} from '../../utils/getStoredAuthToken';

export const uploadProfilePhotoApi = async imageUri => {
  console.log('Starting uploadProfilePhotoApi...');
  
  const token = await getStoredAuthToken();
  console.log('Auth token retrieved.');

  // Prepare file for upload using React Native friendly FormData file object
  // (This avoids some issues with fetch() on Android content:// URIs)
  console.log('Preparing file for upload, imageUri:', imageUri);
  const filename = imageUri.split('/').pop();
  console.log('Filename extracted:', filename);

  // Infer mime type from extension (fallback to image/jpeg)
  const ext = filename && filename.includes('.') ? filename.split('.').pop().toLowerCase() : '';
  const mimeMap = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp'
  };
  const mimeType = mimeMap[ext] || 'image/jpeg';
  console.log('Inferred mimeType:', mimeType);

  const formData = new FormData();
  // React Native accepts an object with uri, name and type for file uploads
  formData.append('profilePhoto', { uri: imageUri, name: filename, type: mimeType });
  console.log('FormData created (RN file object).');

  const url = 'http://192.168.0.208:5001/i-leaf-u/us-central1/uploadProfilePhoto';
  console.log('Uploading to URL:', url);

  // Pre-flight OPTIONS request for debugging CORS
  console.log('Performing pre-flight OPTIONS request to check CORS...');
  try {
    const optionsResponse = await fetch(url, { method: 'OPTIONS' });
    console.log(`Pre-flight OPTIONS request status: ${optionsResponse.status}`);
    if (!optionsResponse.ok) {
        console.warn(`Pre-flight OPTIONS request failed with status: ${optionsResponse.status}. This might indicate a CORS or server configuration issue.`);
    }
  } catch (e) {
      console.error('Pre-flight OPTIONS request threw an error:', e);
  }

  console.log('Proceeding with POST request...');
  const uploadResponse = await fetch(
    url,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    },
  );
  
  console.log('Upload response status:', uploadResponse.status);
  const result = await uploadResponse.json();
  console.log('Upload response JSON:', result);

  if (uploadResponse.ok && result.success) {
    console.log('Profile photo uploaded successfully:', result.profilePhotoUrl);
    return result;
  } else {
    console.error('Upload failed:', result);
    throw new Error(result.message || result.error || 'Unknown error during upload');
  }
};
