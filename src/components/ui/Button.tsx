import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  ...props
}) => {
  const baseStyles = "font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-darkbg transition-colors duration-150 ease-in-out flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed";

  // Adjusted variant styles for dark mode
  const variantStyles = {
    primary: 'bg-primary text-white hover:bg-primary-light focus:ring-primary-dark dark:bg-primary-light dark:hover:bg-primary',
    secondary: 'bg-secondary text-white hover:bg-sky-600 focus:ring-sky-700 dark:hover:bg-sky-400',
    danger: 'bg-danger text-white hover:bg-red-600 focus:ring-red-700 dark:hover:bg-red-400',
    ghost: 'bg-transparent text-primary hover:bg-indigo-100 focus:ring-primary-dark dark:text-primary-light dark:hover:bg-indigo-900/[0.5]',
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  // Ensure spinner color contrasts in dark mode if button is dark
  const spinnerColor = (variant === 'primary' || variant === 'secondary' || variant === 'danger') 
    ? "text-white" 
    : "text-primary dark:text-primary-light";

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading && (
        <svg className={`animate-spin -ml-1 mr-3 h-5 w-5 ${spinnerColor}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {leftIcon && !isLoading && <span className="mr-2">{leftIcon}</span>}
      {children}
      {rightIcon && !isLoading && <span className="ml-2">{rightIcon}</span>}
    </button>
  );
};

export default Button;