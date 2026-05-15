import React from 'react';
import './Input.css';

export const Input = React.forwardRef(({ 
  label, 
  error, 
  success,
  id, 
  className = '', 
  icon,
  ...props 
}, ref) => {
  const inputId = id || Math.random().toString(36).substring(7);
  
  return (
    <div className={`input-wrapper ${className}`}>
      {label && <label htmlFor={inputId} className="input-label">{label}</label>}
      <div className="input-container">
        {icon && <span className="input-icon">{icon}</span>}
        <input 
          id={inputId}
          ref={ref}
          className={`input-field ${error ? 'input-error' : success ? 'input-success' : ''} ${icon ? 'has-icon' : ''}`}
          {...props} 
        />
      </div>
      {error && <span className="input-error-msg">{error}</span>}
      {!error && success && typeof success === 'string' && <span className="input-success-msg">{success}</span>}
    </div>
  );
});

Input.displayName = 'Input';
