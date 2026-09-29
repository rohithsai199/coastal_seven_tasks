import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, Activity } from 'lucide-react';

export const Navbar = () => {
  const location = useLocation();
  const { user } = useAuth();

  // Convert pathname like "/tasks" or "/projects/1" to human readable title
  const getPageTitle = (path) => {
    if (path.startsWith('/projects/')) return 'Project Details';
    switch (path) {
      case '/dashboard':
        return 'Overview Dashboard';
      case '/tasks':
        return 'Task Management';
      case '/projects':
        return 'Projects Directory';
      case '/profile':
        return 'Account & Token Inspector';
      default:
        return 'TaskFlow';
    }
  };

  return (
    <header className="topbar">
      <div className="page-title">
        {getPageTitle(location.pathname)}
      </div>

      <div className="topbar-actions">
        {/* Backend health status indicator */}
        <div className="backend-indicator">
          <Activity size={14} />
          <span>FastAPI Live :8000</span>
        </div>

        {/* Security / RBAC badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
            fontSize: '0.75rem',
            color: 'var(--text-secondary)',
            background: 'rgba(255, 255, 255, 0.03)',
            padding: '0.3125rem 0.625rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <ShieldCheck size={14} color="var(--accent-primary)" />
          <span>Role: <strong>{user?.role || 'Guest'}</strong></span>
        </div>
      </div>
    </header>
  );
};
