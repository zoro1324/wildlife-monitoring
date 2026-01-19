import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { devicesAPI, userDevicesAPI, detectionsAPI } from '../services/api';
import { useAuth } from './AuthContext';

const AppContext = createContext(null);

// Transform backend device to frontend camera format
const transformDevice = (device) => ({
  id: device.device_id,
  name: device.device_id,
  zone: 'Zone A', // Default zone
  status: 'online', // Backend doesn't track online status yet
  battery: 85, // Default battery level
  signalStrength: 90, // Default signal
  solarCharging: true,
  solarStatus: 'charging',
  location: device.location?.visible 
    ? { lat: device.location.lat || 0, lng: device.location.lon || 0 }
    : null, // Hide location for public users
  locationHidden: !device.location?.visible,
  lastSeen: device.updated_at || new Date().toISOString(),
  lastActive: device.updated_at || new Date().toISOString(),
  owner: device.owned_by_username,
});

// Transform backend detection to frontend format
const transformDetection = (detection) => {
  // Map backend animal types to frontend format
  const animalTypeMap = {
    'Bear': 'bear',
    'Bison': 'bison',
    'Bision': 'bison',
    'Elephant': 'elephant',
    'Human': 'human',
    'Leopard': 'leopard',
    'Leopord': 'leopard',
    'Lion': 'lion',
    'Tiger': 'tiger',
    'Boar': 'boar',
    'Wild Boar': 'boar',
  };

  const animalType = animalTypeMap[detection.animal_type] || detection.animal_type.toLowerCase();
  
  // Determine risk level based on animal type
  const getRiskLevel = (type) => {
    const dangerAnimals = ['tiger', 'lion', 'leopard', 'human'];
    const warningAnimals = ['elephant', 'bear', 'boar'];
    if (dangerAnimals.includes(type)) return 'danger';
    if (warningAnimals.includes(type)) return 'warning';
    return 'safe';
  };

  // Handle location visibility
  const location = detection.device_location?.lat && !detection.device_location?.hidden
    ? { lat: detection.device_location.lat, lng: detection.device_location.lon }
    : null;

  return {
    id: `DET-${detection.id}`,
    cameraId: detection.device_id,
    cameraName: detection.device_id,
    animalType: animalType,
    animalName: detection.animal_type,
    confidence: detection.confidence,
    timestamp: detection.timestamp,
    riskLevel: getRiskLevel(animalType),
    location: location,
    locationHidden: detection.device_location?.hidden || false,
    imageUrl: detection.image_url, // Original image for grid display
    annotatedImageUrl: detection.annotated_image_url, // Annotated image with bounding boxes for modal
  };
};

export function AppProvider({ children }) {
  const { isAuthenticated, isRanger } = useAuth();
  const [cameras, setCameras] = useState([]);
  const [detections, setDetections] = useState([]);
  const [accessLevel, setAccessLevel] = useState(null); // 'ranger', 'device_owner', 'public'
  const [ownedDevicesCount, setOwnedDevicesCount] = useState(0);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    dateRange: 'today',
    animalType: 'all',
    cameraId: 'all',
    riskLevel: 'all',
  });

  // Fetch devices from API
  const fetchDevices = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      // Rangers see all devices; public/device owners see only their devices
      const response = isRanger ? await devicesAPI.getAll() : await userDevicesAPI.getMyDevices();

      if (response.devices) {
        const transformedDevices = response.devices.map(transformDevice);
        setCameras(transformedDevices);
      }
    } catch (err) {
      console.error('Error fetching devices:', err);
      setError('Failed to fetch devices');
    }
  }, [isAuthenticated, isRanger]);

  // Fetch detections from API
  const fetchDetections = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      const response = await detectionsAPI.getAll();
      if (response.images) {
        const transformedDetections = response.images.map(transformDetection);
        setDetections(transformedDetections);
        // Store access level info from response
        setAccessLevel(response.access_level);
        setOwnedDevicesCount(response.owned_devices_count || 0);
      }
    } catch (err) {
      console.error('Error fetching detections:', err);
      setError('Failed to fetch detections');
    }
  }, [isAuthenticated]);

  // Initial data fetch
  useEffect(() => {
    if (isAuthenticated) {
      setIsLoadingData(true);
      Promise.all([fetchDevices(), fetchDetections()])
        .finally(() => setIsLoadingData(false));
    }
  }, [isAuthenticated, fetchDevices, fetchDetections]);

  // Refresh data periodically (every 30 seconds)
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      fetchDevices();
      fetchDetections();
    }, 30000);

    return () => clearInterval(interval);
  }, [isAuthenticated, fetchDevices, fetchDetections]);

  const refreshData = async () => {
    setIsLoadingData(true);
    setError(null);
    
    try {
      await Promise.all([fetchDevices(), fetchDetections()]);
    } catch (err) {
      setError('Failed to refresh data');
      console.error('Refresh error:', err);
    } finally {
      setIsLoadingData(false);
    }
  };

  const value = {
    cameras,
    detections,
    accessLevel,
    ownedDevicesCount,
    selectedCamera,
    setSelectedCamera,
    sidebarOpen,
    setSidebarOpen,
    filters,
    setFilters,
    refreshData,
    isLoadingData,
    error,
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
