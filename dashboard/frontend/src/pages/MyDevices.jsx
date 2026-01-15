import { useState } from 'react';
import { Camera, MapPin, Clock, Activity, AlertTriangle, Eye, Lock, RefreshCw, Plus, X, Loader2, Trash2, Navigation } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card, Badge, Button, EmptyState, Modal, Input } from '../components/ui';
import { formatSmartDate, getAnimalIcon } from '../utils/helpers';
import { userDevicesAPI } from '../services/api';

function MyDevices() {
  const { cameras, detections, accessLevel, ownedDevicesCount, refreshData, isLoadingData } = useApp();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [newDevice, setNewDevice] = useState({
    device_id: '',
    lat: '',
    lon: '',
  });

  // Check if user is a device owner
  const isDeviceOwner = accessLevel === 'device_owner' || ownedDevicesCount > 0;

  // Get detections for each camera
  const getDeviceDetections = (cameraId) => {
    return detections.filter(d => d.cameraId === cameraId);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshData();
    setIsRefreshing(false);
  };

  const handleAddDevice = async (e) => {
    e.preventDefault();
    setAddError('');
    setAddSuccess('');

    if (!newDevice.device_id.trim()) {
      setAddError('Device ID is required');
      return;
    }

    setIsAdding(true);

    try {
      const deviceData = {
        device_id: newDevice.device_id.trim(),
      };
      
      // Only add lat/lon if provided
      if (newDevice.lat && newDevice.lon) {
        deviceData.lat = parseFloat(newDevice.lat);
        deviceData.lon = parseFloat(newDevice.lon);
      }

      await userDevicesAPI.addDevice(deviceData);
      setAddSuccess('Device added successfully!');
      setNewDevice({ device_id: '', lat: '', lon: '' });
      
      // Refresh data and close modal after delay
      await refreshData();
      setTimeout(() => {
        setShowAddModal(false);
        setAddSuccess('');
      }, 1500);
    } catch (error) {
      setAddError(error.message || 'Failed to add device');
    }

    setIsAdding(false);
  };

  const handleRemoveDevice = async (deviceId) => {
    if (!confirm('Are you sure you want to remove this device from your account?')) {
      return;
    }

    try {
      await userDevicesAPI.removeDevice(deviceId);
      await refreshData();
    } catch (error) {
      alert(error.message || 'Failed to remove device');
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setAddError('Geolocation is not supported by your browser');
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setNewDevice(prev => ({
          ...prev,
          lat: position.coords.latitude.toFixed(6),
          lon: position.coords.longitude.toFixed(6),
        }));
        setIsGettingLocation(false);
      },
      (error) => {
        setAddError('Unable to get your location. Please enter manually.');
        setIsGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setAddError('');
    setAddSuccess('');
    setNewDevice({ device_id: '', lat: '', lon: '' });
  };

  return (
    <div className="space-y-6 pb-16 lg:pb-0">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-gray-900">
            My Devices
          </h1>
          <p className="text-gray-600 mt-1">
            Manage your wildlife monitoring devices
          </p>
        </div>
        <div className="flex gap-2">
          {isDeviceOwner && (
            <Badge variant="success" className="flex items-center gap-1">
              <Camera className="w-3 h-3" />
              {ownedDevicesCount} Device{ownedDevicesCount > 1 ? 's' : ''}
            </Badge>
          )}
          <Button
            variant="outline"
            leftIcon={<RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />}
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setShowAddModal(true)}
          >
            Add Device
          </Button>
        </div>
      </div>

      {/* Device Stats - only show if has devices */}
      {isDeviceOwner && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="text-center">
            <Camera className="w-8 h-8 text-forest-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{cameras.length}</p>
            <p className="text-sm text-gray-500">Total Devices</p>
          </Card>
          <Card className="text-center">
            <Activity className="w-8 h-8 text-safe-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">
              {cameras.filter(c => c.status === 'online').length}
            </p>
            <p className="text-sm text-gray-500">Online</p>
          </Card>
          <Card className="text-center">
            <Eye className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{detections.length}</p>
            <p className="text-sm text-gray-500">Total Detections</p>
          </Card>
          <Card className="text-center">
            <AlertTriangle className="w-8 h-8 text-danger-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">
              {detections.filter(d => d.riskLevel === 'danger').length}
            </p>
            <p className="text-sm text-gray-500">Danger Alerts</p>
          </Card>
        </div>
      )}

      {/* No Devices Message */}
      {!isDeviceOwner && (
        <Card className="text-center py-12">
          <Camera className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No Devices Yet</h2>
          <p className="text-gray-500 max-w-md mx-auto mb-4">
            Add your first wildlife monitoring device to start receiving alerts and tracking wildlife near your property.
          </p>
          <Button
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setShowAddModal(true)}
          >
            Add Your First Device
          </Button>
        </Card>
      )}

      {/* Device List */}
      {isDeviceOwner && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {cameras.map((camera) => {
            const deviceDetections = getDeviceDetections(camera.id);
            const recentDetections = deviceDetections.slice(0, 5);
            const dangerCount = deviceDetections.filter(d => d.riskLevel === 'danger').length;

            return (
              <Card key={camera.id} noPadding className="overflow-hidden">
                {/* Device Header */}
                <div className="p-4 bg-forest-50 border-b border-forest-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${camera.status === 'online' ? 'bg-safe-100' : 'bg-danger-100'}`}>
                        <Camera className={`w-5 h-5 ${camera.status === 'online' ? 'text-safe-600' : 'text-danger-600'}`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{camera.id}</h3>
                        <p className="text-sm text-gray-500">{camera.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={camera.status === 'online' ? 'success' : 'danger'}>
                        {camera.status}
                      </Badge>
                      <button
                        onClick={() => handleRemoveDevice(camera.id)}
                        className="p-1.5 text-gray-400 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                        title="Remove device"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Device Info */}
                <div className="p-4 space-y-4">
                  {/* Location */}
                  {camera.location && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span>
                        {camera.location.lat?.toFixed(4)}, {camera.location.lng?.toFixed(4)}
                      </span>
                    </div>
                  )}

                  {/* Last Activity */}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span>Last seen: {formatSmartDate(camera.lastSeen)}</span>
                  </div>

                  {/* Stats Row */}
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4 text-blue-500" />
                      <span className="font-medium">{deviceDetections.length}</span>
                      <span className="text-gray-500">detections</span>
                    </div>
                    {dangerCount > 0 && (
                      <div className="flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4 text-danger-500" />
                        <span className="font-medium text-danger-600">{dangerCount}</span>
                        <span className="text-gray-500">alerts</span>
                      </div>
                    )}
                  </div>

                  {/* Battery (if available) */}
                  {camera.battery !== undefined && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">Battery:</span>
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            camera.battery > 50 ? 'bg-safe-500' : 
                            camera.battery > 20 ? 'bg-warning-500' : 'bg-danger-500'
                          }`}
                          style={{ width: `${camera.battery}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{camera.battery}%</span>
                    </div>
                  )}

                  {/* Recent Detections */}
                  {recentDetections.length > 0 && (
                    <div className="pt-3 border-t border-gray-100">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Detections</h4>
                      <div className="space-y-2">
                        {recentDetections.map((detection) => (
                          <div
                            key={detection.id}
                            className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{getAnimalIcon(detection.animalType)}</span>
                              <div>
                                <p className="text-sm font-medium text-gray-900">{detection.animalName}</p>
                                <p className="text-xs text-gray-500">{formatSmartDate(detection.timestamp)}</p>
                              </div>
                            </div>
                            <Badge
                              variant={detection.riskLevel === 'danger' ? 'danger' : 
                                      detection.riskLevel === 'warning' ? 'warning' : 'success'}
                              size="sm"
                            >
                              {detection.riskLevel}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {recentDetections.length === 0 && (
                    <div className="pt-3 border-t border-gray-100 text-center text-gray-500 text-sm py-4">
                      No detections from this device yet
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Device Modal */}
      <Modal isOpen={showAddModal} onClose={handleCloseModal} title="Add New Device">
        <form onSubmit={handleAddDevice} className="space-y-4">
          {addError && (
            <div className="p-3 bg-danger-50 border border-danger-200 rounded-lg text-danger-700 text-sm">
              {addError}
            </div>
          )}
          
          {addSuccess && (
            <div className="p-3 bg-safe-50 border border-safe-200 rounded-lg text-safe-700 text-sm">
              {addSuccess}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Device ID <span className="text-danger-500">*</span>
            </label>
            <input
              type="text"
              value={newDevice.device_id}
              onChange={(e) => setNewDevice({ ...newDevice, device_id: e.target.value })}
              placeholder="e.g., ESP32-CAM-001"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter the unique ID printed on your device or from the device setup
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">
                Device Location (optional)
              </label>
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={isGettingLocation}
                className="flex items-center gap-1 text-sm text-forest-600 hover:text-forest-700 font-medium disabled:opacity-50"
              >
                {isGettingLocation ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Navigation className="w-4 h-4" />
                )}
                Use Current Location
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Latitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={newDevice.lat}
                  onChange={(e) => setNewDevice({ ...newDevice, lat: e.target.value })}
                  placeholder="e.g., 12.9716"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Longitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={newDevice.lon}
                  onChange={(e) => setNewDevice({ ...newDevice, lon: e.target.value })}
                  placeholder="e.g., 77.5946"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            Location helps you receive relevant alerts. You can update this later.
          </p>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={handleCloseModal}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              leftIcon={isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              disabled={isAdding}
            >
              {isAdding ? 'Adding...' : 'Add Device'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default MyDevices;
