import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Download, Camera, Clock, MapPin, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card, Badge, Button, Input, Select, EmptyState, Modal } from '../components/ui';
import { animalTypes } from '../data/mockData';
import { formatSmartDate, formatConfidence, getAnimalIcon, getRiskConfig, cn } from '../utils/helpers';

function DetectionHistory() {
  const navigate = useNavigate();
  const { cameras, detections } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDetection, setSelectedDetection] = useState(null);
  const [filters, setFilters] = useState({
    animalType: 'all',
    cameraId: 'all',
    riskLevel: 'all',
    dateRange: 'all',
  });

  const animalOptions = [
    { value: 'all', label: 'All Animals' },
    ...animalTypes.map((a) => ({ value: a.id, label: a.name })),
  ];

  const cameraOptions = [
    { value: 'all', label: 'All Cameras' },
    ...cameras.map((c) => ({ value: c.id, label: `${c.id} - ${c.name}` })),
  ];

  const riskOptions = [
    { value: 'all', label: 'All Risk Levels' },
    { value: 'safe', label: 'Safe' },
    { value: 'warning', label: 'Warning' },
    { value: 'danger', label: 'Danger' },
  ];

  const dateOptions = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
  ];

  const filteredDetections = useMemo(() => {
    let result = [...detections];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (d) =>
          d.animalName.toLowerCase().includes(query) ||
          d.cameraId.toLowerCase().includes(query)
      );
    }

    if (filters.animalType !== 'all') {
      result = result.filter((d) => d.animalType === filters.animalType);
    }

    if (filters.cameraId !== 'all') {
      result = result.filter((d) => d.cameraId === filters.cameraId);
    }

    if (filters.riskLevel !== 'all') {
      result = result.filter((d) => d.riskLevel === filters.riskLevel);
    }

    return result;
  }, [detections, searchQuery, filters]);

  const hasActiveFilters = Object.values(filters).some((v) => v !== 'all') || searchQuery !== '';

  const resetFilters = () => {
    setFilters({ animalType: 'all', cameraId: 'all', riskLevel: 'all', dateRange: 'all' });
    setSearchQuery('');
  };

  return (
    <div className="space-y-6 pb-16 lg:pb-0">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-gray-900">Detection History</h1>
          <p className="text-gray-600 mt-1">Browse and search all animal detections</p>
        </div>
        <Button variant="ghost" leftIcon={<Download className="w-4 h-4" />}>Export</Button>
      </div>

      {/* Search and Filters */}
      <Card noPadding className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by animal, camera..."
              leftIcon={<Search className="w-5 h-5" />}
              rightIcon={searchQuery && (
                <button onClick={() => setSearchQuery('')}><X className="w-4 h-4" /></button>
              )}
            />
          </div>
          <Button
            variant={showFilters ? 'secondary' : 'ghost'}
            onClick={() => setShowFilters(!showFilters)}
            leftIcon={<Filter className="w-4 h-4" />}
            rightIcon={showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          >
            Filters
          </Button>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Select label="Animal Type" value={filters.animalType} onChange={(e) => setFilters({ ...filters, animalType: e.target.value })} options={animalOptions} />
              <Select label="Camera" value={filters.cameraId} onChange={(e) => setFilters({ ...filters, cameraId: e.target.value })} options={cameraOptions} />
              <Select label="Risk Level" value={filters.riskLevel} onChange={(e) => setFilters({ ...filters, riskLevel: e.target.value })} options={riskOptions} />
              <Select label="Date Range" value={filters.dateRange} onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })} options={dateOptions} />
            </div>
            {hasActiveFilters && (
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-gray-500">Showing {filteredDetections.length} of {detections.length} detections</p>
                <Button variant="ghost" size="sm" onClick={resetFilters}>Clear Filters</Button>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Results Grid */}
      {filteredDetections.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDetections.map((detection) => (
            <Card key={detection.id} hoverable noPadding className="overflow-hidden cursor-pointer" onClick={() => setSelectedDetection(detection)}>
              <div className="relative h-40 bg-gray-100 flex items-center justify-center">
                <span className="text-5xl">{getAnimalIcon(detection.animalType)}</span>
                <div className="absolute top-2 right-2">
                  <Badge variant={detection.riskLevel === 'danger' ? 'danger' : detection.riskLevel === 'warning' ? 'warning' : 'success'}>
                    {getRiskConfig(detection.riskLevel).label}
                  </Badge>
                </div>
                <div className="absolute bottom-2 left-2 bg-black/60 text-white px-2 py-1 rounded text-xs">
                  {formatConfidence(detection.confidence)} confidence
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{detection.animalName}</h3>
                  <span className="text-xs text-gray-500">{detection.id}</span>
                </div>
                <div className="space-y-1.5 text-sm text-gray-600">
                  <div className="flex items-center"><Camera className="w-4 h-4 mr-2 text-gray-400" />{detection.cameraName}</div>
                  <div className="flex items-center"><Clock className="w-4 h-4 mr-2 text-gray-400" />{formatSmartDate(detection.timestamp)}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState icon={Search} title="No detections found" description="Try adjusting your search or filter criteria." action={hasActiveFilters && <Button variant="primary" onClick={resetFilters}>Clear Filters</Button>} />
      )}

      {/* Detection Modal */}
      <Modal isOpen={!!selectedDetection} onClose={() => setSelectedDetection(null)} title="Detection Details" size="lg">
        {selectedDetection && (
          <div className="space-y-4">
            <div className="h-48 bg-gray-100 rounded-lg flex items-center justify-center">
              <span className="text-8xl">{getAnimalIcon(selectedDetection.animalType)}</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-sm text-gray-500">Animal</p><p className="font-medium">{selectedDetection.animalName}</p></div>
              <div><p className="text-sm text-gray-500">Confidence</p><p className="font-medium">{formatConfidence(selectedDetection.confidence)}</p></div>
              <div><p className="text-sm text-gray-500">Camera</p><p className="font-medium">{selectedDetection.cameraId}</p></div>
              <div><p className="text-sm text-gray-500">Time</p><p className="font-medium">{formatSmartDate(selectedDetection.timestamp)}</p></div>
            </div>
            {selectedDetection.notes && <div className="p-3 bg-gray-50 rounded-lg"><p className="text-sm text-gray-600">{selectedDetection.notes}</p></div>}
            <div className="flex justify-end pt-4 border-t">
              <Button variant="outline" leftIcon={<MapPin className="w-4 h-4" />} onClick={() => { setSelectedDetection(null); navigate('/map-tracking'); }}>View on Map</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default DetectionHistory;
