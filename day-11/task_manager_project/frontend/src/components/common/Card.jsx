import React from 'react';

/**
 * Reusable Card Container
 * Demonstrates: Component composition, slots/children pattern
 */
export const Card = ({
  title,
  subtitle,
  action,
  children,
  className = '',
  style = {},
}) => {
  return (
    <div className={`glass-panel ${className}`.trim()} style={{ padding: '1.5rem', ...style }}>
      {(title || action) && (
        <div className="flex-between" style={{ marginBottom: '1.25rem' }}>
          <div>
            {title && <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>{title}</h3>}
            {subtitle && <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
};
