import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Lock, Shield, Trees, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAlerts } from '../context/AlertContext';
import { Button, Input, PhoneInput } from '../components/ui';

function Login() {
  const navigate = useNavigate();
  const { loginAsRanger } = useAuth();
  const { addNotification } = useAlerts();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loginMethod, setLoginMethod] = useState('default');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const fieldErrorList = Object.values(fieldErrors).filter(Boolean);

  const handleIdentifierChange = (e) => {
    setIdentifier(e.target.value);
    setFieldErrors({});
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    setFieldErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setIsLoading(true);

    const result = await loginAsRanger(identifier, password, loginMethod);
    
    if (result.success) {
      // Redirect based on user type
      if (result.userType === 'ranger') {
        navigate('/ranger');
      } else {
        navigate('/public');
      }
    } else {
      const fieldErrorText = result.fieldErrors?.non_field_errors;
      const errorMessage = result.error || fieldErrorText || 'Invalid credentials';
      setError(errorMessage);
      if (result.fieldErrors) {
        setFieldErrors(result.fieldErrors);
      }
      addNotification({
        type: 'error',
        title: 'Login failed',
        message: errorMessage,
      });
    }
    setIsLoading(false);
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

            {(error || fieldErrorList.length > 0) && (
              <div className="mb-4 p-3 bg-danger-50 border border-danger-200 rounded-lg text-danger-700 text-sm">
                {error || 'Please fix the highlighted fields.'}
                {fieldErrorList.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {fieldErrorList.map((msg, index) => (
                      <div key={`${msg}-${index}`}>• {msg}</div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-3">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setLoginMethod('default')}
                    className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      loginMethod === 'default'
                        ? 'border-forest-500 bg-forest-50 text-forest-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    Email / Username
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoginMethod('mobile')}
                    className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      loginMethod === 'mobile'
                        ? 'border-earth-500 bg-earth-50 text-earth-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    Mobile Number
                  </button>
                </div>

                {loginMethod === 'mobile' ? (
                  <PhoneInput
                    label="Mobile Number"
                    value={identifier}
                    onChange={handleIdentifierChange}
                    error={fieldErrors.mobile_number}
                    helperText="Use the same number you registered with"
                    required
                  />
                ) : (
                  <Input
                    label="Email or Username"
                    type="text"
                    value={identifier}
                    onChange={handleIdentifierChange}
                    placeholder="john@wildlife.com"
                    leftIcon={<User className="w-5 h-5" />}
                    error={fieldErrors.email || fieldErrors.username}
                    required
                  />
                )}
              </div>

              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={handlePasswordChange}
                placeholder="Enter your password"
                leftIcon={<Lock className="w-5 h-5" />}
                error={fieldErrors.password}
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
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
