import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, Shield, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button, Input } from '../components/ui';

function Login() {
  const navigate = useNavigate();
  const { loginAsRanger } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await loginAsRanger(email, password);
    
    if (result.success) {
      navigate('/ranger');
    } else {
      setError(result.error || 'Invalid credentials');
    }
    setIsLoading(false);
  };

  const fillDemoCredentials = () => {
    setEmail('ranger@wildlife.gov');
    setPassword('demo123');
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Image */}
      <div className="hidden lg:flex lg:w-1/2 bg-forest-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-forest-900/90 to-forest-800/80" />
        <div className="relative z-10 flex flex-col justify-center p-12 text-white">
          <div className="flex items-center space-x-3 mb-8">
            <Shield className="w-12 h-12 text-forest-300" />
            <h1 className="text-3xl font-display font-bold">Ranger Portal</h1>
          </div>
          <h2 className="text-4xl font-bold mb-4">
            Forest Ranger Dashboard
          </h2>
          <p className="text-forest-200 text-lg">
            Access the full monitoring system with real-time alerts, camera controls, 
            human intrusion detection, and advanced analytics.
          </p>
          <div className="mt-12 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-forest-700 flex items-center justify-center">
                📍
              </div>
              <p className="text-forest-200">Real-time animal location tracking</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-forest-700 flex items-center justify-center">
                🚨
              </div>
              <p className="text-forest-200">Human intrusion alerts</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-forest-700 flex items-center justify-center">
                📹
              </div>
              <p className="text-forest-200">Camera health monitoring</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Back to Public */}
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-forest-600 hover:text-forest-700 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Public Dashboard
          </Link>

          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <Shield className="w-16 h-16 text-forest-600 mx-auto" />
            <h1 className="text-2xl font-display font-bold text-gray-900 mt-2">
              Ranger Portal
            </h1>
          </div>

          <div className="bg-white rounded-2xl shadow-card p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-forest-100 rounded-lg">
                <Shield className="w-6 h-6 text-forest-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Ranger Login</h2>
                <p className="text-gray-500 text-sm">Authorized personnel only</p>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-danger-50 border border-danger-200 rounded-lg text-danger-700 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ranger@wildlife.gov"
                leftIcon={<Mail className="w-5 h-5" />}
                required
              />

              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                leftIcon={<Lock className="w-5 h-5" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                }
                required
              />

              <Button
                type="submit"
                className="w-full"
                isLoading={isLoading}
              >
                Sign In
              </Button>
            </form>

            {/* Demo Credentials */}
            <div className="mt-6 p-4 bg-forest-50 rounded-lg border border-forest-200">
              <p className="text-sm font-medium text-forest-800 mb-2">Demo Credentials:</p>
              <div className="text-sm text-forest-700 space-y-1">
                <p><strong>Email:</strong> ranger@wildlife.gov</p>
                <p><strong>Password:</strong> demo123</p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                className="mt-3 w-full"
                onClick={fillDemoCredentials}
              >
                Fill Demo Credentials
              </Button>
            </div>
          </div>

          {/* Security Notice */}
          <p className="text-center text-gray-500 text-sm mt-6">
            🔒 This portal is for authorized forest department personnel only.
            Unauthorized access is prohibited.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
