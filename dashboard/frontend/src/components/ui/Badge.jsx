import { cn } from '../../utils/helpers';

const variants = {
  default: 'bg-gray-100 text-gray-800',
  primary: 'bg-forest-100 text-forest-800',
  success: 'bg-safe-100 text-safe-800',
  warning: 'bg-warning-100 text-warning-800',
  danger: 'bg-danger-100 text-danger-800',
  info: 'bg-blue-100 text-blue-800',
  neutral: 'bg-gray-100 text-gray-600',
};

const sizes = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base',
};

function Badge({ children, variant = 'default', size = 'md', className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  );
}

export default Badge;
