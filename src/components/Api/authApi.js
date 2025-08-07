import {getStoredAuthToken} from '../../utils/getStoredAuthToken';

/**
 * Register new user
 * @param {Object} userData - User registration data
 * @param {string} userData.email - User email
 * @param {string} userData.password - User password
 * @param {string} userData.firstName - User first name
 * @param {string} userData.lastName - User last name
 * @param {string} userData.phone - User phone number
 * @param {string} userData.userType - User type (buyer/supplier)
 * @returns {Promise<Object>} Registration response
 */
export const registerUserApi = async (userData) => {
  try {
    if (!userData || !userData.email || !userData.password) {
      throw new Error('Email and password are required');
    }

    const response = await fetch(
      'https://us-central1-i-leaf-u.cloudfunctions.net/registerUser',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || errorData.error || `HTTP error! status: ${response.status}`,
      );
    }

    const data = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Register user API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred during registration',
    };
  }
};

/**
 * Login user
 * @param {Object} loginData - Login credentials
 * @param {string} loginData.email - User email
 * @param {string} loginData.password - User password
 * @returns {Promise<Object>} Login response
 */
export const loginUserApi = async (loginData) => {
  try {
    if (!loginData || !loginData.email || !loginData.password) {
      throw new Error('Email and password are required');
    }

    const response = await fetch(
      'https://us-central1-i-leaf-u.cloudfunctions.net/loginUser',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || errorData.error || `HTTP error! status: ${response.status}`,
      );
    }

    const data = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Login user API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred during login',
    };
  }
};

/**
 * Request password reset
 * @param {string} email - User email for password reset
 * @returns {Promise<Object>} Password reset response
 */
export const resetPasswordApi = async (email) => {
  try {
    if (!email) {
      throw new Error('Email is required');
    }

    const response = await fetch(
      'https://us-central1-i-leaf-u.cloudfunctions.net/resetPassword',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({email}),
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || errorData.error || `HTTP error! status: ${response.status}`,
      );
    }

    const data = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Reset password API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while requesting password reset',
    };
  }
};

/**
 * Verify email address
 * @param {Object} verificationData - Email verification data
 * @param {string} verificationData.token - Verification token
 * @param {string} verificationData.email - User email
 * @returns {Promise<Object>} Email verification response
 */
export const verifyEmailApi = async (verificationData) => {
  try {
    if (!verificationData || !verificationData.token) {
      throw new Error('Verification token is required');
    }

    const response = await fetch(
      'https://us-central1-i-leaf-u.cloudfunctions.net/verifyEmail',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(verificationData),
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || errorData.error || `HTTP error! status: ${response.status}`,
      );
    }

    const data = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Verify email API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred during email verification',
    };
  }
};

/**
 * Logout user
 * @returns {Promise<Object>} Logout response
 */
export const logoutUserApi = async () => {
  try {
    const authToken = await getStoredAuthToken();
    
    const response = await fetch(
      'https://us-central1-i-leaf-u.cloudfunctions.net/logoutUser',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || errorData.error || `HTTP error! status: ${response.status}`,
      );
    }

    const data = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Logout user API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred during logout',
    };
  }
};

/**
 * Refresh authentication token
 * @param {string} refreshToken - Refresh token
 * @returns {Promise<Object>} Token refresh response
 */
export const refreshTokenApi = async (refreshToken) => {
  try {
    if (!refreshToken) {
      throw new Error('Refresh token is required');
    }

    const response = await fetch(
      'https://us-central1-i-leaf-u.cloudfunctions.net/refreshToken',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({refreshToken}),
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || errorData.error || `HTTP error! status: ${response.status}`,
      );
    }

    const data = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Refresh token API error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while refreshing token',
    };
  }
};
