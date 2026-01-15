import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { Camera, AlertTriangle, Activity, Eye, ChevronRight, Clock, Shield, Users, MapPin, Upload, Navigation } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useAlerts } from '../context/AlertContext';
import { Card, Badge, Button, StatCard, EmptyState } from '../components/ui';
import { formatSmartDate, getAnimalIcon, getRiskConfig } from '../utils/helpers';

// Default map zones when no data
const defaultMapZones = [
  { id: 'default', name: 'Monitoring Area', bounds: [[12.9, 77.5], [13.0, 77.7]], color: '#166534' }
];

// Fix Leaflet default marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom animal icon for map
const createAnimalIcon = (animalType, riskLevel) => {
  const icon = getAnimalIcon(animalType);
  const bgColor = riskLevel === 'danger' ? '#DC2626' : riskLevel === 'warning' ? '#F59E0B' : '#22C55E';
  return L.divIcon({
    className: 'custom-animal-marker',
    html: `
      <div style="
        width: 36px; 
        height: 36px; 
        border-radius: 50%; 
        background: ${bgColor}; 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        font-size: 18px;
        border: 2px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      ">
        ${icon}
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
};

// Custom camera icon
const createCameraIcon = (status) => {
  const bgColor = status === 'online' ? '#166534' : '#DC2626';
  return L.divIcon({
    className: 'custom-camera-marker',
    html: `
      <div style="
        width: 28px; 
        height: 28px; 
        border-radius: 6px; 
        background: ${bgColor}; 
        display: flex; 
        align-items: center; 
        justify-content: center;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      ">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
          <circle cx="12" cy="13" r="4"/>
        </svg>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
};

// Trail colors
const trailColors = {
  elephant: '#92400E',
  tiger: '#DC2626',
  lion: '#EA580C',
  leopard: '#F59E0B',
  bear: '#78350F',
  buffalo: '#1E40AF',
  bison: '#1E40AF',
  human: '#7C3AED',
};

function RangerDashboard() {
  const navigate = useNavigate();
  const { cameras, detections, isLoadingData } = useApp();
  const { userLocation } = useAuth();
  const { alerts, unresolvedCount } = useAlerts();

  const onlineCameras = cameras.filter((c) => c.status === 'online').length;
  const todayDetections = detections.length;
  const criticalAlerts = alerts.filter((a) => a.severity === 'danger' && !a.isResolved).length;
  const humanDetections = detections.filter(d => d.animalType === 'human').length;

  const recentDetections = detections.slice(0, 5);
  const criticalAlertsList = alerts.filter((a) => a.severity === 'danger' && !a.isResolved).slice(0, 3);

  // Map configuration - prefer user location, then camera location, then default
  const firstCameraWithLocation = cameras.find(c => c.location?.lat && c.location?.lng);
  const mapCenter = userLocation
    ? [userLocation.lat, userLocation.lng]
    : firstCameraWithLocation 
      ? [firstCameraWithLocation.location.lat, firstCameraWithLocation.location.lng]
      : [12.9716, 77.5946]; // Default to Bangalore
  const mapZoom = 12;

  return (
    <div className="space-y-6 pb-16 lg:pb-0">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-gray-900">
            Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Real-time overview of wildlife monitoring
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            leftIcon={<Upload className="w-4 h-4" />}
            onClick={() => navigate('/ranger/device-simulator')}
          >
            Simulate Device
          </Button>
          <Button
            variant="primary"
            leftIcon={<Eye className="w-4 h-4" />}
            onClick={() => navigate('/ranger/live-monitoring')}
          >
            View Live Feeds
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Active Cameras"
          value={`${onlineCameras}/${cameras.length}`}
          icon={Camera}
        />
        <StatCard
          title="Today's Detections"
          value={todayDetections}
          icon={Activity}
        />
        <StatCard
          title="Active Alerts"
          value={unresolvedCount}
          icon={AlertTriangle}
        />
        <StatCard
          title="Critical Alerts"
          value={criticalAlerts}
          icon={AlertTriangle}
        />
        <StatCard
          title="Human Detections"
          value={humanDetections}
          icon={Users}
        />
      </div>

      {/* Live Animal Map */}
      <Card noPadding className="overflow-hidden">
        <div className="p-4 bg-forest-50 border-b border-forest-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-forest-600" />
            <h2 className="text-lg font-semibold text-gray-900">Live Animal Locations</h2>
          </div>
          <div className="flex gap-2">
            <Badge variant="danger" size="sm">🔴 Danger</Badge>
            <Badge variant="warning" size="sm">🟡 Warning</Badge>
            <Badge variant="success" size="sm">🟢 Safe</Badge>
            <Badge variant="info" size="sm">📹 Camera</Badge>
          </div>
        </div>
        <div className="h-[350px]">
          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            className="h-full w-full"
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Risk Zones */}
            {defaultMapZones.map((zone) => (
              <Circle
                key={zone.id}
                center={[(zone.bounds[0][0] + zone.bounds[1][0]) / 2, (zone.bounds[0][1] + zone.bounds[1][1]) / 2]}
                radius={1500}
                pathOptions={{
                  color: zone.color,
                  fillColor: zone.color,
                  fillOpacity: 0.1,
                  weight: 2,
                }}
              />
            ))}

            {/* User Location Marker */}
            {userLocation && (
              <Marker
                position={[userLocation.lat, userLocation.lng]}
                icon={L.divIcon({
                  className: 'custom-user-marker',
                  html: `
                    <div style="
                      width: 24px;
                      height: 24px;
                      border-radius: 50%;
                      background: #3B82F6;
                      border: 3px solid white;
                      box-shadow: 0 2px 8px rgba(59, 130, 246, 0.5);
                    "></div>
                  `,
                  iconSize: [24, 24],
                  iconAnchor: [12, 12],
                })}
              >
                <Popup>
                  <div className="text-center p-1">
                    <Navigation className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                    <p className="font-semibold text-sm">Your Location</p>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Camera Markers - only show cameras with visible locations */}
            {cameras.filter(c => c.location && !c.locationHidden).map((camera) => (
              <Marker
                key={camera.id}
                position={[camera.location.lat, camera.location.lng]}
                icon={createCameraIcon(camera.status)}
              >
                <Popup>
                  <div className="p-1 min-w-[160px]">
                    <h3 className="font-semibold text-gray-900">{camera.id}</h3>
                    <p className="text-xs text-gray-500">{camera.name}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${camera.status === 'online' ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span className="text-xs">{camera.status}</span>
                      <span className="text-xs text-gray-400">• {camera.battery}%</span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Animal Detection Markers - only show detections with visible locations */}
            {detections.filter(d => d.location && !d.locationHidden).map((detection) => (
              <Marker
                key={detection.id}
                position={[detection.location.lat, detection.location.lng]}
                icon={createAnimalIcon(detection.animalType, detection.riskLevel)}
              >
                <Popup>
                  <div className="p-1 min-w-[180px]">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{getAnimalIcon(detection.animalType)}</span>
                      <div>
                        <h3 className="font-semibold text-gray-900">{detection.animalName}</h3>
                        <p className="text-xs text-gray-500">{detection.cameraName}</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">{formatSmartDate(detection.timestamp)}</p>
                    {detection.notes && (
                      <p className="mt-1 text-xs text-gray-600 bg-gray-50 p-1 rounded">{detection.notes}</p>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
        <div className="p-3 bg-gray-50 border-t border-gray-100 flex justify-end">
          <Button
            variant="secondary"
            size="sm"
            rightIcon={<ChevronRight className="w-4 h-4" />}
            onClick={() => navigate('/ranger/map-tracking')}
          >
            Open Full Map
          </Button>
        </div>
      </Card>

      {/* Critical Alerts Banner */}
      {criticalAlertsList.length > 0 && (
        <Card className="bg-danger-50 border-danger-200">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-danger-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-danger-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-danger-800">Critical Alerts Require Attention</h3>
              <div className="mt-2 space-y-2">
                {criticalAlertsList.map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between">
                    <p className="text-sm text-danger-700">{alert.message}</p>
                    <Badge variant="danger" size="sm">
                      {formatSmartDate(alert.timestamp)}
                    </Badge>
                  </div>
                ))}
              </div>
              <Button
                variant="danger"
                size="sm"
                className="mt-3"
                onClick={() => navigate('/ranger/alerts')}
              >
                View All Alerts
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Detections */}
        <div className="lg:col-span-2">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recent Detections</h2>
              <Button
                variant="ghost"
                size="sm"
                rightIcon={<ChevronRight className="w-4 h-4" />}
                onClick={() => navigate('/ranger/detection-history')}
              >
                View All
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-500 border-b">
                    <th className="pb-3 font-medium">Animal</th>
                    <th className="pb-3 font-medium">Camera</th>
                    <th className="pb-3 font-medium">Time</th>
                    <th className="pb-3 font-medium">Risk</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentDetections.map((detection) => {
                    const riskConfig = getRiskConfig(detection.riskLevel);
                    return (
                      <tr key={detection.id} className="hover:bg-gray-50">
                        <td className="py-3">
                          <div className="flex items-center space-x-2">
                            <span className="text-xl">{getAnimalIcon(detection.animalType)}</span>
                            <span className="font-medium text-gray-900">{detection.animalName}</span>
                          </div>
                        </td>
                        <td className="py-3 text-gray-600">{detection.cameraId}</td>
                        <td className="py-3">
                          <div className="flex items-center text-gray-500 text-sm">
                            <Clock className="w-4 h-4 mr-1" />
                            {formatSmartDate(detection.timestamp)}
                          </div>
                        </td>
                        <td className="py-3">
                          <Badge
                            variant={detection.riskLevel === 'danger' ? 'danger' : 
                                    detection.riskLevel === 'warning' ? 'warning' : 'success'}
                          >
                            {riskConfig.label}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Quick Actions & Camera Status */}
        <div className="space-y-6">
          {/* Camera Status */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Camera Status</h2>
            <div className="space-y-3">
              {cameras.slice(0, 4).map((camera) => (
                <div
                  key={camera.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      camera.status === 'online' ? 'bg-safe-500' : 'bg-danger-500'
                    }`} />
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{camera.id}</p>
                      <p className="text-xs text-gray-500">{camera.name}</p>
                    </div>
                  </div>
                  <Badge
                    variant={camera.status === 'online' ? 'success' : 'danger'}
                    size="sm"
                  >
                    {camera.status}
                  </Badge>
                </div>
              ))}
            </div>
            <Button
              variant="ghost"
              className="w-full mt-4"
              onClick={() => navigate('/ranger/camera-health')}
            >
              View All Cameras
            </Button>
          </Card>
        </div>
      </div>

      {/* Human Detection Section (Ranger Only) */}
      <Card className="bg-blue-50 border-blue-200">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-blue-800">Human Activity Monitoring</h3>
            <p className="text-sm text-blue-700 mt-1">
              Track human presence in protected areas to prevent poaching and unauthorized access.
            </p>
            <div className="mt-3 flex items-center gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-800">
                  {detections.filter(d => d.animalType === 'human').length}
                </p>
                <p className="text-xs text-blue-600">Human Detections</p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate('/ranger/detection-history?type=human')}
              >
                View Details
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default RangerDashboard;
