import { cn } from '../../utils/helpers';

function Input({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  className,
  ...props
}) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            {leftIcon}
          </div>
        )}
        <input
          className={cn(
            'w-full rounded-lg border border-gray-300',
            'px-4 py-2.5 text-gray-900',
            'placeholder:text-gray-400',
            'focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent',
            'disabled:bg-gray-50 disabled:text-gray-500',
            leftIcon && 'pl-10',
            rightIcon && 'pr-10',
            error && 'border-danger-500 focus:ring-danger-500',
            className
          )}
          {...props}
        />
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400">
            {rightIcon}
          </div>
        )}
      </div>
      {(error || helperText) && (
        <p className={cn('mt-1 text-sm', error ? 'text-danger-600' : 'text-gray-500')}>
          {error || helperText}
        </p>
      )}
    </div>
  );
}

export default Input;
