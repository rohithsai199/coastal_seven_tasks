import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { taskService } from '../api/taskService';
import { projectService } from '../api/projectService';
import { authService } from '../api/authService';
import { StatCard } from '../components/common/StatCard';
import { Card } from '../components/common/Card';
import { TaskCard } from '../components/tasks/TaskCard';
import { TaskModal } from '../components/tasks/TaskModal';
import { EmptyState } from '../components/common/EmptyState';
import { Button } from '../components/common/Button';
import {
  CheckSquare,
  CheckCircle2,
  Clock,
  FolderKanban,
  Plus,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export const DashboardPage = () => {
  const { user, hasRole } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  const canCreate = hasRole(['admin', 'manager']);

  const loadDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [tasksData, projectsData, usersData] = await Promise.all([
        taskService.getTasks(),
        projectService.getProjects(),
        authService.getUsers().catch(() => []),
      ]);
      setTasks(tasksData || []);
      setProjects(projectsData || []);
      setUsers(usersData || []);
    } catch (err) {
      showToast(err.message || 'Failed to load dashboard metrics', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Handle inline status toggle
  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const updated = await taskService.updateTask(taskId, { status: newStatus });
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
      showToast('Task status updated successfully', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to update task status', 'error');
    }
  };

  const handleCreateTask = async ({ projectId, taskData }) => {
    const created = await taskService.createTask(projectId, taskData);
    setTasks((prev) => [created, ...prev]);
    showToast('Task created successfully!', 'success');
  };

  // Calculate high-level summary metrics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress').length;
  const pendingTasks = tasks.filter((t) => t.status === 'pending').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="animate-fade-in">
      {/* Welcome Banner */}
      <div
        style={{
          padding: '1.75rem',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(6, 182, 212, 0.1) 100%)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-medium)',
          marginBottom: '2rem',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <Sparkles size={18} color="#818cf8" />
            <span style={{ fontSize: '0.8125rem', color: '#818cf8', fontWeight: 600, textTransform: 'uppercase' }}>
              Productivity Overview
            </span>
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>
            Welcome back, {user?.username}!
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            You have {pendingTasks + inProgressTasks} active tasks to tackle today. Overall completion rate is at {completionRate}%.
          </p>
        </div>

        {canCreate && (
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => setIsTaskModalOpen(true)}
          >
            Create Task
          </Button>
        )}
      </div>

      {/* Metric Cards Grid */}
      <div className="stats-grid">
        <StatCard
          title="Total Tasks"
          value={totalTasks}
          icon={CheckSquare}
          color="var(--accent-primary)"
          bgColor="rgba(99, 102, 241, 0.12)"
          subtitle={`${pendingTasks} pending`}
        />
        <StatCard
          title="Completed"
          value={completedTasks}
          icon={CheckCircle2}
          color="#34d399"
          bgColor="rgba(16, 185, 129, 0.12)"
          subtitle={`${completionRate}% completion rate`}
        />
        <StatCard
          title="In Progress"
          value={inProgressTasks}
          icon={Clock}
          color="#38bdf8"
          bgColor="rgba(6, 182, 212, 0.12)"
          subtitle="Currently underway"
        />
        <StatCard
          title="Active Projects"
          value={projects.length}
          icon={FolderKanban}
          color="#a78bfa"
          bgColor="rgba(139, 92, 246, 0.12)"
          subtitle="Organized workspaces"
        />
      </div>

      {/* Recent Tasks List */}
      <Card
        title="Recent Tasks"
        subtitle="Manage status and inspect assigned work"
        action={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/tasks')}
            style={{ color: 'var(--accent-primary)' }}
          >
            <span>View All Tasks</span>
            <ArrowRight size={14} />
          </Button>
        }
      >
        {isLoading ? (
          <div className="flex-center" style={{ padding: '3rem 0' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                border: '3px solid var(--border-medium)',
                borderTopColor: 'var(--accent-primary)',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }}
            />
          </div>
        ) : tasks.length === 0 ? (
          <EmptyState
            title="No tasks found"
            description="Get started by creating your first task within an active project."
            actionLabel={canCreate ? 'Create Task' : null}
            onAction={() => setIsTaskModalOpen(true)}
          />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
            {tasks.slice(0, 6).map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onStatusChange={handleStatusChange}
                canDelete={false}
                canModify={true}
              />
            ))}
          </div>
        )}
      </Card>

      {/* Task Creation Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSubmit={handleCreateTask}
        projects={projects}
        users={users}
      />
    </div>
  );
};
