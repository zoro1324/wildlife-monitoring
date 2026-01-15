import { useState } from 'react';
import { Grid, Maximize2, Minimize2, Camera, Battery, Wifi, AlertTriangle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Card, Badge, Button, EmptyState } from '../components/ui';
import { cn, formatSmartDate, getAnimalIcon } from '../utils/helpers';

function LiveMonitoring() {
  const { cameras, detections } = useApp();
  const { isRanger } = useAuth();
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'single'
  const [selectedCamera, setSelectedCamera] = useState(null);

  const onlineCameras = cameras.filter((c) => c.status === 'online');

  // Get recent detection for a camera
  const getCameraDetection = (cameraId) => {
    return detections.find((d) => d.cameraId === cameraId);
  };

  // Show empty state for public users with no cameras
  if (!isRanger && cameras.length === 0) {
    return (
      <div className="space-y-6 pb-16 lg:pb-0">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-gray-900">
              Live Monitoring
            </h1>
            <p className="text-gray-600 mt-1">Monitor your cameras in real-time</p>
          </div>
        </div>
        <EmptyState
          icon={Camera}
          title="No Cameras Added"
          description="Add a camera to your account to start monitoring. Go to My Devices to add your camera."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16 lg:pb-0">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-gray-900">
            Live Monitoring
          </h1>
          <p className="text-gray-600 mt-1">
            {isRanger 
              ? `${onlineCameras.length} of ${cameras.length} cameras online`
              : `Monitoring ${cameras.length} camera${cameras.length !== 1 ? 's' : ''}`
            }
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === 'grid' ? 'primary' : 'ghost'}
            size="sm"
            leftIcon={<Grid className="w-4 h-4" />}
            onClick={() => setViewMode('grid')}
          >
            Grid
          </Button>
          <Button
            variant={viewMode === 'single' ? 'primary' : 'ghost'}
            size="sm"
            leftIcon={<Maximize2 className="w-4 h-4" />}
            onClick={() => setViewMode('single')}
          >
            Single
          </Button>
        </div>
      </div>

      {/* Camera Grid/Single View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cameras.map((camera) => (
            <CameraFeedCard
              key={camera.id}
              camera={camera}
              detection={getCameraDetection(camera.id)}
              onClick={() => {
                setSelectedCamera(camera);
                setViewMode('single');
              }}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Single Camera View */}
          <Card noPadding className="overflow-hidden">
            <div className="relative aspect-video bg-gray-900">
              {selectedCamera ? (
                <>
                  {/* Simulated feed */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Camera className="w-20 h-20 text-gray-600" />
                  </div>
                  
                  {/* Camera info overlay */}
                  <div className="absolute top-4 left-4 flex items-center space-x-2">
                    <span className="bg-black/60 text-white px-3 py-1 rounded-full text-sm flex items-center">
                      <span className="w-2 h-2 rounded-full bg-danger-500 animate-pulse mr-2" />
                      LIVE
                    </span>
                    <span className="bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                      {selectedCamera.id} - {selectedCamera.name}
                    </span>
                  </div>
                  
                  {/* Detection overlay */}
                  {getCameraDetection(selectedCamera.id) && (
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="bg-black/80 text-white p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <span className="text-3xl">
                              {getAnimalIcon(getCameraDetection(selectedCamera.id).animalType)}
                            </span>
                            <div>
                              <p className="font-semibold">
                                {getCameraDetection(selectedCamera.id).animalName} Detected
                              </p>
                              <p className="text-sm text-gray-300">
                                Confidence: {Math.round(getCameraDetection(selectedCamera.id).confidence * 100)}%
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant={getCameraDetection(selectedCamera.id).riskLevel === 'danger' ? 'danger' : 'warning'}
                          >
                            {getCameraDetection(selectedCamera.id).riskLevel.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Close button */}
                  <button
                    onClick={() => {
                      setSelectedCamera(null);
                      setViewMode('grid');
                    }}
                    className="absolute top-4 right-4 p-2 bg-black/60 rounded-lg text-white hover:bg-black/80"
                  >
                    <Minimize2 className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                  <p>Select a camera to view</p>
                </div>
              )}
            </div>
          </Card>

          {/* Camera selector */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {cameras.map((camera) => (
              <button
                key={camera.id}
                onClick={() => setSelectedCamera(camera)}
                className={cn(
                  'p-3 rounded-lg border text-left transition-colors',
                  selectedCamera?.id === camera.id
                    ? 'border-forest-600 bg-forest-50'
                    : 'border-gray-200 hover:border-forest-400'
                )}
              >
                <p className="font-medium text-sm text-gray-900">{camera.id}</p>
                <p className="text-xs text-gray-500 truncate">{camera.name}</p>
                <div className={cn(
                  'w-2 h-2 rounded-full mt-2',
                  camera.status === 'online' ? 'bg-safe-500' : 'bg-danger-500'
                )} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CameraFeedCard({ camera, detection, onClick }) {
  const isOnline = camera.status === 'online';

  return (
    <Card
      noPadding
      hoverable
      className="overflow-hidden cursor-pointer"
      onClick={onClick}
    >
      {/* Feed Preview */}
      <div className="relative aspect-video bg-gray-900">
        {isOnline ? (
          <>
            <div className="absolute inset-0 flex items-center justify-center">
              <Camera className="w-12 h-12 text-gray-600" />
            </div>
            
            {/* Live indicator */}
            <div className="absolute top-2 left-2">
              <span className="bg-black/60 text-white px-2 py-1 rounded text-xs flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-danger-500 animate-pulse mr-1.5" />
                LIVE
              </span>
            </div>

            {/* Detection overlay */}
            {detection && (
              <div className="absolute bottom-2 left-2 right-2">
                <div className="bg-black/80 text-white px-3 py-2 rounded flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getAnimalIcon(detection.animalType)}</span>
                    <span className="text-sm font-medium">{detection.animalName}</span>
                  </div>
                  <Badge
                    variant={detection.riskLevel === 'danger' ? 'danger' : 'warning'}
                    size="sm"
                  >
                    {Math.round(detection.confidence * 100)}%
                  </Badge>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800">
            <AlertTriangle className="w-8 h-8 text-danger-500 mb-2" />
            <span className="text-danger-400 text-sm">Camera Offline</span>
          </div>
        )}
      </div>

      {/* Camera Info */}
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="font-semibold text-gray-900">{camera.id}</p>
            <p className="text-xs text-gray-500">{camera.name}</p>
          </div>
          <Badge variant={isOnline ? 'success' : 'danger'} size="sm">
            {camera.status}
          </Badge>
        </div>

        <div className="flex items-center space-x-4 text-xs text-gray-500">
          <div className="flex items-center">
            <Battery className={cn('w-3 h-3 mr-1', camera.battery < 30 ? 'text-danger-500' : 'text-gray-400')} />
            {camera.battery}%
          </div>
          <div className="flex items-center">
            <Wifi className={cn('w-3 h-3 mr-1', camera.signalStrength < 30 ? 'text-danger-500' : 'text-gray-400')} />
            {camera.signalStrength}%
          </div>
        </div>
      </div>
    </Card>
  );
}

export default LiveMonitoring;
