import axiosClient from './axiosClient';

export const projectService = {
  /**
   * Get all projects
   */
  async getProjects() {
    return await axiosClient.get('/projects/');
  },

  /**
   * Get single project details by ID
   */
  async getProjectById(projectId) {
    return await axiosClient.get(`/projects/${projectId}`);
  },

  /**
   * Create a new project (Admin/Manager role required)
   */
  async createProject(projectData) {
    return await axiosClient.post('/projects/', projectData);
  },

  /**
   * Delete project by ID (Admin/Manager role required)
   */
  async deleteProject(projectId) {
    return await axiosClient.delete(`/projects/${projectId}`);
  }
};
