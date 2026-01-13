import { cn } from '../../utils/helpers';

function Card({ children, className, noPadding = false, hoverable = false, onClick }) {
  return (
    <div
      className={cn(
        'bg-white rounded-xl shadow-card border border-gray-100',
        !noPadding && 'p-4 md:p-6',
        hoverable && 'transition-shadow duration-200 hover:shadow-card-hover cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

export default Card;
