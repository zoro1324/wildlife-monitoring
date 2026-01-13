import { useState } from 'react';
import { BarChart3, TrendingUp, PieChart, Activity, Calendar, Download, RefreshCw } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart as RePieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Card, Badge, Button, Select, StatCard } from '../components/ui';
import { mockAnalytics, animalTypes } from '../data/mockData';

function Analytics() {
  const [timeRange, setTimeRange] = useState('week');

  const timeRangeOptions = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'year', label: 'This Year' },
  ];

  const { detectionsBySpecies, detectionsByHour, detectionsByZone, weeklyTrend } = mockAnalytics;

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
          value={mockAnalytics.totalDetections}
          icon={Activity}
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Unique Species"
          value={mockAnalytics.uniqueSpecies}
          icon={PieChart}
        />
        <StatCard
          title="Active Zones"
          value={mockAnalytics.activeZones}
          icon={BarChart3}
        />
        <StatCard
          title="Avg. Daily"
          value={mockAnalytics.averageDaily}
          icon={TrendingUp}
          trend={{ value: 5, isPositive: true }}
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
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyTrend}>
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
          </div>
        </Card>

        {/* Species Distribution */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Detections by Species</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={detectionsBySpecies}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="count"
                  nameKey="species"
                  label={({ species, percent }) => `${species} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
                  {detectionsBySpecies.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </RePieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-2 mt-4 justify-center">
            {detectionsBySpecies.map((item, index) => (
              <div key={item.species} className="flex items-center space-x-1.5">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: pieColors[index % pieColors.length] }} />
                <span className="text-xs text-gray-600">{item.species}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Hourly Activity */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Activity by Hour</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={detectionsByHour}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="hour" tick={{ fontSize: 10 }} stroke="#9CA3AF" />
                <YAxis tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#166534" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Zone Activity */}
        <Card className="lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Detections by Zone</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={detectionsByZone} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis type="number" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                <YAxis dataKey="zone" type="category" tick={{ fontSize: 12 }} stroke="#9CA3AF" width={120} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="detections" fill="#92400E" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Top Species Table */}
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
              {detectionsBySpecies.slice(0, 5).map((item, index) => {
                const total = detectionsBySpecies.reduce((sum, s) => sum + s.count, 0);
                const percentage = ((item.count / total) * 100).toFixed(1);
                const animal = animalTypes.find((a) => a.name.toLowerCase() === item.species.toLowerCase());
                return (
                  <tr key={item.species} className="hover:bg-gray-50">
                    <td className="py-3 font-medium text-gray-900">#{index + 1}</td>
                    <td className="py-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-xl">{animal?.icon || '🐾'}</span>
                        <span className="font-medium text-gray-900">{item.species}</span>
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
    </div>
  );
}

export default Analytics;
