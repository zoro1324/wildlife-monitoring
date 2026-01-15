import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Video,
  Map,
  History,
  Bell,
  Camera,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Shield,
  Users,
  Upload,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { useAlerts } from '../../context/AlertContext';
import { cn } from '../../utils/helpers';

// Navigation items for ranger dashboard (all paths under /ranger/)
const navItems = [
  { path: '/ranger', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { path: '/ranger/live-monitoring', icon: Video, label: 'Live Monitoring' },
  { path: '/ranger/map-tracking', icon: Map, label: 'Map Tracking' },
  { path: '/ranger/detection-history', icon: History, label: 'Detection History' },
  { path: '/ranger/alerts', icon: Bell, label: 'Alerts', badge: true },
  { path: '/ranger/camera-health', icon: Camera, label: 'Camera Health' },
  { path: '/ranger/analytics', icon: BarChart3, label: 'Analytics' },
  { path: '/ranger/device-simulator', icon: Upload, label: 'Device Simulator' },
  { path: '/ranger/settings', icon: Settings, label: 'Settings' },
];

function Sidebar() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { sidebarOpen, setSidebarOpen } = useApp();
  const { unreadCount } = useAlerts();

  return (
    <aside
      className={cn(
        'fixed top-0 left-0 h-screen bg-forest-900 text-white z-40',
        'transition-all duration-300 flex flex-col',
        sidebarOpen ? 'w-64' : 'w-20'
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-forest-800">
        {sidebarOpen ? (
          <div className="flex items-center space-x-3">
            <span className="text-2xl">🦁</span>
            <span className="font-display font-bold text-lg">Wildlife</span>
          </div>
        ) : (
          <span className="text-2xl mx-auto">🦁</span>
        )}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1 rounded-lg hover:bg-forest-800 transition-colors"
        >
          {sidebarOpen ? (
            <ChevronLeft className="w-5 h-5" />
          ) : (
            <ChevronRight className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-3">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'flex items-center space-x-3 px-3 py-2.5 rounded-lg',
                    'transition-colors duration-200',
                    isActive
                      ? 'bg-forest-700 text-white'
                      : 'text-forest-200 hover:bg-forest-800 hover:text-white'
                  )
                }
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && (
                  <>
                    <span className="flex-1">{item.label}</span>
                    {item.badge && unreadCount > 0 && (
                      <span className="bg-danger-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </>
                )}
                {!sidebarOpen && item.badge && unreadCount > 0 && (
                  <span className="absolute left-12 w-2 h-2 bg-danger-500 rounded-full" />
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-forest-800">
        {sidebarOpen ? (
          <div className="space-y-3">
            {/* Role Badge */}
            <div className="flex items-center justify-center gap-2 py-1.5 px-3 rounded-full text-xs font-medium bg-forest-700 text-forest-100">
              <Shield className="w-3 h-3" />
              Forest Ranger
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center bg-forest-700">
                  <span className="text-sm font-medium">
                    {user?.name?.charAt(0) || 'R'}
                  </span>
                </div>
                <div className="text-sm">
                  <p className="font-medium truncate max-w-[100px]">{user?.name}</p>
                  <p className="text-forest-300 text-xs truncate max-w-[100px]">
                    {user?.role}
                  </p>
                </div>
              </div>
              <button
                onClick={logout}
                className="p-2 rounded-lg hover:bg-forest-800 transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="w-full p-2 rounded-lg flex justify-center bg-forest-700">
              <Shield className="w-4 h-4" />
            </div>
            <button
              onClick={logout}
              className="w-full p-2 rounded-lg hover:bg-forest-800 transition-colors flex justify-center"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;
