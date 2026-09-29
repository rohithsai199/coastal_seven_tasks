import React from 'react';
import { Badge } from '../common/Badge';
import { Calendar, User, Trash2, Folder, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

/**
 * TaskCard Component
 * Demonstrates: Component composition, event handling, list rendering item, inline status update
 */
export const TaskCard = ({
  task,
  onStatusChange,
  onDelete,
  canDelete = false,
  canModify = true,
}) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={14} color="#34d399" />;
      case 'in_progress':
        return <Clock size={14} color="#38bdf8" />;
      default:
        return <AlertTriangle size={14} color="#fbbf24" />;
    }
  };

  const formattedDate = task.due_date
    ? new Date(task.due_date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    : null;

  return (
    <div
      style={{
        padding: '1.25rem',
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.875rem',
        transition: 'all var(--transition-fast)',
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
      {/* Top Header: Project badge & Delete button */}
      <div className="flex-between">
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.375rem',
            fontSize: '0.75rem',
            color: 'var(--accent-cyan)',
            background: 'rgba(6, 182, 212, 0.1)',
            padding: '0.2rem 0.5rem',
            borderRadius: 'var(--radius-sm)',
            fontWeight: 500,
          }}
        >
          <Folder size={12} />
          <span>{task.project_name || `Project #${task.project_id}`}</span>
        </span>

        {canDelete && (
          <button
            onClick={() => onDelete(task.id)}
            title="Delete task"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '0.25rem',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#fb7185')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            <Trash2 size={15} />
          </button>
        )}
      </div>

      {/* Task Title & Description */}
      <div>
        <h4
          style={{
            fontSize: '1rem',
            fontWeight: 600,
            color: task.status === 'completed' ? 'var(--text-secondary)' : 'var(--text-primary)',
            textDecoration: task.status === 'completed' ? 'line-through' : 'none',
            marginBottom: '0.375rem',
          }}
        >
          {task.title}
        </h4>
        {task.description && (
          <p
            style={{
              fontSize: '0.8125rem',
              color: 'var(--text-muted)',
              lineHeight: 1.4,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {task.description}
          </p>
        )}
      </div>

      {/* Bottom Metadata & Status Controller */}
      <div
        className="flex-between"
        style={{
          paddingTop: '0.75rem',
          borderTop: '1px solid var(--border-subtle)',
          marginTop: 'auto',
          fontSize: '0.75rem',
          color: 'var(--text-secondary)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          {/* Assignee */}
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <User size={14} color="var(--text-muted)" />
            <span>{task.assignee_username || 'Unassigned'}</span>
          </span>

          {/* Due date */}
          {formattedDate && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Calendar size={14} color="var(--text-muted)" />
              <span>{formattedDate}</span>
            </span>
          )}
        </div>

        {/* Status Dropdown / Badge */}
        {canModify ? (
          <select
            value={task.status}
            onChange={(e) => onStatusChange(task.id, e.target.value)}
            style={{
              background:
                task.status === 'completed'
                  ? 'rgba(16, 185, 129, 0.15)'
                  : task.status === 'in_progress'
                  ? 'rgba(6, 182, 212, 0.15)'
                  : 'rgba(245, 158, 11, 0.15)',
              color:
                task.status === 'completed'
                  ? '#34d399'
                  : task.status === 'in_progress'
                  ? '#38bdf8'
                  : '#fbbf24',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.2rem 0.5rem',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="pending" style={{ background: '#1f2937', color: '#fbbf24' }}>
              Pending
            </option>
            <option value="in_progress" style={{ background: '#1f2937', color: '#38bdf8' }}>
              In Progress
            </option>
            <option value="completed" style={{ background: '#1f2937', color: '#34d399' }}>
              Completed
            </option>
          </select>
        ) : (
          <Badge variant={task.status}>{task.status}</Badge>
        )}
      </div>
    </div>
  );
};
