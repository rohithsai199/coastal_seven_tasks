import React, { forwardRef } from 'react';

/**
 * Controlled Input Component
 * Demonstrates: Controlled inputs, event handling, ref forwarding, conditional rendering
 */
export const Input = forwardRef(({
  label,
  id,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  icon: Icon,
  required = false,
  disabled = false,
  className = '',
  helperText,
  ...props
}, ref) => {
  const inputId = id || name;

  return (
    <div className="form-group">
      {label && (
        <label htmlFor={inputId} className="form-label">
          <span>
            {label} {required && <span style={{ color: 'var(--accent-rose)' }}>*</span>}
          </span>
          {helperText && <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{helperText}</span>}
        </label>
      )}

      <div className="form-input-wrapper">
        {Icon && (
          <span className="input-icon">
            <Icon size={16} />
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`form-input ${Icon ? 'has-icon' : ''} ${error ? 'is-invalid' : ''} ${className}`.trim()}
          {...props}
        />
      </div>

      {error && <span className="form-error">{error}</span>}
    </div>
  );
});

Input.displayName = 'Input';
