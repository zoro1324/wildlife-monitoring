import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useApp } from './AppContext';

const AlertContext = createContext(null);

// Generate alerts from detections
const generateAlertsFromDetections = (detections) => {
  return detections
    .filter(d => d.riskLevel === 'danger' || d.riskLevel === 'warning')
    .map((detection, index) => ({
      id: `ALERT-${detection.id}`,
      type: detection.riskLevel === 'danger' ? 'intrusion' : 'wildlife',
      severity: detection.riskLevel,
      title: detection.riskLevel === 'danger' 
        ? `${detection.animalName} Detected - High Risk!`
        : `${detection.animalName} Spotted`,
      message: `${detection.animalName} detected by ${detection.cameraId} with ${Math.round(detection.confidence * 100)}% confidence.`,
      cameraId: detection.cameraId,
      cameraName: detection.cameraName,
      timestamp: detection.timestamp,
      isRead: false,
      isResolved: false,
      location: detection.location,
    }));
};

export function AlertProvider({ children }) {
  const { detections } = useApp();
  const [alerts, setAlerts] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // Update alerts when detections change
  useEffect(() => {
    if (detections && detections.length > 0) {
      const generatedAlerts = generateAlertsFromDetections(detections);
      setAlerts(generatedAlerts);
    } else {
      setAlerts([]);
    }
  }, [detections]);

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
