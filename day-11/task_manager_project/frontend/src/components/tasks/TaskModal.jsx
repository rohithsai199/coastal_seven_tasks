import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { CheckSquare, Calendar, User, Folder } from 'lucide-react';

/**
 * Task Creation & Editing Modal
 * Demonstrates: useRef for auto-focusing inputs on modal open,
 * useState for controlled form state, event handling, and conditional rendering
 */
export const TaskModal = ({
  isOpen,
  onClose,
  onSubmit,
  projects = [],
  users = [],
  initialProjectId = '',
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState(initialProjectId || '');
  const [assigneeId, setAssigneeId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // useRef to automatically set focus to title input on modal appearance
  const titleInputRef = useRef(null);

  // Sync initialProjectId or auto-select first project
  useEffect(() => {
    if (initialProjectId) {
      setProjectId(initialProjectId);
    } else if (projects.length > 0 && !projectId) {
      setProjectId(projects[0].id.toString());
    }
  }, [initialProjectId, projects, projectId]);

  // Focus title input when modal opens (useRef + useEffect hook pattern)
  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setDescription('');
      setAssigneeId('');
      setDueDate('');
      setErrors({});
      // Small timeout to guarantee DOM is rendered
      const timer = setTimeout(() => {
        if (titleInputRef.current) {
          titleInputRef.current.focus();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!title.trim()) {
      newErrors.title = 'Task title is required';
    }
    if (!projectId) {
      newErrors.projectId = 'Please select a target project';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        projectId: parseInt(projectId, 10),
        taskData: {
          title: title.trim(),
          description: description.trim() || null,
          assignee_id: assigneeId ? parseInt(assigneeId, 10) : null,
          due_date: dueDate ? new Date(dueDate).toISOString() : null,
        },
      });
      onClose();
    } catch (err) {
      setErrors({ form: err.message || 'Failed to create task' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Task"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} isLoading={isSubmitting}>
            Create Task
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        {errors.form && (
          <div
            style={{
              padding: '0.625rem 0.875rem',
              background: 'rgba(244, 63, 94, 0.1)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              borderRadius: 'var(--radius-md)',
              color: '#fb7185',
              fontSize: '0.8125rem',
              marginBottom: '1rem',
            }}
          >
            {errors.form}
          </div>
        )}

        {/* Task Title (Attached with useRef for autofocus) */}
        <Input
          ref={titleInputRef}
          label="Task Title"
          name="title"
          placeholder="e.g., Integrate Axios Interceptors for JWT auth"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          error={errors.title}
          icon={CheckSquare}
          required
        />

        {/* Project Selector */}
        <div className="form-group">
          <label htmlFor="task-project-select" className="form-label">
            <span>Project <span style={{ color: 'var(--accent-rose)' }}>*</span></span>
          </label>
          <div className="form-input-wrapper">
            <span className="input-icon">
              <Folder size={16} />
            </span>
            <select
              id="task-project-select"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="form-select has-icon"
              required
            >
              <option value="">Select a project...</option>
              {projects.map((proj) => (
                <option key={proj.id} value={proj.id}>
                  {proj.name}
                </option>
              ))}
            </select>
          </div>
          {errors.projectId && <span className="form-error">{errors.projectId}</span>}
        </div>

        {/* Assignee Selector */}
        <div className="form-group">
          <label htmlFor="task-assignee-select" className="form-label">Assignee</label>
          <div className="form-input-wrapper">
            <span className="input-icon">
              <User size={16} />
            </span>
            <select
              id="task-assignee-select"
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="form-select has-icon"
            >
              <option value="">Unassigned</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.username} ({u.role})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Due Date */}
        <Input
          label="Due Date"
          name="dueDate"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          icon={Calendar}
        />

        {/* Description */}
        <div className="form-group">
          <label htmlFor="task-description-input" className="form-label">Description (Optional)</label>
          <textarea
            id="task-description-input"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Provide context or acceptance criteria..."
            className="form-textarea"
          />
        </div>
      </form>
    </Modal>
  );
};
