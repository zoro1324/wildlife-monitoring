import { useState } from 'react';
import { Camera, MapPin, Clock, Activity, AlertTriangle, Eye, Lock, RefreshCw } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card, Badge, Button, EmptyState } from '../components/ui';
import { formatSmartDate, getAnimalIcon } from '../utils/helpers';

function MyDevices() {
  const { cameras, detections, accessLevel, ownedDevicesCount, refreshData, isLoadingData } = useApp();
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  if (!isDeviceOwner) {
    return (
      <div className="space-y-6 pb-16 lg:pb-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-gray-900">
            My Devices
          </h1>
          <p className="text-gray-600 mt-1">
            Manage your wildlife monitoring devices
          </p>
        </div>

        <Card className="text-center py-12">
          <Lock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No Devices Linked</h2>
          <p className="text-gray-500 max-w-md mx-auto">
            You don't have any monitoring devices linked to your account yet. 
            Contact the forest department to register your devices.
          </p>
        </Card>
      </div>
    );
  }

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
          <Badge variant="success" className="flex items-center gap-1">
            <Camera className="w-3 h-3" />
            {ownedDevicesCount} Device{ownedDevicesCount > 1 ? 's' : ''}
          </Badge>
          <Button
            variant="outline"
            leftIcon={<RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />}
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Device Stats */}
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

      {/* Device List */}
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
                  <Badge variant={camera.status === 'online' ? 'success' : 'danger'}>
                    {camera.status}
                  </Badge>
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

      {cameras.length === 0 && (
        <EmptyState
          icon={Camera}
          title="No devices found"
          description="Your monitoring devices will appear here once they're registered."
        />
      )}
    </div>
  );
}

export default MyDevices;
