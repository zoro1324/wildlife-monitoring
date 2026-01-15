import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Navigation, Save, Loader2, Home, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Card, Badge, Button } from '../components/ui';
import { authAPI } from '../services/api';

// Fix Leaflet default marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Create a custom home icon
const homeIcon = L.divIcon({
  className: 'custom-home-marker',
  html: `
    <div style="
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: #059669;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      font-size: 18px;
    ">🏠</div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

// Component to handle map clicks
function LocationMarker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition({
        lat: e.latlng.lat,
        lng: e.latlng.lng,
      });
    },
  });

  return position ? (
    <Marker position={[position.lat, position.lng]} icon={homeIcon} />
  ) : null;
}

function HomeLocation() {
  const { user, userLocation, fetchUserLocation, updateProfile } = useAuth();
  const [homePosition, setHomePosition] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Initialize with existing home location
  useEffect(() => {
    if (user?.home_lat && user?.home_lon) {
      setHomePosition({
        lat: user.home_lat,
        lng: user.home_lon,
      });
    }
  }, [user]);

  // Map center - prefer existing home location, then current GPS, then default
  const mapCenter = homePosition
    ? [homePosition.lat, homePosition.lng]
    : userLocation
      ? [userLocation.lat, userLocation.lng]
      : [12.9716, 77.5946];

  const handleUseCurrentLocation = async () => {
    setIsLocating(true);
    setMessage({ type: '', text: '' });
    
    try {
      const location = await fetchUserLocation();
      if (location) {
        setHomePosition({
          lat: location.lat,
          lng: location.lng,
        });
        setMessage({ type: 'success', text: 'Current location detected! Click Save to confirm.' });
      } else {
        setMessage({ type: 'error', text: 'Could not get your current location. Please enable location access.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to get current location.' });
    }
    
    setIsLocating(false);
  };

  const handleSave = async () => {
    if (!homePosition) {
      setMessage({ type: 'error', text: 'Please select a location on the map first.' });
      return;
    }

    setIsSaving(true);
    setMessage({ type: '', text: '' });

    try {
      await authAPI.updateProfile({
        home_lat: homePosition.lat,
        home_lon: homePosition.lng,
      });
      
      // Update local user state
      updateProfile({
        home_lat: homePosition.lat,
        home_lon: homePosition.lng,
      });

      setMessage({ type: 'success', text: 'Home location saved successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to save home location.' });
    }

    setIsSaving(false);
  };

  return (
    <div className="space-y-6 pb-16 lg:pb-0">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-gray-900">
            Home Location
          </h1>
          <p className="text-gray-600 mt-1">
            Set your home location to receive relevant wildlife alerts
          </p>
        </div>
        {user?.home_lat && user?.home_lon && (
          <Badge variant="success" className="flex items-center gap-1">
            <Home className="w-3 h-3" />
            Location Set
          </Badge>
        )}
      </div>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <MapPin className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-blue-800">Why set your home location?</h3>
            <ul className="text-sm text-blue-700 mt-1 space-y-1">
              <li>• Receive alerts about wildlife spotted near your home</li>
              <li>• Get phone calls when dangerous animals are detected in your area</li>
              <li>• See wildlife activity on the map centered around your location</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Message */}
      {message.text && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-safe-50 border border-safe-200 text-safe-700' 
            : 'bg-danger-50 border border-danger-200 text-danger-700'
        }`}>
          {message.text}
        </div>
      )}

      {/* Map Section */}
      <Card noPadding className="overflow-hidden">
        <div className="p-4 bg-forest-50 border-b border-forest-100">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Home className="w-5 h-5 text-forest-600" />
              <h2 className="text-lg font-semibold text-gray-900">Select Your Home Location</h2>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                leftIcon={isLocating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
                onClick={handleUseCurrentLocation}
                disabled={isLocating}
              >
                Use Current Location
              </Button>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Click on the map to set your home location, or use the button above to use your current GPS location.
          </p>
        </div>

        <div className="h-[400px]">
          <MapContainer
            center={mapCenter}
            zoom={13}
            className="h-full w-full"
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationMarker position={homePosition} setPosition={setHomePosition} />
          </MapContainer>
        </div>

        {/* Location Display & Save */}
        <div className="p-4 bg-gray-50 border-t border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              {homePosition ? (
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-forest-600" />
                  <div>
                    <p className="font-medium text-gray-900">Selected Location</p>
                    <p className="text-sm text-gray-500">
                      {homePosition.lat.toFixed(6)}, {homePosition.lng.toFixed(6)}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">Click on the map to select your home location</p>
              )}
            </div>
            <Button
              variant="primary"
              leftIcon={isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              onClick={handleSave}
              disabled={!homePosition || isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Location'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Current Saved Location */}
      {user?.home_lat && user?.home_lon && (
        <Card>
          <h3 className="font-semibold text-gray-900 mb-3">Currently Saved Location</h3>
          <div className="flex items-center gap-3 p-3 bg-safe-50 rounded-lg">
            <div className="p-2 bg-safe-100 rounded-lg">
              <Home className="w-5 h-5 text-safe-600" />
            </div>
            <div>
              <p className="font-medium text-safe-800">Home</p>
              <p className="text-sm text-safe-600">
                Lat: {user.home_lat.toFixed(6)}, Lon: {user.home_lon.toFixed(6)}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

export default HomeLocation;
