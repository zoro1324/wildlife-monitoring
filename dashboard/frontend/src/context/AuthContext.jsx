import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

// User types
export const USER_TYPES = {
  RANGER: 'ranger',
  PUBLIC: 'public',
};

// Request user location
const requestUserLocation = () => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.log('Geolocation not supported');
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        console.log('Location permission denied or error:', error.message);
        resolve(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    );
  });
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);

  // Request location on mount
  const fetchUserLocation = useCallback(async () => {
    setLocationLoading(true);
    const location = await requestUserLocation();
    if (location) {
      setUserLocation(location);
      localStorage.setItem('wildlife_user_location', JSON.stringify(location));
    }
    setLocationLoading(false);
    return location;
  }, []);

  useEffect(() => {
    // Check for stored location on mount
    const storedLocation = localStorage.getItem('wildlife_user_location');
    if (storedLocation) {
      setUserLocation(JSON.parse(storedLocation));
    }
  }, []);

  useEffect(() => {
    // Check for stored auth on mount
    const initAuth = async () => {
      const storedUser = localStorage.getItem('wildlife_user');
      
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        
        // If authenticated user, verify token is still valid
        if (authAPI.isAuthenticated()) {
          try {
            // Verify token by fetching profile
            const profile = await authAPI.getProfile();
            const userType = profile.user_type || 'public';
            const userData = {
              id: profile.id,
              name: `${profile.first_name} ${profile.last_name}`.trim() || profile.username,
              username: profile.username,
              email: profile.email,
              role: userType === 'ranger' ? (profile.is_staff ? 'Admin' : 'Wildlife Ranger') : 'Public User',
              userType: userType,
              mobile_number: profile.mobile_number,
              home_lat: profile.home_lat,
              home_lon: profile.home_lon,
              avatar: profile.avatar || null,
            };
            setUser(userData);
            localStorage.setItem('wildlife_user', JSON.stringify(userData));
          } catch (error) {
            // Token invalid, clear storage
            console.error('Token validation failed:', error);
            localStorage.removeItem('wildlife_user');
            authAPI.logout();
          }
        } else {
          // No valid token, clear stored user
          localStorage.removeItem('wildlife_user');
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  // Login with credentials
  const loginAsRanger = async (identifier, password) => {
    setIsLoading(true);
    
    try {
      const response = await authAPI.login(identifier, password);
      const profile = response.user;
      const userType = profile.user_type || 'ranger';
      
      const userData = {
        id: profile.id,
        name: `${profile.first_name} ${profile.last_name}`.trim() || profile.username,
        username: profile.username,
        email: profile.email,
        role: userType === 'ranger' ? (profile.is_staff ? 'Admin' : 'Wildlife Ranger') : 'Public User',
        userType: userType,
        mobile_number: profile.mobile_number,
        home_lat: profile.home_lat,
        home_lon: profile.home_lon,
        avatar: profile.avatar || null,
      };
      
      setUser(userData);
      localStorage.setItem('wildlife_user', JSON.stringify(userData));
      setIsLoading(false);
      
      // Request location permission after successful login
      fetchUserLocation();
      
      return { success: true, userType: userType };
    } catch (error) {
      setIsLoading(false);
      return { success: false, error: error.message || 'Invalid credentials' };
    }
  };

  // Signup new user
  const signup = async (userData) => {
    setIsLoading(true);
    
    try {
      const response = await authAPI.signup(userData);
      const profile = response.user;
      const userType = profile.user_type || userData.user_type || 'public';
      
      const newUser = {
        id: profile.id,
        name: `${profile.first_name} ${profile.last_name}`.trim() || profile.username,
        username: profile.username,
        email: profile.email,
        role: userType === 'ranger' ? 'Wildlife Ranger' : 'Public User',
        userType: userType,
        mobile_number: profile.mobile_number,
        home_lat: profile.home_lat,
        home_lon: profile.home_lon,
        avatar: profile.avatar || null,
      };
      
      setUser(newUser);
      localStorage.setItem('wildlife_user', JSON.stringify(newUser));
      setIsLoading(false);
      
      // Request location permission after successful signup
      fetchUserLocation();
      
      return { success: true, userType: userType };
    } catch (error) {
      setIsLoading(false);
      return { success: false, error: error.message || 'Registration failed' };
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
    setUser(null);
    localStorage.removeItem('wildlife_user');
    localStorage.removeItem('wildlife_user_location');
    setUserLocation(null);
  };

  const updateProfile = (updates) => {
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    localStorage.setItem('wildlife_user', JSON.stringify(updatedUser));
  };

  const isRanger = user?.userType === USER_TYPES.RANGER;
  const isPublicUser = user?.userType === USER_TYPES.PUBLIC;

  const value = {
    user,
    userLocation,
    locationLoading,
    isAuthenticated: !!user,
    isLoading,
    isRanger,
    isPublicUser,
    loginAsRanger,
    signup,
    logout,
    updateProfile,
    fetchUserLocation,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
