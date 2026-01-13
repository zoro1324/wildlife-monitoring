import { Battery, Wifi } from 'lucide-react';
import { cn, getBatteryColor, getSignalColor } from '../../utils/helpers';

export function BatteryIndicator({ percentage }) {
  return (
    <div className="flex items-center space-x-1">
      <Battery className={cn('w-4 h-4', getBatteryColor(percentage))} />
      <span className={cn('text-sm font-medium', getBatteryColor(percentage))}>
        {percentage}%
      </span>
    </div>
  );
}

export function SignalIndicator({ strength }) {
  return (
    <div className="flex items-center space-x-1">
      <Wifi className={cn('w-4 h-4', getSignalColor(strength))} />
      <span className={cn('text-sm font-medium', getSignalColor(strength))}>
        {strength}%
      </span>
    </div>
  );
}
