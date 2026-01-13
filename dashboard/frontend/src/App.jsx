import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { AlertProvider } from './context/AlertContext';

// Layout
import MainLayout from './components/layout/MainLayout';

// Pages
import Login from './pages/Login';
import RangerDashboard from './pages/Dashboard';
import PublicDashboard from './pages/PublicDashboard';
import LiveMonitoring from './pages/LiveMonitoring';
import MapTracking from './pages/MapTracking';
import DetectionHistory from './pages/DetectionHistory';
import AlertsCenter from './pages/AlertsCenter';
import CameraHealth from './pages/CameraHealth';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';

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
    return <Navigate to="/ranger-login" replace />;
  }
  
  return children;
}

// Show login only if not authenticated
function LoginRoute({ children }) {
  const { isAuthenticated, isLoading, isRanger } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-forest-50">
        <div className="animate-spin w-12 h-12 border-4 border-forest-600 border-t-transparent rounded-full" />
      </div>
    );
  }
  
  if (isAuthenticated && isRanger) {
    return <Navigate to="/ranger" replace />;
  }
  
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes - No login required */}
      <Route path="/" element={<PublicDashboard />} />
      
      {/* Ranger Login */}
      <Route path="/ranger-login" element={<LoginRoute><Login /></LoginRoute>} />
      
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
      </Route>
      
      {/* Redirect old paths */}
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
