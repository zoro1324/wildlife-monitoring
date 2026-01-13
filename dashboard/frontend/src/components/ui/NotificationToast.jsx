import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { cn } from '../../utils/helpers';

function NotificationToast({ notifications, onDismiss }) {
  if (!notifications?.length) return null;

  const icons = {
    success: CheckCircle,
    warning: AlertTriangle,
    error: AlertCircle,
    info: Info,
  };

  const colors = {
    success: 'bg-safe-50 border-safe-200 text-safe-800',
    warning: 'bg-warning-50 border-warning-200 text-warning-800',
    error: 'bg-danger-50 border-danger-200 text-danger-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  return (
    <div className="fixed bottom-20 lg:bottom-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map((notification) => {
        const Icon = icons[notification.type] || Info;
        return (
          <div
            key={notification.id}
            className={cn(
              'flex items-start p-4 rounded-lg border shadow-lg animate-slide-up',
              colors[notification.type] || colors.info
            )}
          >
            <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium">{notification.title}</p>
              {notification.message && (
                <p className="text-sm opacity-80 mt-1">{notification.message}</p>
              )}
            </div>
            <button
              onClick={() => onDismiss(notification.id)}
              className="ml-3 opacity-60 hover:opacity-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default NotificationToast;
