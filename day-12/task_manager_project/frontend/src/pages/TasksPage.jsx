import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { taskService } from '../api/taskService';
import { projectService } from '../api/projectService';
import { authService } from '../api/authService';
import { useDebounce } from '../hooks/useDebounce';
import { TaskCard } from '../components/tasks/TaskCard';
import { TaskModal } from '../components/tasks/TaskModal';
import { TaskFilterBar } from '../components/tasks/TaskFilterBar';
import { EmptyState } from '../components/common/EmptyState';
import { Button } from '../components/common/Button';
import { Plus } from 'lucide-react';

export const TasksPage = () => {
  const { hasRole, user } = useAuth();
  const { showToast } = useToast();

  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  // Debounced search term for optimal API call frequency
  const debouncedSearch = useDebounce(search, 300);

  const canCreate = hasRole(['admin', 'manager']);
  const canDelete = hasRole(['admin', 'manager']);

  // Fetch tasks with active filters applied
  const fetchTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      const filters = {};
      if (statusFilter) filters.status = statusFilter;
      if (projectFilter) filters.project_id = projectFilter;
      if (debouncedSearch) filters.search = debouncedSearch;

      const data = await taskService.getTasks(filters);
      setTasks(data || []);
    } catch (err) {
      showToast(err.message || 'Failed to fetch tasks', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, projectFilter, debouncedSearch, showToast]);

  // Initial load for projects & users
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [projData, userData] = await Promise.all([
          projectService.getProjects(),
          authService.getUsers().catch(() => []),
        ]);
        setProjects(projData || []);
        setUsers(userData || []);
      } catch (err) {
        console.error('Failed to load filter metadata:', err);
      }
    };
    fetchMetadata();
  }, []);

  // Fetch tasks whenever debounced search or filters change
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Handle task status update
  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const updated = await taskService.updateTask(taskId, { status: newStatus });
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
      showToast('Task updated', 'success');
    } catch (err) {
      showToast(err.message || 'Status update failed', 'error');
    }
  };

  // Handle task deletion
  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    try {
      await taskService.deleteTask(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      showToast('Task deleted successfully', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to delete task', 'error');
    }
  };

  // Handle task creation
  const handleCreateTask = async ({ projectId, taskData }) => {
    const created = await taskService.createTask(projectId, taskData);
    setTasks((prev) => [created, ...prev]);
    showToast('Task created successfully!', 'success');
  };

  const handleClearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setProjectFilter('');
  };

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <div className="flex-between" style={{ marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Task Management</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            Filter, search, and update work items connected with FastAPI
          </p>
        </div>

        {canCreate && (
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => setIsTaskModalOpen(true)}
          >
            New Task
          </Button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <TaskFilterBar
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        projectFilter={projectFilter}
        onProjectFilterChange={setProjectFilter}
        projects={projects}
        onClear={handleClearFilters}
      />

      {/* Tasks Grid or Loading/Empty State */}
      {isLoading ? (
        <div className="flex-center" style={{ padding: '4rem 0' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              border: '3px solid var(--border-medium)',
              borderTopColor: 'var(--accent-primary)',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}
          />
        </div>
      ) : tasks.length === 0 ? (
        <EmptyState
          title="No tasks match your criteria"
          description={
            search || statusFilter || projectFilter
              ? 'Try adjusting your search terms or clearing your filters.'
              : 'There are currently no tasks in the system.'
          }
          actionLabel={canCreate ? 'Create First Task' : 'Reset Filters'}
          onAction={canCreate ? () => setIsTaskModalOpen(true) : handleClearFilters}
        />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '1.25rem',
          }}
        >
          {tasks.map((task) => {
            // Check if user is allowed to modify this task:
            // Admin/Manager can modify any task. Member can only modify tasks assigned to them.
            const canModifyTask =
              hasRole(['admin', 'manager']) || (user && task.assignee_id === user.id);

            return (
              <TaskCard
                key={task.id}
                task={task}
                onStatusChange={handleStatusChange}
                onDelete={handleDeleteTask}
                canDelete={canDelete}
                canModify={canModifyTask}
              />
            );
          })}
        </div>
      )}

      {/* Task Creation Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSubmit={handleCreateTask}
        projects={projects}
        users={users}
        initialProjectId={projectFilter}
      />
    </div>
  );
};
