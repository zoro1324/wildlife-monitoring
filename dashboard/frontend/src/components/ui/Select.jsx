import { cn } from '../../utils/helpers';

function Select({ label, error, options = [], className, ...props }) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <select
        className={cn(
          'w-full rounded-lg border border-gray-300',
          'px-4 py-2.5 text-gray-900',
          'focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent',
          'disabled:bg-gray-50 disabled:text-gray-500',
          error && 'border-danger-500 focus:ring-danger-500',
          className
        )}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-sm text-danger-600">{error}</p>}
    </div>
  );
}

export default Select;
