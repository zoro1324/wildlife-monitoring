import { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import { 
  Eye, 
  MapPin, 
  Bell,
  AlertTriangle,
  Clock,
  LogOut,
  User,
  Settings,
  ChevronRight,
  Trees,
  Shield,
  Camera,
  Lock
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Card, Badge, Button } from '../components/ui';
import { formatSmartDate, getAnimalIcon, getRiskConfig, cn } from '../utils/helpers';

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
        width: 40px; 
        height: 40px; 
        border-radius: 50%; 
        background: ${bgColor}; 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        font-size: 20px;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      ">
        ${icon}
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

function UserDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { detections, cameras, accessLevel, ownedDevicesCount, isLoadingData, refreshData } = useApp();
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Filter detections for public view (exclude human detections for privacy)
  const publicDetections = detections.filter(d => d.animalType !== 'human');

  // Check if user is a device owner
  const isDeviceOwner = accessLevel === 'device_owner' || ownedDevicesCount > 0;

  // Stats
  const totalSightings = publicDetections.length;
  const uniqueSpecies = [...new Set(publicDetections.map(d => d.animalType))].length;
  const dangerousAnimals = publicDetections.filter(d => d.riskLevel === 'danger').length;

  // Get recent alerts for the user
  const recentAlerts = publicDetections
    .filter(d => d.riskLevel === 'danger' || d.riskLevel === 'warning')
    .slice(0, 5);

  // Filter detections that have visible location for mapping
  const detectionsWithLocation = publicDetections.filter(d => d.location && !d.locationHidden);

  // Map configuration
  const mapCenter = useMemo(() => {
    if (user?.home_lat && user?.home_lon) {
      return [user.home_lat, user.home_lon];
    }
    // Use first detection with location
    if (detectionsWithLocation.length > 0 && detectionsWithLocation[0].location) {
      return [detectionsWithLocation[0].location.lat, detectionsWithLocation[0].location.lng];
    }
    // Default center
    return [29.52, 79.06];
  }, [user, detectionsWithLocation]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-earth-700 text-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Trees className="w-8 h-8 text-earth-300" />
              <div>
                <h1 className="text-xl font-display font-bold">Wildlife Watch</h1>
                <p className="text-earth-300 text-xs">Stay Safe, Stay Informed</p>
              </div>
            </div>
            
            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-3 py-2 bg-earth-600 hover:bg-earth-500 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-earth-400 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <span className="hidden sm:inline font-medium">{user?.name || 'User'}</span>
              </button>
              
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="font-medium text-gray-900">{user?.name}</p>
                    <p className="text-sm text-gray-500">{user?.email}</p>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="neutral" size="sm">
                        {isDeviceOwner ? 'Device Owner' : 'Public User'}
                      </Badge>
                      {ownedDevicesCount > 0 && (
                        <Badge variant="primary" size="sm">
                          {ownedDevicesCount} device{ownedDevicesCount > 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Welcome Banner */}
        <Card className="bg-gradient-to-r from-earth-600 to-earth-700 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Welcome, {user?.name?.split(' ')[0] || 'User'}!</h2>
              <p className="text-earth-200 mt-1">
                {isDeviceOwner 
                  ? `You have ${ownedDevicesCount} monitoring device${ownedDevicesCount > 1 ? 's' : ''}`
                  : 'Stay updated on wildlife activity in your area'}
              </p>
            </div>
            <div className="hidden sm:block">
              {isDeviceOwner 
                ? <Camera className="w-20 h-20 text-earth-400 opacity-50" />
                : <Trees className="w-20 h-20 text-earth-400 opacity-50" />
              }
            </div>
          </div>
        </Card>

        {/* Device Owner Info Card */}
        {isDeviceOwner && (
          <Card className="bg-blue-50 border-blue-200">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Camera className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-blue-800">📷 Your Device Activity</h3>
                <p className="text-sm text-blue-700 mt-1">
                  You can see images and exact locations from your devices. 
                  You'll receive phone calls when wildlife is detected on your cameras.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* My Devices Section - for device owners */}
        {isDeviceOwner && cameras.length > 0 && (
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Camera className="w-5 h-5 text-earth-600" />
                My Devices
              </h3>
              <Badge variant="primary">{cameras.length} device{cameras.length > 1 ? 's' : ''}</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cameras.map((camera) => (
                <div
                  key={camera.id}
                  className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{camera.id}</h4>
                    <Badge 
                      variant={camera.status === 'online' ? 'success' : 'danger'} 
                      size="sm"
                    >
                      {camera.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500 mb-2">{camera.name}</p>
                  {camera.location && !camera.locationHidden && (
                    <p className="text-xs text-gray-400">
                      📍 {camera.location.lat?.toFixed(4)}, {camera.location.lng?.toFixed(4)}
                    </p>
                  )}
                  <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between text-sm">
                    <span className="text-gray-500">
                      {detections.filter(d => d.cameraId === camera.id).length} detections
                    </span>
                    <span className="text-gray-400 text-xs">
                      Last seen: {formatSmartDate(camera.lastSeen)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Safety Alerts */}
        {recentAlerts.length > 0 && (
          <Card className="bg-amber-50 border-amber-200">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-amber-800">⚠️ Wildlife Safety Advisory</h3>
                <p className="text-sm text-amber-700 mt-1">
                  These animals have been spotted recently. Please maintain safe distance.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {recentAlerts.slice(0, 3).map((alert) => (
                    <div
                      key={alert.id}
                      className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-amber-200"
                    >
                      <span className="text-lg">{getAnimalIcon(alert.animalType)}</span>
                      <span className="text-sm font-medium text-amber-800">{alert.animalName}</span>
                      <Badge 
                        variant={alert.riskLevel === 'danger' ? 'danger' : 'warning'} 
                        size="sm"
                      >
                        {alert.riskLevel}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="text-center">
            <Eye className="w-8 h-8 text-earth-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{totalSightings}</p>
            <p className="text-sm text-gray-500">Sightings</p>
          </Card>
          <Card className="text-center">
            <span className="text-3xl block mb-2">🦁</span>
            <p className="text-2xl font-bold text-gray-900">{uniqueSpecies}</p>
            <p className="text-sm text-gray-500">Species</p>
          </Card>
          <Card className="text-center">
            <AlertTriangle className="w-8 h-8 text-danger-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{dangerousAnimals}</p>
            <p className="text-sm text-gray-500">Alerts</p>
          </Card>
        </div>

        {/* Map Section */}
        <Card noPadding className="overflow-hidden">
          <div className="p-4 bg-earth-50 border-b border-earth-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-earth-600" />
                <h2 className="text-lg font-semibold text-gray-900">Wildlife Map</h2>
                {!isDeviceOwner && (
                  <Badge variant="neutral" size="sm" className="ml-2">
                    <Lock className="w-3 h-3 mr-1" />
                    Limited View
                  </Badge>
                )}
              </div>
              <div className="flex gap-2 text-xs">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500"></span> Danger</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-amber-500"></span> Warning</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500"></span> Safe</span>
              </div>
            </div>
          </div>
          
          {detectionsWithLocation.length > 0 || (user?.home_lat && user?.home_lon) ? (
            <div className="h-[350px] lg:h-[400px]">
              <MapContainer
                center={mapCenter}
                zoom={12}
                className="h-full w-full"
                scrollWheelZoom={true}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* User's home location */}
                {user?.home_lat && user?.home_lon && (
                  <Marker position={[user.home_lat, user.home_lon]}>
                    <Popup>
                      <div className="text-center">
                        <p className="font-semibold">📍 Your Location</p>
                      </div>
                    </Popup>
                  </Marker>
                )}

                {/* Animal Markers - only show detections with visible locations */}
                {detectionsWithLocation.slice(0, 20).map((detection) => (
                  <Marker
                    key={detection.id}
                    position={[detection.location.lat, detection.location.lng]}
                    icon={createAnimalIcon(detection.animalType, detection.riskLevel)}
                  >
                    <Popup>
                      <div className="p-1 min-w-[150px]">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">{getAnimalIcon(detection.animalType)}</span>
                          <div>
                            <p className="font-semibold">{detection.animalName}</p>
                            <p className="text-xs text-gray-500">{formatSmartDate(detection.timestamp)}</p>
                          </div>
                        </div>
                        <Badge
                          variant={detection.riskLevel === 'danger' ? 'danger' : detection.riskLevel === 'warning' ? 'warning' : 'success'}
                          size="sm"
                        >
                          {detection.riskLevel === 'danger' ? '⚠️ Keep Distance' : detection.riskLevel === 'warning' ? 'Caution' : 'Safe'}
                        </Badge>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          ) : (
            <div className="h-[350px] lg:h-[400px] flex items-center justify-center bg-gray-100">
              <div className="text-center text-gray-500">
                <Lock className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="font-medium">Location Data Hidden</p>
                <p className="text-sm mt-1">
                  Exact wildlife locations are only available to device owners and rangers
                </p>
              </div>
            </div>
          )}
        </Card>

        {/* Recent Sightings */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Sightings</h3>
            <div className="flex items-center gap-2">
              <Badge variant="neutral">{publicDetections.length} total</Badge>
              {!isDeviceOwner && publicDetections.some(d => d.locationHidden) && (
                <Badge variant="warning" size="sm">
                  <Lock className="w-3 h-3 mr-1" />
                  Annotated Images
                </Badge>
              )}
            </div>
          </div>
          
          {publicDetections.length > 0 ? (
            <div className="space-y-3">
              {publicDetections.slice(0, 6).map((detection) => (
                <div
                  key={detection.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {/* Show thumbnail if image available */}
                    {detection.imageUrl ? (
                      <div className="relative">
                        <img 
                          src={detection.imageUrl} 
                          alt={detection.animalName}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                        {detection.locationHidden && (
                          <div className="absolute -top-1 -right-1 bg-amber-500 rounded-full p-0.5">
                            <Lock className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-2xl">{getAnimalIcon(detection.animalType)}</span>
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{detection.animalName}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatSmartDate(detection.timestamp)}
                        {detection.locationHidden && (
                          <span className="text-amber-600 ml-2">(Location hidden)</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={detection.riskLevel === 'danger' ? 'danger' : detection.riskLevel === 'warning' ? 'warning' : 'success'}
                    size="sm"
                  >
                    {detection.riskLevel}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Eye className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No wildlife sightings yet</p>
              <p className="text-sm">Check back later for updates</p>
            </div>
          )}
        </Card>

        {/* Safety Tips */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🛡️ Safety Tips</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-red-50 rounded-lg border border-red-100">
              <p className="font-medium text-red-800">If you encounter a wild animal:</p>
              <ul className="text-sm text-red-700 mt-2 space-y-1">
                <li>• Stay calm and don't run</li>
                <li>• Back away slowly</li>
                <li>• Don't make direct eye contact</li>
                <li>• Make yourself appear larger</li>
              </ul>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-100">
              <p className="font-medium text-green-800">General precautions:</p>
              <ul className="text-sm text-green-700 mt-2 space-y-1">
                <li>• Keep food stored securely</li>
                <li>• Make noise while walking</li>
                <li>• Travel in groups when possible</li>
                <li>• Keep emergency contacts handy</li>
              </ul>
            </div>
          </div>
        </Card>
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 border-t border-gray-200 py-6 mt-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>🌲 Wildlife Watch - Protecting Wildlife, Keeping Communities Safe</p>
          <p className="mt-1">For emergencies, contact the Forest Department immediately.</p>
        </div>
      </footer>
    </div>
  );
}

export default UserDashboard;
