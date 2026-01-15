import { useState } from 'react';
import { User, Bell, Monitor, Shield, Camera, Save, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Input, PhoneInput, Select, Badge } from '../components/ui';
import { cn } from '../utils/helpers';

function Settings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'display', label: 'Display', icon: Monitor },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 1000));
    setIsSaving(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 pb-16 lg:pb-0">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Manage your account and preferences</p>
        </div>
        {showSuccess && (
          <div className="flex items-center space-x-2 text-safe-600 animate-fade-in">
            <Check className="w-5 h-5" />
            <span>Settings saved successfully</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Tabs */}
        <div className="lg:col-span-1">
          <Card noPadding className="overflow-hidden">
            <nav className="flex flex-row lg:flex-col">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex-1 lg:flex-none flex items-center justify-center lg:justify-start px-4 py-3 text-sm font-medium transition-colors',
                    activeTab === tab.id
                      ? 'bg-forest-50 text-forest-700 border-b-2 lg:border-b-0 lg:border-l-4 border-forest-600'
                      : 'text-gray-600 hover:bg-gray-50 border-b-2 lg:border-b-0 lg:border-l-4 border-transparent'
                  )}
                >
                  <tab.icon className="w-5 h-5 lg:mr-3" />
                  <span className="hidden lg:inline">{tab.label}</span>
                </button>
              ))}
            </nav>
          </Card>
        </div>

        {/* Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <>
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-20 h-20 rounded-full bg-forest-100 flex items-center justify-center">
                    <span className="text-3xl">{user?.avatar || '👤'}</span>
                  </div>
                  <div>
                    <Button variant="outline" size="sm">Change Avatar</Button>
                    <p className="text-xs text-gray-500 mt-1">JPG, PNG. Max 2MB</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="Full Name" defaultValue={user?.name || ''} />
                  <Input label="Email" type="email" defaultValue={user?.email || ''} />
                  <Input label="Role" defaultValue={user?.role || 'Ranger'} disabled />
                  <PhoneInput label="Phone" value={user?.mobile_number || ''} />
                </div>
              </Card>
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Assigned Zone</h3>
                <div className="p-4 bg-gray-50 rounded-lg flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Camera className="w-5 h-5 text-forest-600" />
                    <div>
                      <p className="font-medium text-gray-900">{user?.zone || 'North Sector'}</p>
                      <p className="text-sm text-gray-500">6 cameras assigned</p>
                    </div>
                  </div>
                  <Badge variant="success">Active</Badge>
                </div>
              </Card>
            </>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Preferences</h3>
              <div className="space-y-4">
                {[
                  { id: 'critical', label: 'Critical Alerts', desc: 'Dangerous animal sightings near settlements', default: true },
                  { id: 'warning', label: 'Warning Alerts', desc: 'Animals approaching monitored boundaries', default: true },
                  { id: 'info', label: 'Info Updates', desc: 'General detection notifications', default: false },
                  { id: 'camera', label: 'Camera Status', desc: 'Camera offline/online notifications', default: true },
                  { id: 'daily', label: 'Daily Summary', desc: 'Daily detection summary email', default: true },
                ].map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{item.label}</p>
                      <p className="text-sm text-gray-500">{item.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked={item.default} className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-forest-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-forest-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Display Tab */}
          {activeTab === 'display' && (
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Display Settings</h3>
              <div className="space-y-6">
                <Select
                  label="Theme"
                  options={[
                    { value: 'light', label: 'Light' },
                    { value: 'dark', label: 'Dark (Coming Soon)' },
                    { value: 'auto', label: 'System' },
                  ]}
                  defaultValue="light"
                />
                <Select
                  label="Default Dashboard View"
                  options={[
                    { value: 'overview', label: 'Overview' },
                    { value: 'monitoring', label: 'Live Monitoring' },
                    { value: 'map', label: 'Map View' },
                  ]}
                  defaultValue="overview"
                />
                <Select
                  label="Camera Grid Layout"
                  options={[
                    { value: '2x2', label: '2x2 Grid' },
                    { value: '3x3', label: '3x3 Grid' },
                    { value: '4x4', label: '4x4 Grid' },
                  ]}
                  defaultValue="3x3"
                />
                <Select
                  label="Date Format"
                  options={[
                    { value: 'mdy', label: 'MM/DD/YYYY' },
                    { value: 'dmy', label: 'DD/MM/YYYY' },
                    { value: 'ymd', label: 'YYYY-MM-DD' },
                  ]}
                  defaultValue="mdy"
                />
              </div>
            </Card>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <>
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h3>
                <div className="space-y-4 max-w-md">
                  <Input label="Current Password" type="password" placeholder="Enter current password" />
                  <Input label="New Password" type="password" placeholder="Enter new password" />
                  <Input label="Confirm Password" type="password" placeholder="Confirm new password" />
                  <Button variant="primary">Update Password</Button>
                </div>
              </Card>
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Two-Factor Authentication</h3>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Enable 2FA</p>
                    <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                  </div>
                  <Button variant="outline">Enable</Button>
                </div>
              </Card>
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Sessions</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Monitor className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900 text-sm">Windows PC - Chrome</p>
                        <p className="text-xs text-gray-500">Current session</p>
                      </div>
                    </div>
                    <Badge variant="success" size="sm">Active</Badge>
                  </div>
                </div>
              </Card>
            </>
          )}

          {/* Save Button */}
          <div className="flex justify-end">
            <Button variant="primary" onClick={handleSave} isLoading={isSaving} leftIcon={<Save className="w-4 h-4" />}>
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
