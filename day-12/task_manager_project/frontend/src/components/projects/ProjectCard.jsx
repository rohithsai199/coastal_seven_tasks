import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderKanban, CheckCircle, ArrowRight, Trash2, Calendar } from 'lucide-react';
import { Button } from '../common/Button';

/**
 * ProjectCard Component
 * Demonstrates: React Router v6 useNavigate for programmatic navigation,
 * conditional action buttons based on RBAC permissions
 */
export const ProjectCard = ({ project, onDelete, canDelete = false }) => {
  const navigate = useNavigate();

  const formattedDate = project.created_at
    ? new Date(project.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null;

  return (
    <div
      style={{
        padding: '1.5rem',
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'all var(--transition-fast)',
        minHeight: '210px',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-medium)';
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-subtle)';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div>
        <div className="flex-between" style={{ marginBottom: '0.75rem' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(99, 102, 241, 0.12)',
              color: 'var(--accent-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FolderKanban size={20} />
          </div>

          {canDelete && (
            <button
              onClick={() => onDelete(project.id)}
              title="Delete project"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '0.25rem',
                display: 'flex',
                alignItems: 'center',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#fb7185')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>

        <h4 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
          {project.name}
        </h4>
        <p
          style={{
            fontSize: '0.8125rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.4,
            marginBottom: '1rem',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {project.description || 'No description provided.'}
        </p>
      </div>

      <div
        className="flex-between"
        style={{
          paddingTop: '0.875rem',
          borderTop: '1px solid var(--border-subtle)',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span
            style={{
              padding: '0.2rem 0.5rem',
              background: 'rgba(99, 102, 241, 0.1)',
              color: 'var(--accent-primary)',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 600,
            }}
          >
            {project.task_count || 0} tasks
          </span>
          {formattedDate && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Calendar size={12} />
              <span>{formattedDate}</span>
            </span>
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/projects/${project.id}`)}
          style={{ color: 'var(--accent-primary)', padding: '0.25rem 0.5rem' }}
        >
          <span>View Tasks</span>
          <ArrowRight size={14} />
        </Button>
      </div>
    </div>
  );
};
