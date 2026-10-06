import axiosClient from './axiosClient';

export const taskService = {
  /**
   * List tasks with optional filtering by status, assignee, project, or search query
   */
  async getTasks(filters = {}) {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.assignee_id) params.append('assignee_id', filters.assignee_id);
    if (filters.project_id) params.append('project_id', filters.project_id);
    if (filters.search) params.append('search', filters.search);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    return await axiosClient.get(`/tasks/${queryString}`);
  },

  /**
   * Get single task details
   */
  async getTaskById(taskId) {
    return await axiosClient.get(`/tasks/${taskId}`);
  },

  /**
   * Create a new task within a project (Admin/Manager role required)
   */
  async createTask(projectId, taskData) {
    return await axiosClient.post(`/tasks/project/${projectId}`, taskData);
  },

  /**
   * Update task fields (status, title, description, assignee)
   */
  async updateTask(taskId, updateData) {
    return await axiosClient.patch(`/tasks/${taskId}`, updateData);
  },

  /**
   * Delete a task (Admin/Manager role required)
   */
  async deleteTask(taskId) {
    return await axiosClient.delete(`/tasks/${taskId}`);
  }
};
