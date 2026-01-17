import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { AlertProvider } from './context/AlertContext';

// Layout
import MainLayout from './components/layout/MainLayout';

// Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import RangerDashboard from './pages/Dashboard';
import UserDashboard from './pages/UserDashboard';
import LiveMonitoring from './pages/LiveMonitoring';
import MapTracking from './pages/MapTracking';
import DetectionHistory from './pages/DetectionHistory';
import AlertsCenter from './pages/AlertsCenter';
import CameraHealth from './pages/CameraHealth';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import DeviceSimulator from './pages/DeviceSimulator';
import MyDevices from './pages/MyDevices';
import HomeLocation from './pages/HomeLocation';
import SMSTest from './pages/SMSTest';

// Landing page component
function LandingPage() {
  const { isAuthenticated, isLoading, isRanger, isPublicUser } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-forest-50">
        <div className="animate-spin w-12 h-12 border-4 border-forest-600 border-t-transparent rounded-full" />
      </div>
    );
  }
  
  // Redirect authenticated users to their dashboard
  if (isAuthenticated) {
    if (isRanger) {
      return <Navigate to="/ranger" replace />;
    }
    if (isPublicUser) {
      return <Navigate to="/public" replace />;
    }
  }
  
  // Show login/signup choice for unauthenticated users
  return <Navigate to="/login" replace />;
}

// Protected route for ranger-only pages
function RangerRoute({ children }) {
  const { isAuthenticated, isLoading, isRanger } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-forest-50">
        <div className="animate-spin w-12 h-12 border-4 border-forest-600 border-t-transparent rounded-full" />
      </div>
    );
  }
  
  if (!isAuthenticated || !isRanger) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

// Protected route for public users
function PublicUserRoute({ children }) {
  const { isAuthenticated, isLoading, isPublicUser } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-forest-50">
        <div className="animate-spin w-12 h-12 border-4 border-forest-600 border-t-transparent rounded-full" />
      </div>
    );
  }
  
  if (!isAuthenticated || !isPublicUser) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

// Show auth pages only if not authenticated
function AuthRoute({ children }) {
  const { isAuthenticated, isLoading, isRanger, isPublicUser } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-forest-50">
        <div className="animate-spin w-12 h-12 border-4 border-forest-600 border-t-transparent rounded-full" />
      </div>
    );
  }
  
  if (isAuthenticated) {
    if (isRanger) {
      return <Navigate to="/ranger" replace />;
    }
    if (isPublicUser) {
      return <Navigate to="/public" replace />;
    }
  }
  
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Landing - redirects based on auth state */}
      <Route path="/" element={<LandingPage />} />
      
      {/* Auth Routes */}
      <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
      <Route path="/signup" element={<AuthRoute><Signup /></AuthRoute>} />
      <Route path="/ranger-login" element={<AuthRoute><Login /></AuthRoute>} />
      
      {/* Public User Routes - Uses MainLayout with limited sidebar */}
      <Route path="/public" element={<PublicUserRoute><MainLayout /></PublicUserRoute>}>
        <Route index element={<UserDashboard />} />
        <Route path="live-monitoring" element={<LiveMonitoring />} />
        <Route path="detection-history" element={<DetectionHistory />} />
        <Route path="alerts" element={<AlertsCenter />} />
        <Route path="my-devices" element={<MyDevices />} />
        <Route path="home-location" element={<HomeLocation />} />
      </Route>
      
      {/* Ranger Routes - Login required */}
      <Route path="/ranger" element={<RangerRoute><MainLayout /></RangerRoute>}>
        <Route index element={<RangerDashboard />} />
        <Route path="live-monitoring" element={<LiveMonitoring />} />
        <Route path="map-tracking" element={<MapTracking />} />
        <Route path="detection-history" element={<DetectionHistory />} />
        <Route path="alerts" element={<AlertsCenter />} />
        <Route path="camera-health" element={<CameraHealth />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="settings" element={<Settings />} />
        <Route path="device-simulator" element={<DeviceSimulator />} />
        <Route path="sms-test" element={<SMSTest />} />
        <Route path="whatsapp-test" element={<Navigate to="/ranger/sms-test" replace />} />
      </Route>
      
      {/* Redirect unknown paths */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppProvider>
          <AlertProvider>
            <AppRoutes />
          </AlertProvider>
        </AppProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
