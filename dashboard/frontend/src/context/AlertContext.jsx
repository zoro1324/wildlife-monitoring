import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useApp } from './AppContext';

const AlertContext = createContext(null);

// Generate alerts from detections
const generateAlertsFromDetections = (detections, existingAlerts = []) => {
  // Create a map of existing alerts to preserve their state
  const existingAlertsMap = new Map();
  existingAlerts.forEach(alert => {
    existingAlertsMap.set(alert.id, alert);
  });

  return detections
    .filter(d => d.riskLevel === 'danger' || d.riskLevel === 'warning')
    .map((detection) => {
      const alertId = `ALERT-${detection.id}`;
      const existingAlert = existingAlertsMap.get(alertId);
      
      return {
        id: alertId,
        type: detection.riskLevel === 'danger' ? 'intrusion' : 'wildlife',
        severity: detection.riskLevel,
        title: detection.riskLevel === 'danger' 
          ? `${detection.animalName} Detected - High Risk!`
          : `${detection.animalName} Spotted`,
        message: `${detection.animalName} detected by ${detection.cameraId} with ${Math.round(detection.confidence * 100)}% confidence.`,
        cameraId: detection.cameraId,
        cameraName: detection.cameraName,
        timestamp: detection.timestamp,
        // Preserve existing state or set defaults
        isRead: existingAlert?.isRead ?? false,
        isResolved: existingAlert?.isResolved ?? false,
        resolvedBy: existingAlert?.resolvedBy ?? null,
        resolvedAt: existingAlert?.resolvedAt ?? null,
        location: detection.location,
        locationHidden: detection.locationHidden,
        // Include image URL for the popup
        imageUrl: detection.imageUrl,
        animalType: detection.animalType,
        animalName: detection.animalName,
        confidence: detection.confidence,
      };
    });
};

export function AlertProvider({ children }) {
  const { detections } = useApp();
  const [alerts, setAlerts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const alertsRef = useRef([]);

  // Update alerts when detections change, preserving state
  useEffect(() => {
    if (detections && detections.length > 0) {
      const generatedAlerts = generateAlertsFromDetections(detections, alertsRef.current);
      setAlerts(generatedAlerts);
      alertsRef.current = generatedAlerts;
    } else {
      setAlerts([]);
      alertsRef.current = [];
    }
  }, [detections]);

  const unreadCount = alerts.filter((a) => !a.isRead).length;
  const unresolvedCount = alerts.filter((a) => !a.isResolved).length;

  const markAsRead = useCallback((alertId) => {
    setAlerts((prev) => {
      const updated = prev.map((alert) =>
        alert.id === alertId ? { ...alert, isRead: true } : alert
      );
      alertsRef.current = updated;
      return updated;
    });
  }, []);

  const markAllAsRead = useCallback(() => {
    setAlerts((prev) => {
      const updated = prev.map((alert) => ({ ...alert, isRead: true }));
      alertsRef.current = updated;
      return updated;
    });
  }, []);

  const resolveAlert = useCallback((alertId, resolvedBy = 'Current User') => {
    setAlerts((prev) => {
      const updated = prev.map((alert) =>
        alert.id === alertId
          ? { ...alert, isResolved: true, resolvedBy, resolvedAt: new Date().toISOString() }
          : alert
      );
      alertsRef.current = updated;
      return updated;
    });
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
