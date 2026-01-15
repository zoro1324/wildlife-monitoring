import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import { AlertTriangle, Activity, Eye, Clock, MapPin, Navigation, Trees, Bell, Shield, Lock, Camera } from 'lucide-react';
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

function UserDashboard() {
  const navigate = useNavigate();
  const { detections, cameras, isLoadingData, accessLevel, ownedDevicesCount } = useApp();
  const { user, userLocation } = useAuth();
  const { alerts, unresolvedCount } = useAlerts();

  // Check if user is a device owner
  const isDeviceOwner = accessLevel === 'device_owner' || ownedDevicesCount > 0;

  // Filter detections for public view (exclude human detections for privacy)
  const publicDetections = detections.filter(d => d.animalType !== 'human');
  
  // Filter detections with visible locations
  const detectionsWithLocation = publicDetections.filter(d => d.location && !d.locationHidden);

  const todayDetections = publicDetections.length;
  const uniqueSpecies = [...new Set(publicDetections.map(d => d.animalType))].length;
  const dangerAlerts = alerts.filter((a) => a.severity === 'danger' && !a.isResolved).length;
  const warningAlerts = alerts.filter((a) => a.severity === 'warning' && !a.isResolved).length;

  const recentDetections = publicDetections.slice(0, 5);
  const criticalAlertsList = alerts.filter((a) => a.severity === 'danger' && !a.isResolved).slice(0, 3);

  // Map configuration - prefer user location, then detection, then default
  const mapCenter = userLocation
    ? [userLocation.lat, userLocation.lng]
    : user?.home_lat && user?.home_lon
      ? [user.home_lat, user.home_lon]
      : detectionsWithLocation.length > 0
        ? [detectionsWithLocation[0].location.lat, detectionsWithLocation[0].location.lng]
        : [12.9716, 77.5946];
  const mapZoom = 12;

  return (
    <div className="space-y-6 pb-16 lg:pb-0">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-gray-900">
            Wildlife Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Stay informed about wildlife activity in your area
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isDeviceOwner && (
            <Badge variant="success" className="flex items-center gap-1">
              <Shield className="w-3 h-3" />
              Device Owner
            </Badge>
          )}
          <Button
            variant="outline"
            leftIcon={<Bell className="w-4 h-4" />}
            onClick={() => navigate('/public/alerts')}
          >
            {unresolvedCount > 0 ? `${unresolvedCount} Alerts` : 'Alerts'}
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Wildlife Sightings"
          value={todayDetections}
          icon={Activity}
        />
        <StatCard
          title="Species Detected"
          value={uniqueSpecies}
          icon={Trees}
        />
        <StatCard
          title="Danger Alerts"
          value={dangerAlerts}
          icon={AlertTriangle}
        />
        <StatCard
          title="Warning Alerts"
          value={warningAlerts}
          icon={AlertTriangle}
        />
      </div>

      {/* Device Owner Info */}
      {isDeviceOwner && (
        <Card className="bg-blue-50 border-blue-200">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Camera className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-800">📷 Device Owner Access</h3>
              <p className="text-sm text-blue-700 mt-1">
                You have {ownedDevicesCount} monitoring device{ownedDevicesCount > 1 ? 's' : ''}. You can see images and exact locations from your devices.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Live Animal Map */}
      <Card noPadding className="overflow-hidden">
        <div className="p-4 bg-forest-50 border-b border-forest-100 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-forest-600" />
            <h2 className="text-lg font-semibold text-gray-900">Wildlife Locations Near You</h2>
            {!isDeviceOwner && detectionsWithLocation.length === 0 && (
              <Badge variant="neutral" size="sm" className="ml-2">
                <Lock className="w-3 h-3 mr-1" />
                Limited View
              </Badge>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            <Badge variant="danger" size="sm">🔴 Danger</Badge>
            <Badge variant="warning" size="sm">🟡 Warning</Badge>
            <Badge variant="success" size="sm">🟢 Safe</Badge>
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

            {/* Animal Detection Markers - only show detections with visible locations */}
            {detectionsWithLocation.map((detection) => (
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
                        <p className="text-xs text-gray-500">{formatSmartDate(detection.timestamp)}</p>
                      </div>
                    </div>
                    <Badge
                      variant={detection.riskLevel === 'danger' ? 'danger' : 
                              detection.riskLevel === 'warning' ? 'warning' : 'success'}
                      size="sm"
                    >
                      {getRiskConfig(detection.riskLevel).label}
                    </Badge>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
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
              <h3 className="font-semibold text-danger-800">⚠️ Wildlife Safety Alerts</h3>
              <p className="text-sm text-danger-600 mt-1">Dangerous animals detected in your area. Please stay alert!</p>
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
                onClick={() => navigate('/public/alerts')}
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
              <h2 className="text-lg font-semibold text-gray-900">Recent Wildlife Sightings</h2>
            </div>

            {recentDetections.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-gray-500 border-b">
                      <th className="pb-3 font-medium">Animal</th>
                      <th className="pb-3 font-medium hidden sm:table-cell">Time</th>
                      <th className="pb-3 font-medium">Risk Level</th>
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
                          <td className="py-3 hidden sm:table-cell">
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
            ) : (
              <EmptyState
                icon={Eye}
                title="No recent sightings"
                description="Wildlife detections will appear here when animals are spotted in the monitored areas."
              />
            )}
          </Card>
        </div>

        {/* Safety Tips & Info */}
        <div className="space-y-6">
          {/* Safety Tips */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Wildlife Safety Tips</h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-danger-50 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-danger-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-danger-800 text-sm">Danger Alert</p>
                  <p className="text-xs text-danger-600 mt-0.5">Stay indoors and alert authorities if you spot a dangerous animal.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-warning-50 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-warning-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-warning-800 text-sm">Warning Alert</p>
                  <p className="text-xs text-warning-600 mt-0.5">Be cautious and avoid the area until cleared.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-safe-50 rounded-lg">
                <Eye className="w-5 h-5 text-safe-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-safe-800 text-sm">Safe Sighting</p>
                  <p className="text-xs text-safe-600 mt-0.5">Low-risk wildlife spotted. Observe from a safe distance.</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Restricted Features Notice */}
          <Card className="bg-gray-50 border-gray-200">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-gray-200 rounded-lg">
                <Lock className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Public Access</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Some features like camera management and detailed location data are restricted to authorized rangers.
                </p>
                {!isDeviceOwner && (
                  <p className="text-xs text-gray-500 mt-2">
                    Own a monitoring device? Contact support to get device owner access.
                  </p>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default UserDashboard;
