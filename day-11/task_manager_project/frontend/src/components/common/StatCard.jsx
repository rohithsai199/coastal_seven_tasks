import React from 'react';

/**
 * Reusable StatCard Component
 * Demonstrates: Props-driven styling, gradient accents, modern dashboard metrics
 */
export const StatCard = ({
  title,
  value,
  icon: Icon,
  color = 'var(--accent-primary)',
  bgColor = 'rgba(99, 102, 241, 0.12)',
  subtitle,
}) => {
  return (
    <div className="stat-card">
      <div>
        <div className="stat-title">{title}</div>
        <div className="stat-value">{value}</div>
        {subtitle && (
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.375rem' }}>
            {subtitle}
          </div>
        )}
      </div>

      {Icon && (
        <div className="stat-icon" style={{ backgroundColor: bgColor, color }}>
          <Icon size={22} />
        </div>
      )}
    </div>
  );
};
