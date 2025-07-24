import {getStoredAuthToken} from '../../utils/getStoredAuthToken';

export const uploadProfilePhotoApi = async imageUri => {
  console.log('Starting uploadProfilePhotoApi...');
  
  const token = await getStoredAuthToken();
  console.log('Auth token retrieved.');

  // Convert image to blob
  console.log('Fetching image URI to create blob:', imageUri);
  const response = await fetch(imageUri);
  console.log('Image fetch status:', response.status);
  if (!response.ok) {
    console.error(`Failed to fetch image: ${response.status}`);
    throw new Error(`Failed to fetch image: ${response.status}`);
  }
  const blob = await response.blob();
  console.log('Blob created, size:', blob.size);

  // Get a filename from the URI, which the backend requires.
  const filename = imageUri.split('/').pop();
  console.log('Filename extracted:', filename);

  // Create FormData and append the blob
  const formData = new FormData();
  formData.append('profilePhoto', blob, filename);
  console.log('FormData created.');

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
