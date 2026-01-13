import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Video, Map, Bell, Settings } from 'lucide-react';
import { useAlerts } from '../../context/AlertContext';
import { cn } from '../../utils/helpers';

// Navigation items for ranger mobile nav (under /ranger/)
const navItems = [
  { path: '/ranger', icon: LayoutDashboard, label: 'Home', end: true },
  { path: '/ranger/live-monitoring', icon: Video, label: 'Live' },
  { path: '/ranger/map-tracking', icon: Map, label: 'Map' },
  { path: '/ranger/alerts', icon: Bell, label: 'Alerts', badge: true },
  { path: '/ranger/settings', icon: Settings, label: 'Settings' },
];

function MobileNav() {
  const { unreadCount } = useAlerts();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 pb-safe">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center px-3 py-2 min-w-[60px]',
                'transition-colors duration-200',
                isActive ? 'text-forest-600' : 'text-gray-500'
              )
            }
          >
            <div className="relative">
              <item.icon className="w-5 h-5" />
              {item.badge && unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-danger-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            <span className="text-xs mt-1">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

export default MobileNav;
