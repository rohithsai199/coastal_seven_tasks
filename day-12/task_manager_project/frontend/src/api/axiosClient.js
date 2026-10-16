import axios from 'axios';

// Base URL points to the FastAPI backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

/**
 * Request Interceptor:
 * Automatically injects the JWT Bearer token from localStorage into outgoing HTTP requests
 */
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('taskflow_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor:
 * Handles centralized API response unwrapping, 401 Unauthorized token ejection,
 * and error message normalization.
 */
axiosClient.interceptors.response.use(
  (response) => {
    // Return direct data payload
    return response.data;
  },
  (error) => {
    const status = error.response ? error.response.status : null;

    if (status === 401) {
      // Clear expired credentials
      localStorage.removeItem('taskflow_token');
      localStorage.removeItem('taskflow_user');

      // Dispatch event to allow AuthContext to sync cleanly
      window.dispatchEvent(new CustomEvent('auth:expired'));

      // If outside login/register routes, redirect to login
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        window.location.href = '/login';
      }
    }

    // Extract standardized human-readable error detail from FastAPI
    let errorMessage = 'An unexpected error occurred. Please try again.';
    if (error.response?.data?.detail) {
      if (typeof error.response.data.detail === 'string') {
        errorMessage = error.response.data.detail;
      } else if (Array.isArray(error.response.data.detail)) {
        // FastAPI validation errors
        errorMessage = error.response.data.detail
          .map((item) => `${item.loc?.slice(-1)[0] || 'field'}: ${item.msg}`)
          .join(', ');
      }
    } else if (error.message) {
      errorMessage = error.message;
    }

    const enhancedError = new Error(errorMessage);
    enhancedError.status = status;
    enhancedError.originalError = error;

    return Promise.reject(enhancedError);
  }
);

export default axiosClient;
