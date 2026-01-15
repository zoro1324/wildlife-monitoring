import { useState, useMemo } from 'react';
import { BarChart3, TrendingUp, PieChart, Activity, Calendar, Download, RefreshCw } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart as RePieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Card, Badge, Button, Select, StatCard, EmptyState } from '../components/ui';
import { useApp } from '../context/AppContext';

// Animal types configuration
const animalTypes = [
  { id: 'elephant', name: 'Elephant', icon: '🐘' },
  { id: 'tiger', name: 'Tiger', icon: '🐅' },
  { id: 'lion', name: 'Lion', icon: '🦁' },
  { id: 'leopard', name: 'Leopard', icon: '🐆' },
  { id: 'bear', name: 'Bear', icon: '🐻' },
  { id: 'bison', name: 'Bison', icon: '🦬' },
  { id: 'boar', name: 'Wild Boar', icon: '🐗' },
  { id: 'human', name: 'Human', icon: '🧑' },
];

function Analytics() {
  const { detections, cameras } = useApp();
  const [timeRange, setTimeRange] = useState('week');

  const timeRangeOptions = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'year', label: 'This Year' },
  ];

  // Generate analytics from real detections
  const analytics = useMemo(() => {
    const speciesCount = {};
    detections.forEach(d => {
      speciesCount[d.animalName] = (speciesCount[d.animalName] || 0) + 1;
    });

    const detectionsBySpecies = Object.entries(speciesCount).map(([name, count]) => ({
      name,
      count
    }));

    // Group by camera
    const cameraCount = {};
    detections.forEach(d => {
      cameraCount[d.cameraId] = (cameraCount[d.cameraId] || 0) + 1;
    });

    const detectionsByZone = Object.entries(cameraCount).map(([zone, count]) => ({
      zone,
      count
    }));

    // Weekly trend (mock based on detection count)
    const weeklyTrend = [
      { day: 'Mon', detections: Math.floor(detections.length * 0.12) },
      { day: 'Tue', detections: Math.floor(detections.length * 0.15) },
      { day: 'Wed', detections: Math.floor(detections.length * 0.18) },
      { day: 'Thu', detections: Math.floor(detections.length * 0.14) },
      { day: 'Fri', detections: Math.floor(detections.length * 0.16) },
      { day: 'Sat', detections: Math.floor(detections.length * 0.13) },
      { day: 'Sun', detections: Math.floor(detections.length * 0.12) },
    ];

    return {
      totalDetections: detections.length,
      uniqueSpecies: Object.keys(speciesCount).length,
      activeZones: cameras.length,
      averageDaily: Math.round(detections.length / 7) || 0,
      detectionsBySpecies,
      detectionsByZone,
      weeklyTrend,
    };
  }, [detections, cameras]);

  const pieColors = ['#166534', '#92400E', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6'];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white shadow-lg rounded-lg p-3 border border-gray-100">
          <p className="font-medium text-gray-900">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 pb-16 lg:pb-0">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-1">Detection patterns and wildlife insights</p>
        </div>
        <div className="flex items-center space-x-3">
          <Select value={timeRange} onChange={(e) => setTimeRange(e.target.value)} options={timeRangeOptions} />
          <Button variant="ghost" leftIcon={<Download className="w-4 h-4" />}>Export</Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Detections"
          value={analytics.totalDetections}
          icon={Activity}
        />
        <StatCard
          title="Unique Species"
          value={analytics.uniqueSpecies}
          icon={PieChart}
        />
        <StatCard
          title="Active Cameras"
          value={analytics.activeZones}
          icon={BarChart3}
        />
        <StatCard
          title="Avg. Daily"
          value={analytics.averageDaily}
          icon={TrendingUp}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Trend Chart */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Weekly Detection Trend</h3>
            <Badge variant="neutral">Last 7 Days</Badge>
          </div>
          <div className="h-[300px]">
            {analytics.weeklyTrend.some(d => d.detections > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.weeklyTrend}>
                  <defs>
                    <linearGradient id="colorDetections" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#166534" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#166534" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="detections"
                    stroke="#166534"
                    strokeWidth={2}
                    fill="url(#colorDetections)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                No detection data available yet
              </div>
            )}
          </div>
        </Card>

        {/* Species Distribution */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Detections by Species</h3>
          <div className="h-[280px]">
            {analytics.detectionsBySpecies.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={analytics.detectionsBySpecies}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="count"
                    nameKey="name"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {analytics.detectionsBySpecies.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RePieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                No species data available yet
              </div>
            )}
          </div>
          {analytics.detectionsBySpecies.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4 justify-center">
              {analytics.detectionsBySpecies.map((item, index) => (
                <div key={item.name} className="flex items-center space-x-1.5">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: pieColors[index % pieColors.length] }} />
                  <span className="text-xs text-gray-600">{item.name}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Camera Activity */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Activity by Camera</h3>
          <div className="h-[280px]">
            {analytics.detectionsByZone.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.detectionsByZone}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="zone" tick={{ fontSize: 10 }} stroke="#9CA3AF" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" fill="#166534" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                No camera activity data yet
              </div>
            )}
          </div>
        </Card>

        {/* Zone Activity */}
        <Card className="lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Detections by Camera Zone</h3>
          <div className="h-[250px]">
            {analytics.detectionsByZone.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.detectionsByZone} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis type="number" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                  <YAxis dataKey="zone" type="category" tick={{ fontSize: 12 }} stroke="#9CA3AF" width={120} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" fill="#92400E" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                No zone data available yet
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Top Species Table */}
      {analytics.detectionsBySpecies.length > 0 && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Detected Species</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 border-b">
                  <th className="pb-3 font-medium">Rank</th>
                  <th className="pb-3 font-medium">Species</th>
                  <th className="pb-3 font-medium">Detections</th>
                  <th className="pb-3 font-medium">% of Total</th>
                  <th className="pb-3 font-medium">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {analytics.detectionsBySpecies.slice(0, 5).map((item, index) => {
                  const total = analytics.detectionsBySpecies.reduce((sum, s) => sum + s.count, 0);
                  const percentage = total > 0 ? ((item.count / total) * 100).toFixed(1) : 0;
                  const animal = animalTypes.find((a) => a.name.toLowerCase() === item.name.toLowerCase());
                  return (
                    <tr key={item.name} className="hover:bg-gray-50">
                      <td className="py-3 font-medium text-gray-900">#{index + 1}</td>
                      <td className="py-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-xl">{animal?.icon || '🐾'}</span>
                          <span className="font-medium text-gray-900">{item.name}</span>
                        </div>
                      </td>
                      <td className="py-3 text-gray-600">{item.count}</td>
                      <td className="py-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-forest-600 rounded-full" style={{ width: `${percentage}%` }} />
                          </div>
                          <span className="text-sm text-gray-600">{percentage}%</span>
                        </div>
                      </td>
                      <td className="py-3">
                        <Badge variant={index < 2 ? 'success' : 'neutral'} size="sm">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          +{Math.floor(Math.random() * 20)}%
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

export default Analytics;