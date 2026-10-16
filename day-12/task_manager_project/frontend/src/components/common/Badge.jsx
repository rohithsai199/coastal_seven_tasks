import React from 'react';

/**
 * Reusable Badge Component
 * Demonstrates: Props mapping, dynamic classes, and conditional rendering
 */
export const Badge = ({ variant = 'member', children, showDot = true, className = '' }) => {
  const normalizedVariant = String(variant).toLowerCase();

  return (
    <span className={`badge badge-${normalizedVariant} ${className}`.trim()}>
      {showDot && <span className="badge-dot" />}
      {children || normalizedVariant.replace('_', ' ')}
    </span>
  );
};
