import { cn } from '../../utils/helpers';

export function CardSkeleton({ className }) {
  return (
    <div className={cn('animate-pulse bg-white rounded-xl p-4 border border-gray-100', className)}>
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
      <div className="h-8 bg-gray-200 rounded w-1/2 mb-2" />
      <div className="h-3 bg-gray-200 rounded w-1/3" />
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="animate-pulse bg-white rounded-xl p-4 border border-gray-100">
      <div className="flex justify-between">
        <div className="flex-1">
          <div className="h-3 bg-gray-200 rounded w-1/2 mb-2" />
          <div className="h-8 bg-gray-200 rounded w-1/3" />
        </div>
        <div className="w-12 h-12 bg-gray-200 rounded-xl" />
      </div>
    </div>
  );
}

export function TableRowSkeleton({ columns = 4 }) {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-gray-200 rounded w-full" />
        </td>
      ))}
    </tr>
  );
}
