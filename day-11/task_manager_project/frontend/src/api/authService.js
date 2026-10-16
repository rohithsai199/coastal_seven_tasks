import axiosClient from './axiosClient';

export const authService = {
  /**
   * Log in user with credentials, storing token and user details
   */
  async login(username, password) {
    const data = await axiosClient.post('/auth/login', { username, password });
    if (data.access_token) {
      localStorage.setItem('taskflow_token', data.access_token);
      if (data.user) {
        localStorage.setItem('taskflow_user', JSON.stringify(data.user));
      }
    }
    return data;
  },

  /**
   * Register a new user
   */
  async register(userData) {
    return await axiosClient.post('/auth/register', userData);
  },

  /**
   * Fetch current authenticated user's profile
   */
  async getCurrentUser() {
    return await axiosClient.get('/auth/me');
  },

  /**
   * Fetch list of registered users for assignee selection
   */
  async getUsers() {
    return await axiosClient.get('/auth/users');
  },

  /**
   * Clear user session from storage
   */
  logout() {
    localStorage.removeItem('taskflow_token');
    localStorage.removeItem('taskflow_user');
  }
};
