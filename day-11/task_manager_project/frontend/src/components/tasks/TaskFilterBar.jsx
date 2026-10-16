import React from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Button } from '../common/Button';

/**
 * TaskFilterBar Component
 * Demonstrates: Controlled filter inputs, search with debounce, event callbacks
 */
export const TaskFilterBar = ({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  projectFilter,
  onProjectFilterChange,
  projects = [],
  onClear,
}) => {
  const hasActiveFilters = Boolean(search || statusFilter || projectFilter);

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '0.75rem',
        marginBottom: '1.5rem',
        padding: '1rem',
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)',
      }}
    >
      {/* Search Input */}
      <div style={{ flex: '1 1 240px', minWidth: '200px' }} className="form-input-wrapper">
        <span className="input-icon">
          <Search size={16} />
        </span>
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search tasks by title..."
          className="form-input has-icon"
        />
      </div>

      {/* Status Filter Dropdown */}
      <div style={{ flex: '0 1 180px' }} className="form-input-wrapper">
        <span className="input-icon">
          <Filter size={15} />
        </span>
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          className="form-select has-icon"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Project Filter Dropdown */}
      <div style={{ flex: '0 1 200px' }}>
        <select
          value={projectFilter}
          onChange={(e) => onProjectFilterChange(e.target.value)}
          className="form-select"
        >
          <option value="">All Projects</option>
          {projects.map((proj) => (
            <option key={proj.id} value={proj.id}>
              {proj.name}
            </option>
          ))}
        </select>
      </div>

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          icon={X}
          style={{ height: '38px', color: 'var(--text-muted)' }}
        >
          Clear
        </Button>
      )}
    </div>
  );
};
