import { Outlet } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useAlerts } from '../../context/AlertContext';
import Sidebar from './Sidebar';
import Header from './Header';
import MobileNav from './MobileNav';
import { NotificationToast } from '../ui';
import { cn } from '../../utils/helpers';

function MainLayout() {
  const { sidebarOpen } = useApp();
  const { notifications, dismissNotification } = useAlerts();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar - Hidden on mobile */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Main Content */}
      <div
        className={cn(
          'transition-all duration-300',
          sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'
        )}
      >
        {/* Header */}
        <Header />

        {/* Page Content */}
        <main className="p-4 md:p-6 min-h-[calc(100vh-4rem)]">
          <Outlet />
        </main>
      </div>

      {/* Mobile Navigation */}
      <MobileNav />

      {/* Notification Toasts */}
      <NotificationToast
        notifications={notifications}
        onDismiss={dismissNotification}
      />
    </div>
  );
}

export default MainLayout;
