import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert } from 'lucide-react';

/**
 * ProtectedRoute Component
 * Restricts access to authenticated users and optionally enforces Role-Based Access Control (RBAC).
 * Demonstrates: React Router v6 navigation redirection, state preservation (location.state.from),
 * and conditional access gates
 */
export const ProtectedRoute = ({ allowedRoles = null, children }) => {
  const { isAuthenticated, isLoading, hasRole, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div
        className="flex-center"
        style={{
          minHeight: '100vh',
          background: 'var(--bg-primary)',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            border: '3px solid var(--border-medium)',
            borderTopColor: 'var(--accent-primary)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Verifying security credentials...
        </p>
      </div>
    );
  }

  // Not authenticated: Redirect to login while preserving the attempted path
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role check: If specific roles are required, verify current user's role
  if (allowedRoles && !hasRole(allowedRoles)) {
    return (
      <div
        style={{
          padding: '4rem 2rem',
          maxWidth: '540px',
          margin: '4rem auto',
          textAlign: 'center',
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-medium)',
        }}
      >
        <div
          style={{
            width: '56px',
            height: '56px',
            margin: '0 auto 1.25rem',
            borderRadius: '50%',
            background: 'rgba(244, 63, 94, 0.1)',
            color: 'var(--accent-rose)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ShieldAlert size={28} />
        </div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>
          Access Restricted
        </h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.5rem' }}>
          Your current role (<strong>{user?.role}</strong>) does not have permission to access this resource.
          Required roles: {allowedRoles.join(' or ')}.
        </p>
      </div>
    );
  }

  return children ? children : <Outlet />;
};
