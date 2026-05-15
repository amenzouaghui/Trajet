import React from 'react';
import './Button.css';

export const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  fullWidth = false, 
  className = '', 
  ...props 
}) => {
  const classes = `btn btn-${variant} btn-${size} ${fullWidth ? 'w-full' : ''} ${className}`;
  
  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
};
