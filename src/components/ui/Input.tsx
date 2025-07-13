
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  containerClassName?: string;
  leftIcon?: React.ReactNode;
}

const XCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const Input: React.FC<InputProps> = ({ label, id, error, containerClassName = '', className = '', leftIcon, type, value, onChange, ...props }) => {
  const showClearButton = value && String(value).length > 0 && 
                          ['text', 'search', 'url', 'tel', 'email', 'number', undefined].includes(type);

  const handleClearInput = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (onChange) {
      // Simulate a ChangeEvent
      const syntheticEvent = {
        target: {
          value: '',
          name: props.name || '', // Use name if available
          id: id || '',           // Use id if available
          type: type || 'text',
        } as HTMLInputElement, // Cast to satisfy TypeScript, actual event properties might differ
        currentTarget: e.currentTarget.form?.elements.namedItem(props.name || id || '') as HTMLInputElement || e.currentTarget.parentElement?.querySelector('input') as HTMLInputElement, // Try to get the actual input
        bubbles: true,
        cancelable: false,
        // Add other event properties if needed by consumers, though typically not for controlled components
      } as React.ChangeEvent<HTMLInputElement>;
      onChange(syntheticEvent);
    }
  };
  
  return (
    <div className={`mb-4 ${containerClassName}`}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5
                   transition-all duration-200 ease-out
                   peer-focus:text-primary peer-focus:font-semibold">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10 text-gray-500 dark:text-gray-400
                          transition-colors group-hover:text-primary dark:group-hover:text-primaryLight">
            {leftIcon}
          </div>
        )}
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          className={`peer
                      bg-white dark:bg-gray-800
                      border border-gray-300 dark:border-gray-600
                      rounded-xl shadow
                      transition-all duration-200 ease-out
                      hover:shadow-md
                      focus:ring-2 focus:ring-primary/50 focus:border-transparent
                      focus:shadow-lg
                      ${error ? 'border-danger dark:border-red-500 bg-red-50/70 dark:bg-red-900/40' : ''}
                      ${leftIcon ? 'pl-10' : ''}
                      ${showClearButton ? 'pr-10' : ''}
                      ${className}
                      text-gray-900 dark:text-gray-100
                      placeholder-gray-500 dark:placeholder-gray-400`}
          {...props}
        />
        {showClearButton && (
          <button
            type="button"
            onClick={handleClearInput}
            className="absolute inset-y-0 right-0 pr-3 flex items-center justify-center
                       text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200
                       transition-colors z-10 hover:scale-125 active:scale-95"
            aria-label="Clear input"
          >
            <XCircleIcon className="w-5 h-5" />
          </button>
        )}
      </div>
      {error && (
        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
          <XCircleIcon className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default Input;
