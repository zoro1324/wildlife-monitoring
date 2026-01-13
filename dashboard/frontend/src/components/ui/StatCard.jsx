import { cn } from '../../utils/helpers';
import Card from './Card';

function StatCard({ title, value, icon: Icon, trend, className }) {
  return (
    <Card className={cn('relative overflow-hidden', className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-2xl md:text-3xl font-bold text-gray-900">{value}</p>
          {trend && (
            <p
              className={cn(
                'text-sm mt-1',
                trend.isPositive ? 'text-safe-600' : 'text-danger-600'
              )}
            >
              {trend.isPositive ? '↑' : '↓'} {trend.value}% from last period
            </p>
          )}
        </div>
        {Icon && (
          <div className="p-3 rounded-xl bg-forest-50">
            <Icon className="w-6 h-6 text-forest-600" />
          </div>
        )}
      </div>
    </Card>
  );
}

export default StatCard;
