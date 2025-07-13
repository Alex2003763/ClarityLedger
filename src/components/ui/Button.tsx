
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'icon';
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
  const baseStyles = "font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-darkbg transition-all duration-200 ease-in-out flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed shadow-sm hover:shadow-lg";

  // Updated variant styles based on FinTrack theme
  const variantStyles = {
    primary: 'bg-primary text-white hover:bg-primaryDark focus:ring-primaryDark dark:hover:bg-primaryLight transform hover:scale-[1.03] active:scale-[0.99]',
    secondary: 'bg-secondary text-black hover:bg-teal-400 focus:ring-teal-500 dark:hover:bg-teal-300 transform hover:scale-[1.03] active:scale-[0.99]',
    danger: 'bg-danger text-white hover:bg-red-700 focus:ring-red-700 dark:hover:bg-red-500',
    ghost: 'bg-transparent text-lighttext dark:text-darktext hover:bg-gray-500/10 focus:ring-primary dark:hover:bg-gray-500/20 shadow-none hover:shadow-none',
    outline: 'bg-transparent text-primary border border-primary hover:bg-primary/10 focus:ring-primary dark:text-primaryLight dark:border-primaryLight dark:hover:bg-primaryLight/10 shadow-none'
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-7 py-3 text-base',
    icon: 'p-2.5', // For icon-only buttons
  };

  const spinnerColor = (variant === 'primary' || variant === 'secondary' || variant === 'danger') 
    ? "text-white" 
    : "text-primary dark:text-primaryLight";

  const spinnerMargin = children ? (size === 'sm' ? 'mr-1.5' : 'mr-2') : 'mr-0';

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading && (
        <svg className={`animate-spin h-4 w-4 ${spinnerMargin} ${spinnerColor}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {leftIcon && !isLoading && <span className={`flex-shrink-0 ${children ? (size === 'sm' ? 'mr-1.5' : 'mr-2') : ''}`}>{leftIcon}</span>}
      {children && <span className="flex-grow-0 text-center whitespace-nowrap">{children}</span>}
      {rightIcon && !isLoading && <span className={`flex-shrink-0 ${children ? (size === 'sm' ? 'ml-1.5' : 'ml-2') : ''}`}>{rightIcon}</span>}
    </button>
  );
};

export default Button;