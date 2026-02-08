/**
 * API Service for Wildlife Monitoring System
 * Connects frontend to Django REST backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Token management
const getAccessToken = () => localStorage.getItem('access_token');
const getRefreshToken = () => localStorage.getItem('refresh_token');
const setTokens = (access, refresh) => {
  localStorage.setItem('access_token', access);
  localStorage.setItem('refresh_token', refresh);
};
const clearTokens = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
};

/**
 * Refresh the access token using the refresh token
 */
async function refreshAccessToken() {
  const refresh = getRefreshToken();
  if (!refresh) {
    throw new Error('No refresh token available');
  }

  const response = await fetch(`${API_BASE_URL}/token/refresh/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh }),
  });

  if (!response.ok) {
    clearTokens();
    throw new Error('Token refresh failed');
  }

  const data = await response.json();
  setTokens(data.access, data.refresh || refresh);
  return data.access;
}

/**
 * Make an authenticated API request with automatic token refresh
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  let accessToken = getAccessToken();

  const makeRequest = async (token) => {
    const headers = {
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Don't set Content-Type for FormData (let browser set it with boundary)
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    return fetch(url, {
      ...options,
      headers,
    });
  };

  let response = await makeRequest(accessToken);

  // If unauthorized, try to refresh token
  if (response.status === 401 && accessToken) {
    try {
      accessToken = await refreshAccessToken();
      response = await makeRequest(accessToken);
    } catch (error) {
      clearTokens();
      throw new Error('Session expired. Please login again.');
    }
  }

  return response;
}

// ==================== Auth API ====================

export const authAPI = {
  /**
   * Login with username/email and password
   */
  async login(identifier, password) {
    const isEmail = identifier.includes('@');
    const body = {
      [isEmail ? 'email' : 'username']: identifier,
      password,
    };

    const response = await fetch(`${API_BASE_URL}/auth/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.errors?.non_field_errors?.[0] || data.errors?.detail || 'Login failed');
    }

    setTokens(data.tokens.access, data.tokens.refresh);
    return data;
  },

  /**
   * Register a new user
   */
  async signup(userData) {
    const response = await fetch(`${API_BASE_URL}/auth/signup/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle different error response formats
      let errorMsg = 'Signup failed';
      
      if (data.errors) {
        // Format: { errors: { field: ["error1", "error2"] } }
        const errorMessages = Object.entries(data.errors).map(([field, msgs]) => {
          const fieldName = field.replace(/_/g, ' ');
          return `${fieldName}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`;
        });
        errorMsg = errorMessages.join('; ');
      } else if (data.error) {
        // Format: { error: "message" }
        errorMsg = data.error;
      } else if (data.detail) {
        // Format: { detail: "message" }
        errorMsg = data.detail;
      } else if (typeof data === 'string') {
        // Format: "error message"
        errorMsg = data;
      }
      
      throw new Error(errorMsg);
    }

    setTokens(data.tokens.access, data.tokens.refresh);
    return data;
  },

  /**
   * Logout and blacklist refresh token
   */
  async logout() {
    const refresh = getRefreshToken();
    if (refresh) {
      try {
        await apiRequest('/auth/logout/', {
          method: 'POST',
          body: JSON.stringify({ refresh }),
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    clearTokens();
  },

  /**
   * Get current user profile
   */
  async getProfile() {
    const response = await apiRequest('/auth/profile/');
    if (!response.ok) {
      throw new Error('Failed to fetch profile');
    }
    return response.json();
  },

  /**
   * Update user profile (home location, mobile, name)
   */
  async updateProfile(profileData) {
    const isFormData = profileData instanceof FormData;
    const response = await apiRequest('/auth/profile/', {
      method: 'PUT',
      body: isFormData ? profileData : JSON.stringify(profileData),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      const errorMsg = data.errors 
        ? Object.entries(data.errors).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join('; ')
        : data.error || 'Failed to update profile';
      throw new Error(errorMsg);
    }
    
    return data;
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!getAccessToken();
  },
};

// ==================== User Devices API ====================

export const userDevicesAPI = {
  /**
   * Get devices owned by the current user
   */
  async getMyDevices() {
    const response = await apiRequest('/user/devices/');
    if (!response.ok) {
      throw new Error('Failed to fetch your devices');
    }
    return response.json();
  },

  /**
   * Add a device to user's account
   */
  async addDevice(deviceData) {
    const response = await apiRequest('/user/devices/', {
      method: 'POST',
      body: JSON.stringify(deviceData),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      const errorMsg = data.errors 
        ? Object.entries(data.errors).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join('; ')
        : data.error || 'Failed to add device';
      throw new Error(errorMsg);
    }
    
    return data;
  },

  /**
   * Remove a device from user's account
   */
  async removeDevice(deviceId) {
    const response = await apiRequest(`/user/devices/?device_id=${deviceId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to remove device');
    }
    
    return response.json();
  },
};

// ==================== Devices API ====================

export const devicesAPI = {
  /**
   * Get all devices
   */
  async getAll() {
    const response = await apiRequest('/device/');
    if (!response.ok) {
      throw new Error('Failed to fetch devices');
    }
    return response.json();
  },

  /**
   * Get a single device by ID
   */
  async getById(deviceId) {
    const response = await apiRequest(`/device/?device_id=${deviceId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch device');
    }
    return response.json();
  },

  /**
   * Register a new device
   */
  async register(deviceData) {
    const response = await apiRequest('/device/register/', {
      method: 'POST',
      body: JSON.stringify(deviceData),
    });
    if (!response.ok) {
      throw new Error('Failed to register device');
    }
    return response.json();
  },

  /**
   * Update a device
   */
  async update(deviceId, updateData) {
    const response = await apiRequest(`/device/${deviceId}/`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
    if (!response.ok) {
      throw new Error('Failed to update device');
    }
    return response.json();
  },

  /**
   * Delete a device
   */
  async delete(deviceId) {
    const response = await apiRequest(`/device/${deviceId}/`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete device');
    }
    return response.json();
  },
};

// ==================== Detections API ====================

export const detectionsAPI = {
  /**
   * Get all captured images/detections
   */
  async getAll(filters = {}) {
    const params = new URLSearchParams();
    if (filters.device_id) params.append('device_id', filters.device_id);
    if (filters.animal_type) params.append('animal_type', filters.animal_type);

    const queryString = params.toString();
    const endpoint = `/images/${queryString ? `?${queryString}` : ''}`;

    const response = await apiRequest(endpoint);
    if (!response.ok) {
      throw new Error('Failed to fetch detections');
    }
    return response.json();
  },

  /**
   * Upload an image for classification (for testing)
   */
  async uploadImage(deviceId, imageFile) {
    const formData = new FormData();
    formData.append('device_id', deviceId);
    formData.append('image', imageFile);

    const response = await fetch(`${API_BASE_URL}/device/capture/`, {
      method: 'POST',
      body: formData,
    });

    let data = null;
    try {
      data = await response.json();
    } catch (err) {
      data = null;
    }

    if (!response.ok) {
      const errorMsg =
        data?.error ||
        data?.errors?.image?.[0] ||
        data?.errors?.device_id?.[0] ||
        data?.message ||
        'Failed to upload image';
      const error = new Error(errorMsg);
      error.details = data;
      error.status = response.status;
      throw error;
    }
    return data;
  },
};

// ==================== Test API ====================

export const testAPI = {
  /**
   * Test JWT authentication
   */
  async testAuth() {
    const response = await apiRequest('/test/');
    if (!response.ok) {
      throw new Error('Auth test failed');
    }
    return response.json();
  },

  /**
    * Send a test SMS message (Twilio)
   */
  async sendSMSTest({ phone_number, message } = {}) {
    const response = await apiRequest('/test/sms/', {
      method: 'POST',
      body: JSON.stringify({ phone_number, message }),
    });

    let data = null;
    try {
      data = await response.json();
    } catch (err) {
      data = null;
    }

    if (!response.ok) {
      const errorMsg = data?.error || data?.details || data?.message || response.statusText || 'SMS test failed';
      const error = new Error(errorMsg);
      error.details = data;
      error.status = response.status;
      throw error;
    }

    return data;
  },
};

export default {
  auth: authAPI,
  devices: devicesAPI,
  detections: detectionsAPI,
  test: testAPI,
};
