import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { projectService } from '../api/projectService';
import { taskService } from '../api/taskService';
import { authService } from '../api/authService';
import { TaskCard } from '../components/tasks/TaskCard';
import { TaskModal } from '../components/tasks/TaskModal';
import { EmptyState } from '../components/common/EmptyState';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { ArrowLeft, Plus, FolderKanban, Calendar, Clock, CheckCircle } from 'lucide-react';

/**
 * ProjectDetailPage Component
 * Demonstrates: React Router v6 useParams hook to read URL parameters (:projectId),
 * and useNavigate for backward traversal
 */
export const ProjectDetailPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { hasRole, user } = useAuth();
  const { showToast } = useToast();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  const canCreate = hasRole(['admin', 'manager']);
  const canDelete = hasRole(['admin', 'manager']);

  const loadProjectData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [projData, tasksData, usersData] = await Promise.all([
        projectService.getProjectById(projectId),
        taskService.getTasks({ project_id: projectId }),
        authService.getUsers().catch(() => []),
      ]);
      setProject(projData);
      setTasks(tasksData || []);
      setUsers(usersData || []);
    } catch (err) {
      showToast(err.message || 'Failed to load project details', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [projectId, showToast]);

  useEffect(() => {
    loadProjectData();
  }, [loadProjectData]);

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const updated = await taskService.updateTask(taskId, { status: newStatus });
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
      showToast('Task updated', 'success');
    } catch (err) {
      showToast(err.message || 'Status update failed', 'error');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await taskService.deleteTask(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      showToast('Task removed', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to delete task', 'error');
    }
  };

  const handleCreateTask = async ({ taskData }) => {
    const created = await taskService.createTask(projectId, taskData);
    setTasks((prev) => [created, ...prev]);
    showToast('Task added to project!', 'success');
  };

  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  if (isLoading) {
    return (
      <div className="flex-center" style={{ padding: '6rem 0' }}>
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
    );
  }

  if (!project) {
    return (
      <EmptyState
        title="Project Not Found"
        description="The requested project does not exist or has been removed."
        actionLabel="Back to Projects"
        onAction={() => navigate('/projects')}
      />
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Back button & Breadcrumb */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Button
          variant="ghost"
          size="sm"
          icon={ArrowLeft}
          onClick={() => navigate('/projects')}
          style={{ color: 'var(--text-secondary)' }}
        >
          Back to Projects
        </Button>
      </div>

      {/* Project Overview Banner */}
      <Card style={{ marginBottom: '2rem' }}>
        <div className="flex-between" style={{ flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(99, 102, 241, 0.15)',
                color: 'var(--accent-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FolderKanban size={26} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{project.name}</h2>
                <span
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    padding: '0.2rem 0.5rem',
                    borderRadius: 'var(--radius-sm)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  ID: #{project.id}
                </span>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                {project.description || 'No description provided.'}
              </p>
            </div>
          </div>

          {canCreate && (
            <Button
              variant="primary"
              icon={Plus}
              onClick={() => setIsTaskModalOpen(true)}
            >
              Add Task to Project
            </Button>
          )}
        </div>

        {/* Progress Bar & Summary Stats */}
        <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)' }}>
          <div className="flex-between" style={{ fontSize: '0.8125rem', marginBottom: '0.5rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>
              Project Progress ({completedCount} of {tasks.length} tasks completed)
            </span>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{progressPercent}%</span>
          </div>

          {/* Progress Bar track */}
          <div
            style={{
              height: '8px',
              background: 'rgba(255, 255, 255, 0.06)',
              borderRadius: 'var(--radius-full)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${progressPercent}%`,
                background: 'linear-gradient(90deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
                borderRadius: 'var(--radius-full)',
                transition: 'width 0.4s ease',
              }}
            />
          </div>
        </div>
      </Card>

      {/* Project Tasks */}
      <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>
        Associated Tasks ({tasks.length})
      </h3>

      {tasks.length === 0 ? (
        <EmptyState
          title="No tasks in this project"
          description="Create a task to kick off work on this project."
          actionLabel={canCreate ? 'Add First Task' : null}
          onAction={() => setIsTaskModalOpen(true)}
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
        projects={[project]}
        users={users}
        initialProjectId={project.id.toString()}
      />
    </div>
  );
};
