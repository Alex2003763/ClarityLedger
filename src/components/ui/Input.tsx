import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  containerClassName?: string;
  leftIcon?: React.ReactNode; // Added leftIcon prop
}

const Input: React.FC<InputProps> = ({ label, id, error, containerClassName = '', className = '', leftIcon, ...props }) => {
  return (
    <div className={`mb-4 ${containerClassName}`}>
      {label && <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>}
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {leftIcon}
          </div>
        )}
        <input
          id={id}
          className={`mt-1 block w-full px-3 py-2 border ${error ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-darkBorder'} 
                      rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary 
                      sm:text-sm bg-white dark:bg-darkSurface text-lighttext dark:text-darktext 
                      placeholder-gray-400 dark:placeholder-gray-500 
                      ${leftIcon ? 'pl-10' : ''} ${className}`}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
};

export default Input;