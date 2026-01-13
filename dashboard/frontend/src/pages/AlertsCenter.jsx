import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCircle, AlertTriangle, AlertCircle, Camera, Clock, MapPin, Check, ChevronRight } from 'lucide-react';
import { useAlerts } from '../context/AlertContext';
import { Card, Badge, Button, Select, EmptyState } from '../components/ui';
import { getRelativeTime, cn } from '../utils/helpers';

function AlertsCenter() {
  const navigate = useNavigate();
  const { alerts, markAsRead, resolveAlert, markAllAsRead, unreadCount } = useAlerts();
  const [filter, setFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');

  const filterOptions = [
    { value: 'all', label: 'All Alerts' },
    { value: 'unread', label: 'Unread' },
    { value: 'unresolved', label: 'Unresolved' },
    { value: 'resolved', label: 'Resolved' },
  ];

  const severityOptions = [
    { value: 'all', label: 'All Severities' },
    { value: 'danger', label: 'Critical' },
    { value: 'warning', label: 'Warning' },
    { value: 'info', label: 'Info' },
  ];

  const filteredAlerts = useMemo(() => {
    let result = [...alerts];
    switch (filter) {
      case 'unread': result = result.filter((a) => !a.isRead); break;
      case 'unresolved': result = result.filter((a) => !a.isResolved); break;
      case 'resolved': result = result.filter((a) => a.isResolved); break;
    }
    if (severityFilter !== 'all') result = result.filter((a) => a.severity === severityFilter);
    return result;
  }, [alerts, filter, severityFilter]);

  const groupedAlerts = useMemo(() => {
    const groups = {};
    filteredAlerts.forEach((alert) => {
      const date = new Date(alert.timestamp).toDateString();
      if (!groups[date]) groups[date] = [];
      groups[date].push(alert);
    });
    return Object.entries(groups).map(([date, alerts]) => {
      const d = new Date(date);
      const today = new Date().toDateString();
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      const label = date === today ? 'Today' : date === yesterday ? 'Yesterday' : d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
      return { date, label, alerts };
    });
  }, [filteredAlerts]);

  const handleAlertClick = (alert) => {
    if (!alert.isRead) markAsRead(alert.id);
    if (alert.location) navigate('/map-tracking');
    else if (alert.cameraId) navigate('/camera-health');
  };

  const handleResolve = (e, alertId) => {
    e.stopPropagation();
    resolveAlert(alertId);
  };

  return (
    <div className="space-y-6 pb-16 lg:pb-0">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-gray-900">Alerts Center</h1>
          <p className="text-gray-600 mt-1">{unreadCount > 0 ? `${unreadCount} unread alert${unreadCount > 1 ? 's' : ''}` : 'All alerts read'}</p>
        </div>
        {unreadCount > 0 && <Button variant="ghost" onClick={markAllAsRead} leftIcon={<Check className="w-4 h-4" />}>Mark All as Read</Button>}
      </div>

      <Card noPadding className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 max-w-xs"><Select value={filter} onChange={(e) => setFilter(e.target.value)} options={filterOptions} /></div>
          <div className="flex-1 max-w-xs"><Select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)} options={severityOptions} /></div>
          <div className="flex items-center space-x-4 ml-auto text-sm">
            <div className="flex items-center space-x-2"><span className="w-2 h-2 rounded-full bg-danger-500" /><span className="text-gray-600">{alerts.filter((a) => a.severity === 'danger' && !a.isResolved).length} Critical</span></div>
            <div className="flex items-center space-x-2"><span className="w-2 h-2 rounded-full bg-warning-500" /><span className="text-gray-600">{alerts.filter((a) => a.severity === 'warning' && !a.isResolved).length} Warning</span></div>
          </div>
        </div>
      </Card>

      {groupedAlerts.length > 0 ? (
        <div className="space-y-6">
          {groupedAlerts.map((group) => (
            <div key={group.date}>
              <h3 className="text-sm font-medium text-gray-500 mb-3">{group.label}</h3>
              <div className="space-y-3">
                {group.alerts.map((alert) => {
                  const icons = { danger: AlertCircle, warning: AlertTriangle, info: Bell };
                  const Icon = icons[alert.severity] || Bell;
                  const colors = {
                    danger: { bg: 'bg-danger-50', border: 'border-danger-200', icon: 'text-danger-500 bg-danger-100' },
                    warning: { bg: 'bg-warning-50', border: 'border-warning-200', icon: 'text-warning-500 bg-warning-100' },
                    info: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'text-blue-500 bg-blue-100' },
                  };
                  const colorSet = colors[alert.severity] || colors.info;

                  return (
                    <div
                      key={alert.id}
                      className={cn(
                        'rounded-xl border p-4 cursor-pointer transition-all duration-200 hover:shadow-md',
                        alert.isResolved ? 'bg-gray-50 border-gray-200 opacity-70' : `${colorSet.bg} ${colorSet.border}`,
                        !alert.isRead && 'ring-2 ring-offset-2',
                        !alert.isRead && alert.severity === 'danger' && 'ring-danger-300',
                        !alert.isRead && alert.severity === 'warning' && 'ring-warning-300'
                      )}
                      onClick={() => handleAlertClick(alert)}
                    >
                      <div className="flex items-start space-x-4">
                        <div className={cn('flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center', alert.isResolved ? 'bg-gray-200 text-gray-500' : colorSet.icon)}>
                          {alert.isResolved ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className={cn('font-medium', alert.isResolved ? 'text-gray-600' : 'text-gray-900')}>{alert.message}</p>
                              {alert.description && <p className="text-sm text-gray-600 mt-1 line-clamp-2">{alert.description}</p>}
                            </div>
                            <div className="flex-shrink-0 flex items-center space-x-2">
                              {!alert.isRead && <span className="w-2 h-2 rounded-full bg-forest-600" />}
                              <Badge variant={alert.isResolved ? 'neutral' : alert.severity === 'danger' ? 'danger' : alert.severity === 'warning' ? 'warning' : 'info'} size="sm">
                                {alert.isResolved ? 'Resolved' : alert.severity}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500">
                            <div className="flex items-center"><Clock className="w-4 h-4 mr-1" />{getRelativeTime(alert.timestamp)}</div>
                            {alert.cameraId && <div className="flex items-center"><Camera className="w-4 h-4 mr-1" />{alert.cameraId}</div>}
                            {alert.location && <div className="flex items-center"><MapPin className="w-4 h-4 mr-1" />View on map</div>}
                          </div>
                          {!alert.isResolved && (
                            <div className="flex items-center justify-end mt-3 pt-3 border-t border-gray-200/50">
                              <Button variant="ghost" size="sm" onClick={(e) => handleResolve(e, alert.id)} leftIcon={<Check className="w-4 h-4" />}>Mark as Resolved</Button>
                              <ChevronRight className="w-4 h-4 text-gray-400 ml-2" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState icon={Bell} title="No alerts found" description="There are no alerts matching your current filters." action={<Button variant="primary" onClick={() => { setFilter('all'); setSeverityFilter('all'); }}>View All Alerts</Button>} />
      )}
    </div>
  );
}

export default AlertsCenter;
