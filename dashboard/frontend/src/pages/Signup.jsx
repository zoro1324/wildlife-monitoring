import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, Phone, MapPin, Shield, Trees, UserCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button, Input } from '../components/ui';

function Signup() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    mobileNumber: '',
    userType: 'public',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (field) => (e) => {
    setFormData({ ...formData, [field]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);

    const result = await signup({
      username: formData.username,
      email: formData.email,
      password: formData.password,
      first_name: formData.firstName,
      last_name: formData.lastName,
      mobile_number: formData.mobileNumber,
      user_type: formData.userType,
    });

    if (result.success) {
      if (formData.userType === 'ranger') {
        navigate('/ranger');
      } else {
        navigate('/public');
      }
    } else {
      setError(result.error || 'Registration failed');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Image/Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-forest-800 to-forest-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 bg-forest-400 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-earth-400 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-center p-12 text-white">
          <div className="flex items-center space-x-3 mb-8">
            <Trees className="w-12 h-12 text-forest-300" />
            <h1 className="text-3xl font-display font-bold">Wildlife Watch</h1>
          </div>
          <h2 className="text-4xl font-bold mb-4">
            Join Our Wildlife Protection Network
          </h2>
          <p className="text-forest-200 text-lg mb-8">
            Whether you're a forest ranger or a wildlife enthusiast, create an account to stay informed about wildlife activity in your area.
          </p>
          
          <div className="space-y-6">
            <div className="bg-forest-700/50 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <Shield className="w-8 h-8 text-forest-300" />
                <h3 className="text-xl font-semibold">For Rangers</h3>
              </div>
              <ul className="text-forest-200 space-y-2 ml-11">
                <li>• Full access to monitoring dashboard</li>
                <li>• Real-time alerts and notifications</li>
                <li>• Camera and device management</li>
              </ul>
            </div>
            
            <div className="bg-earth-700/50 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <UserCircle className="w-8 h-8 text-earth-300" />
                <h3 className="text-xl font-semibold">For Public</h3>
              </div>
              <ul className="text-earth-200 space-y-2 ml-11">
                <li>• Wildlife sighting notifications</li>
                <li>• Safety alerts for your area</li>
                <li>• View recent animal activity</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Signup Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-gray-50 overflow-y-auto">
        <div className="w-full max-w-md py-8">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-6">
            <Trees className="w-12 h-12 text-forest-600 mx-auto" />
            <h1 className="text-2xl font-display font-bold text-gray-900 mt-2">
              Wildlife Watch
            </h1>
          </div>

          <div className="bg-white rounded-2xl shadow-card p-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Create Account</h2>
              <p className="text-gray-500 text-sm mt-1">Join the wildlife protection community</p>
            </div>

            {/* User Type Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                I am a...
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, userType: 'public' })}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    formData.userType === 'public'
                      ? 'border-earth-500 bg-earth-50 text-earth-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <UserCircle className={`w-8 h-8 mx-auto mb-2 ${
                    formData.userType === 'public' ? 'text-earth-600' : 'text-gray-400'
                  }`} />
                  <p className="font-medium">Public User</p>
                  <p className="text-xs text-gray-500 mt-1">Wildlife enthusiast</p>
                </button>
                
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, userType: 'ranger' })}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    formData.userType === 'ranger'
                      ? 'border-forest-500 bg-forest-50 text-forest-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Shield className={`w-8 h-8 mx-auto mb-2 ${
                    formData.userType === 'ranger' ? 'text-forest-600' : 'text-gray-400'
                  }`} />
                  <p className="font-medium">Forest Ranger</p>
                  <p className="text-xs text-gray-500 mt-1">Authorized personnel</p>
                </button>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-danger-50 border border-danger-200 rounded-lg text-danger-700 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="First Name"
                  type="text"
                  value={formData.firstName}
                  onChange={handleChange('firstName')}
                  placeholder="John"
                />
                <Input
                  label="Last Name"
                  type="text"
                  value={formData.lastName}
                  onChange={handleChange('lastName')}
                  placeholder="Doe"
                />
              </div>

              <Input
                label="Username"
                type="text"
                value={formData.username}
                onChange={handleChange('username')}
                placeholder="johndoe"
                leftIcon={<User className="w-5 h-5" />}
                required
              />

              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={handleChange('email')}
                placeholder="john@example.com"
                leftIcon={<Mail className="w-5 h-5" />}
                required
              />

              <Input
                label="Mobile Number"
                type="tel"
                value={formData.mobileNumber}
                onChange={handleChange('mobileNumber')}
                placeholder="+91 9876543210"
                leftIcon={<Phone className="w-5 h-5" />}
                helperText="For wildlife alerts in your area"
              />

              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange('password')}
                placeholder="Min. 8 characters"
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

              <Input
                label="Confirm Password"
                type={showPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleChange('confirmPassword')}
                placeholder="Confirm your password"
                leftIcon={<Lock className="w-5 h-5" />}
                required
              />

              <Button
                type="submit"
                className="w-full"
                isLoading={isLoading}
              >
                Create Account
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-600 text-sm">
                Already have an account?{' '}
                <Link to="/login" className="text-forest-600 hover:text-forest-700 font-medium">
                  Sign In
                </Link>
              </p>
            </div>
          </div>

          {/* Privacy Notice */}
          <p className="text-center text-gray-500 text-xs mt-4 px-4">
            By creating an account, you agree to receive wildlife safety notifications in your area. 
            Your location data is used only for alert purposes.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Signup;
