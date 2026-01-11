import { createContext, useContext, useState, useEffect } from 'react';
import { mockCameras, mockDetections } from '../data/mockData';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [cameras, setCameras] = useState(mockCameras);
  const [detections, setDetections] = useState(mockDetections);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [filters, setFilters] = useState({
    dateRange: 'today',
    animalType: 'all',
    cameraId: 'all',
    riskLevel: 'all',
  });

  // Simulate real-time detection updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate random camera status updates
      setCameras((prev) =>
        prev.map((cam) => ({
          ...cam,
          battery: Math.max(0, cam.battery - Math.random() * 0.1),
          lastSeen: new Date().toISOString(),
        }))
      );
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const refreshData = async () => {
    // Simulate API refresh
    await new Promise((resolve) => setTimeout(resolve, 500));
    setCameras([...mockCameras]);
    setDetections([...mockDetections]);
  };

  const value = {
    cameras,
    detections,
    selectedCamera,
    setSelectedCamera,
    sidebarOpen,
    setSidebarOpen,
    filters,
    setFilters,
    refreshData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
