import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { FolderKanban } from 'lucide-react';

/**
 * Project Creation Modal
 * Demonstrates: useRef for input focus, useState for controlled form state, and event handling
 */
export const ProjectModal = ({ isOpen, onClose, onSubmit }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const nameInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setDescription('');
      setErrors({});
      const timer = setTimeout(() => {
        if (nameInputRef.current) {
          nameInputRef.current.focus();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrors({ name: 'Project name is required' });
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        name: name.trim(),
        description: description.trim() || null,
      });
      onClose();
    } catch (err) {
      setErrors({ form: err.message || 'Failed to create project' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Project"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} isLoading={isSubmitting}>
            Create Project
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

        <Input
          ref={nameInputRef}
          label="Project Name"
          name="name"
          placeholder="e.g., Client Portal Redesign"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          icon={FolderKanban}
          required
        />

        <div className="form-group">
          <label htmlFor="project-description-input" className="form-label">Project Description</label>
          <textarea
            id="project-description-input"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Brief scope or roadmap summary..."
            className="form-textarea"
          />
        </div>
      </form>
    </Modal>
  );
};
