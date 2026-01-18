import { useState } from 'react';
import { Camera, Battery, Wifi, Sun, MapPin, RefreshCw, AlertTriangle, Check, Clock, Settings } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card, Badge, Button, Select, EmptyState } from '../components/ui';
import { BatteryIndicator, SignalIndicator } from '../components/ui/StatusIndicators';
import { cn, formatSmartDate } from '../utils/helpers';

function CameraHealth() {
  const { cameras, refreshData, isLoadingData } = useApp();
  const [viewFilter, setViewFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');

  const filterOptions = [
    { value: 'all', label: 'All Cameras' },
    { value: 'online', label: 'Online' },
    { value: 'offline', label: 'Offline' },
    { value: 'maintenance', label: 'Maintenance' },
  ];

  const sortOptions = [
    { value: 'name', label: 'Sort by Name' },
    { value: 'battery', label: 'Sort by Battery' },
    { value: 'signal', label: 'Sort by Signal' },
    { value: 'status', label: 'Sort by Status' },
  ];

  const filteredCameras = cameras
    .filter((c) => viewFilter === 'all' || c.status === viewFilter)
    .sort((a, b) => {
      switch (sortBy) {
        case 'battery': return a.battery - b.battery;
        case 'signal': return a.signalStrength - b.signalStrength;
        case 'status': return a.status.localeCompare(b.status);
        default: return a.name.localeCompare(b.name);
      }
    });

  const statsData = {
    total: cameras.length,
    online: cameras.filter((c) => c.status === 'online').length,
    offline: cameras.filter((c) => c.status === 'offline').length,
    lowBattery: cameras.filter((c) => c.battery < 30).length,
    weakSignal: cameras.filter((c) => c.signalStrength < 30).length,
  };

  return (
    <div className="space-y-6 pb-16 lg:pb-0">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-gray-900">Camera Health</h1>
          <p className="text-gray-600 mt-1">Monitor and manage camera network status</p>
        </div>
        <Button variant="primary" onClick={refreshData} isLoading={isLoadingData} leftIcon={<RefreshCw className="w-4 h-4" />}>
          Refresh Status
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="text-center">
          <Camera className="w-6 h-6 mx-auto text-gray-400 mb-2" />
          <p className="text-2xl font-bold text-gray-900">{statsData.total}</p>
          <p className="text-xs text-gray-500">Total Cameras</p>
        </Card>
        <Card className="text-center">
          <div className="w-3 h-3 rounded-full bg-safe-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-safe-600">{statsData.online}</p>
          <p className="text-xs text-gray-500">Online</p>
        </Card>
        <Card className="text-center">
          <div className="w-3 h-3 rounded-full bg-danger-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-danger-600">{statsData.offline}</p>
          <p className="text-xs text-gray-500">Offline</p>
        </Card>
        <Card className="text-center">
          <Battery className="w-6 h-6 mx-auto text-warning-500 mb-2" />
          <p className="text-2xl font-bold text-warning-600">{statsData.lowBattery}</p>
          <p className="text-xs text-gray-500">Low Battery</p>
        </Card>
        <Card className="text-center">
          <Wifi className="w-6 h-6 mx-auto text-warning-500 mb-2" />
          <p className="text-2xl font-bold text-warning-600">{statsData.weakSignal}</p>
          <p className="text-xs text-gray-500">Weak Signal</p>
        </Card>
      </div>

      {/* Filters */}
      <Card noPadding className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 max-w-xs">
            <Select value={viewFilter} onChange={(e) => setViewFilter(e.target.value)} options={filterOptions} />
          </div>
          <div className="flex-1 max-w-xs">
            <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)} options={sortOptions} />
          </div>
          <div className="flex items-center text-sm text-gray-500 ml-auto">
            Showing {filteredCameras.length} of {cameras.length} cameras
          </div>
        </div>
      </Card>

      {/* Camera Grid */}
      {filteredCameras.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCameras.map((camera) => (
            <CameraCard key={camera.id} camera={camera} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Camera}
          title="No cameras found"
          description="There are no cameras matching your current filter."
          action={<Button variant="primary" onClick={() => setViewFilter('all')}>View All Cameras</Button>}
        />
      )}
    </div>
  );
}

function CameraCard({ camera }) {
  const isOnline = camera.status === 'online';
  const hasBatteryIssue = camera.battery < 30;
  const hasSignalIssue = camera.signalStrength < 30;
  const hasIssue = !isOnline || hasBatteryIssue || hasSignalIssue;
  const lastActive = camera.lastActive || camera.lastSeen;

  return (
    <Card hoverable className={cn(
      'transition-all duration-200',
      !isOnline && 'border-danger-200 bg-danger-50/30',
      hasIssue && isOnline && 'border-warning-200 bg-warning-50/30'
    )}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center',
            isOnline ? 'bg-forest-100' : 'bg-danger-100'
          )}>
            <Camera className={cn('w-5 h-5', isOnline ? 'text-forest-600' : 'text-danger-600')} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{camera.id}</h3>
            <p className="text-sm text-gray-500">{camera.name}</p>
          </div>
        </div>
        <Badge variant={isOnline ? 'success' : 'danger'} size="sm">
          {camera.status}
        </Badge>
      </div>

      {/* Status Indicators */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-gray-500 mb-1 flex items-center">
            <Battery className="w-3 h-3 mr-1" />
            Battery
          </p>
          <BatteryIndicator level={camera.battery} />
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1 flex items-center">
            <Wifi className="w-3 h-3 mr-1" />
            Signal
          </p>
          <SignalIndicator strength={camera.signalStrength} />
        </div>
      </div>

      {/* Additional Info */}
      <div className="space-y-2 pt-3 border-t border-gray-100">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 flex items-center">
            <Sun className="w-4 h-4 mr-2" />
            Solar Power
          </span>
          <Badge variant={camera.solarStatus === 'charging' ? 'success' : 'neutral'} size="sm">
            {camera.solarStatus || 'N/A'}
          </Badge>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 flex items-center">
            <MapPin className="w-4 h-4 mr-2" />
            Zone
          </span>
          <span className="text-gray-900">{camera.zone}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 flex items-center">
            <Clock className="w-4 h-4 mr-2" />
            Last Active
          </span>
          <span className="text-gray-900">
            {lastActive ? formatSmartDate(lastActive) : 'Unknown'}
          </span>
        </div>
      </div>

      {/* Issues Warning */}
      {hasIssue && (
        <div className={cn(
          'mt-4 p-3 rounded-lg flex items-start space-x-2',
          !isOnline ? 'bg-danger-100' : 'bg-warning-100'
        )}>
          <AlertTriangle className={cn('w-4 h-4 mt-0.5', !isOnline ? 'text-danger-600' : 'text-warning-600')} />
          <div className="text-sm">
            {!isOnline && <p className="text-danger-700 font-medium">Camera is offline</p>}
            {hasBatteryIssue && isOnline && <p className="text-warning-700">Low battery - needs attention</p>}
            {hasSignalIssue && isOnline && <p className="text-warning-700">Weak signal detected</p>}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
        <Button variant="ghost" size="sm" leftIcon={<Settings className="w-4 h-4" />}>
          Configure
        </Button>
        <Button variant="ghost" size="sm" leftIcon={<RefreshCw className="w-4 h-4" />}>
          Reboot
        </Button>
      </div>
    </Card>
  );
}

export default CameraHealth;
