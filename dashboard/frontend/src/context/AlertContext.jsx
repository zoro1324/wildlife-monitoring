import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { mockAlerts } from '../data/mockData';

const AlertContext = createContext(null);

export function AlertProvider({ children }) {
  const [alerts, setAlerts] = useState(mockAlerts);
  const [notifications, setNotifications] = useState([]);

  const unreadCount = alerts.filter((a) => !a.isRead).length;
  const unresolvedCount = alerts.filter((a) => !a.isResolved).length;

  const markAsRead = useCallback((alertId) => {
    setAlerts((prev) =>
      prev.map((alert) =>
        alert.id === alertId ? { ...alert, isRead: true } : alert
      )
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setAlerts((prev) => prev.map((alert) => ({ ...alert, isRead: true })));
  }, []);

  const resolveAlert = useCallback((alertId, resolvedBy = 'Current User') => {
    setAlerts((prev) =>
      prev.map((alert) =>
        alert.id === alertId
          ? { ...alert, isResolved: true, resolvedBy, resolvedAt: new Date().toISOString() }
          : alert
      )
    );
  }, []);

  const addNotification = useCallback((notification) => {
    const id = Date.now().toString();
    setNotifications((prev) => [...prev, { ...notification, id }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 5000);
  }, []);

  const dismissNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const value = {
    alerts,
    notifications,
    unreadCount,
    unresolvedCount,
    markAsRead,
    markAllAsRead,
    resolveAlert,
    addNotification,
    dismissNotification,
  };

  return <AlertContext.Provider value={value}>{children}</AlertContext.Provider>;
}

export function useAlerts() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlerts must be used within an AlertProvider');
  }
  return context;
}
