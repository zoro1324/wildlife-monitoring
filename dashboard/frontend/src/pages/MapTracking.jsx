import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle } from 'react-leaflet';
import L from 'leaflet';
import { Layers, Camera, Navigation, AlertTriangle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card, Badge, Button } from '../components/ui';
import { cn, getAnimalIcon, formatSmartDate } from '../utils/helpers';

// Default map zones
const defaultMapZones = [
  { id: 'zone-a', name: 'Zone A', bounds: [[12.9, 77.5], [13.0, 77.7]], color: '#166534' },
];

// Fix Leaflet default marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom camera icon
const createCameraIcon = (status) => {
  return L.divIcon({
    className: 'custom-camera-marker',
    html: `
      <div class="w-8 h-8 rounded-full ${status === 'online' ? 'bg-forest-600' : 'bg-danger-600'} 
                  flex items-center justify-center shadow-lg border-2 border-white"
           style="display: flex; align-items: center; justify-content: center;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
          <circle cx="12" cy="13" r="4"/>
        </svg>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

// Animal icon
const createAnimalIcon = (animalType) => {
  const icon = getAnimalIcon(animalType);
  return L.divIcon({
    className: 'custom-animal-marker',
    html: `<div class="text-2xl">${icon}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

function MapTracking() {
  const { cameras, detections } = useApp();
  const location = useLocation();
  const [mapRef, setMapRef] = useState(null);
  const [showLayers, setShowLayers] = useState({
    cameras: true,
    trails: false,
    zones: true,
    detections: true,
  });
  const [selectedTrail, setSelectedTrail] = useState(null);

  // Target location passed from other pages (e.g., detection or alert modal)
  const targetLocation = useMemo(() => location.state?.targetLocation, [location.state]);

  // Center map on target location if provided, otherwise first camera or default location
  const firstCameraWithLocation = cameras.find(c => c.location?.lat && c.location?.lng);
  const mapCenter = targetLocation
    ? [targetLocation.lat, targetLocation.lng]
    : firstCameraWithLocation 
      ? [firstCameraWithLocation.location.lat, firstCameraWithLocation.location.lng]
      : [12.9716, 77.5946];
  const mapZoom = targetLocation ? 14 : 12;

  // Fly to target location when provided
  useEffect(() => {
    if (mapRef && targetLocation?.lat && targetLocation?.lng) {
      mapRef.flyTo([targetLocation.lat, targetLocation.lng], 14, { duration: 0.75 });
    }
  }, [mapRef, targetLocation]);

  const trailColors = {
    elephant: '#92400E',
    tiger: '#DC2626',
    leopard: '#F59E0B',
    deer: '#22C55E',
  };

  return (
    <div className="space-y-4 pb-16 lg:pb-0">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-gray-900">
            Map Tracking
          </h1>
          <p className="text-gray-600 mt-1">
            Monitor animal movements and camera locations
          </p>
        </div>
      </div>

      {/* Map Container */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Map */}
        <div className="lg:col-span-3">
          <Card noPadding className="overflow-hidden h-[500px] lg:h-[600px]">
            <MapContainer
              center={mapCenter}
              zoom={mapZoom}
              className="h-full w-full"
              scrollWheelZoom={true}
              whenCreated={setMapRef}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* Risk Zones */}
              {showLayers.zones && defaultMapZones.map((zone) => (
                <Circle
                  key={zone.id}
                  center={[(zone.bounds[0][0] + zone.bounds[1][0]) / 2, (zone.bounds[0][1] + zone.bounds[1][1]) / 2]}
                  radius={1500}
                  pathOptions={{
                    color: zone.color,
                    fillColor: zone.color,
                    fillOpacity: 0.15,
                  }}
                />
              ))}

              {/* Camera Markers - only show cameras with visible locations */}
              {showLayers.cameras && cameras.filter(c => c.location && !c.locationHidden).map((camera) => (
                <Marker
                  key={camera.id}
                  position={[camera.location.lat, camera.location.lng]}
                  icon={createCameraIcon(camera.status)}
                >
                  <Popup>
                    <div className="p-2 min-w-[180px]">
                      <h3 className="font-semibold text-gray-900">{camera.id}</h3>
                      <p className="text-sm text-gray-500">{camera.name}</p>
                      <div className="mt-2 flex items-center space-x-2">
                        <Badge variant={camera.status === 'online' ? 'success' : 'danger'} size="sm">
                          {camera.status}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          Battery: {camera.battery}%
                        </span>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}

              {/* Highlight target location if present */}
              {targetLocation && (
                <>
                  <Marker position={[targetLocation.lat, targetLocation.lng]} icon={createAnimalIcon('animal')}>
                    <Popup>
                      <div className="p-2">
                        <h3 className="font-semibold text-gray-900">{targetLocation.label || 'Selected Location'}</h3>
                        <p className="text-sm text-gray-500">{targetLocation.lat.toFixed(6)}, {targetLocation.lng.toFixed(6)}</p>
                      </div>
                    </Popup>
                  </Marker>
                  <Circle
                    center={[targetLocation.lat, targetLocation.lng]}
                    radius={120}
                    pathOptions={{ color: '#22c55e', fillColor: '#22c55e', fillOpacity: 0.12 }}
                  />
                </>
              )}

              {/* Recent Detections - only show detections with visible locations */}
              {showLayers.detections && detections.filter(d => d.location && !d.locationHidden).slice(0, 10).map((detection) => (
                <Marker
                  key={detection.id}
                  position={[detection.location.lat, detection.location.lng]}
                  icon={createAnimalIcon(detection.animalType)}
                >
                  <Popup>
                    <div className="p-2 min-w-[180px]">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">{getAnimalIcon(detection.animalType)}</span>
                        <div>
                          <h3 className="font-semibold text-gray-900">{detection.animalName}</h3>
                          <p className="text-xs text-gray-500">{formatSmartDate(detection.timestamp)}</p>
                        </div>
                      </div>
                      <Badge
                        variant={detection.riskLevel === 'danger' ? 'danger' : 
                                detection.riskLevel === 'warning' ? 'warning' : 'success'}
                        size="sm"
                        className="mt-2"
                      >
                        {detection.riskLevel}
                      </Badge>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </Card>
        </div>

        {/* Sidebar Controls */}
        <div className="space-y-4">
          {/* Layer Controls */}
          <Card>
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <Layers className="w-4 h-4 mr-2" />
              Map Layers
            </h3>
            <div className="space-y-2">
              {Object.entries(showLayers).map(([key, value]) => (
                <label key={key} className="flex items-center justify-between cursor-pointer p-2 hover:bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-700 capitalize">{key}</span>
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={() => setShowLayers({ ...showLayers, [key]: !value })}
                    className="w-4 h-4 rounded border-gray-300 text-forest-600 focus:ring-forest-500"
                  />
                </label>
              ))}
            </div>
          </Card>

          {/* Legend */}
          <Card>
            <h3 className="font-semibold text-gray-900 mb-3">Legend</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-forest-600" />
                <span className="text-gray-600">Online Camera</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-danger-600" />
                <span className="text-gray-600">Offline Camera</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-0.5 bg-earth-600" style={{ borderStyle: 'dashed' }} />
                <span className="text-gray-600">Movement Trail</span>
              </div>
            </div>
          </Card>

          {/* Active Trails */}
          <Card>
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <Navigation className="w-4 h-4 mr-2" />
              Recent Detections
            </h3>
            <div className="space-y-2">
              {detections.length > 0 ? (
                detections.slice(0, 5).map((detection) => (
                  <div
                    key={detection.id}
                    className="p-2 bg-gray-50 rounded-lg flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{getAnimalIcon(detection.animalType)}</span>
                      <span className="text-sm font-medium text-gray-900 capitalize">
                        {detection.animalName}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {detection.cameraId}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-2">No recent detections</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default MapTracking;
