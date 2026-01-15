import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, Shield, Trees } from 'lucide-react';
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
      // Redirect based on user type
      if (result.userType === 'ranger') {
        navigate('/ranger');
      } else {
        navigate('/public');
      }
    } else {
      setError(result.error || 'Invalid credentials');
    }
    setIsLoading(false);
  };

  const fillDemoCredentials = () => {
    setEmail('john@wildlife.com');
    setPassword('Wildlife@123');
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Image */}
      <div className="hidden lg:flex lg:w-1/2 bg-forest-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-forest-900/90 to-forest-800/80" />
        <div className="relative z-10 flex flex-col justify-center p-12 text-white">
          <div className="flex items-center space-x-3 mb-8">
            <Trees className="w-12 h-12 text-forest-300" />
            <h1 className="text-3xl font-display font-bold">Wildlife Watch</h1>
          </div>
          <h2 className="text-4xl font-bold mb-4">
            Welcome Back
          </h2>
          <p className="text-forest-200 text-lg">
            Sign in to access wildlife monitoring, safety alerts, 
            and stay informed about animal activity in your area.
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
              <p className="text-forest-200">Safety alerts and notifications</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-forest-700 flex items-center justify-center">
                🦁
              </div>
              <p className="text-forest-200">Wildlife sighting updates</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <Trees className="w-16 h-16 text-forest-600 mx-auto" />
            <h1 className="text-2xl font-display font-bold text-gray-900 mt-2">
              Wildlife Watch
            </h1>
          </div>

          <div className="bg-white rounded-2xl shadow-card p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-forest-100 rounded-lg">
                <Shield className="w-6 h-6 text-forest-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Sign In</h2>
                <p className="text-gray-500 text-sm">Access your account</p>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-danger-50 border border-danger-200 rounded-lg text-danger-700 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email or Username"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@wildlife.com"
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

            <div className="mt-6 text-center">
              <p className="text-gray-600 text-sm">
                Don't have an account?{' '}
                <Link to="/signup" className="text-forest-600 hover:text-forest-700 font-medium">
                  Sign Up
                </Link>
              </p>
            </div>

            {/* Demo Credentials */}
            <div className="mt-6 p-4 bg-forest-50 rounded-lg border border-forest-200">
              <p className="text-sm font-medium text-forest-800 mb-2">Demo Ranger Credentials:</p>
              <div className="text-sm text-forest-700 space-y-1">
                <p><strong>Email:</strong> john@wildlife.com</p>
                <p><strong>Password:</strong> Wildlife@123</p>
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
        </div>
      </div>
    </div>
  );
}

export default Login;
