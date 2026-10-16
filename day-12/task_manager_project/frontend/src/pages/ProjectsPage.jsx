import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { projectService } from '../api/projectService';
import { ProjectCard } from '../components/projects/ProjectCard';
import { ProjectModal } from '../components/projects/ProjectModal';
import { EmptyState } from '../components/common/EmptyState';
import { Button } from '../components/common/Button';
import { Plus, FolderKanban } from 'lucide-react';

export const ProjectsPage = () => {
  const { hasRole } = useAuth();
  const { showToast } = useToast();

  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const canManageProjects = hasRole(['admin', 'manager']);

  const loadProjects = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await projectService.getProjects();
      setProjects(data || []);
    } catch (err) {
      showToast(err.message || 'Failed to load projects', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleCreateProject = async (projectData) => {
    const created = await projectService.createProject(projectData);
    setProjects((prev) => [created, ...prev]);
    showToast('Project created successfully!', 'success');
  };

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('Are you sure you want to delete this project? All associated tasks will be removed.')) {
      return;
    }

    try {
      await projectService.deleteProject(projectId);
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      showToast('Project deleted successfully', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to delete project', 'error');
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex-between" style={{ marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Projects Directory</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            Workspaces grouped by team objectives and milestones
          </p>
        </div>

        {canManageProjects && (
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => setIsModalOpen(true)}
          >
            New Project
          </Button>
        )}
      </div>

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
      ) : projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects found"
          description="Create your first project to start assigning and managing tasks."
          actionLabel={canManageProjects ? 'Create Project' : null}
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '1.25rem',
          }}
        >
          {projects.map((proj) => (
            <ProjectCard
              key={proj.id}
              project={proj}
              onDelete={handleDeleteProject}
              canDelete={canManageProjects}
            />
          ))}
        </div>
      )}

      {/* Project Creation Modal */}
      <ProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateProject}
      />
    </div>
  );
};
