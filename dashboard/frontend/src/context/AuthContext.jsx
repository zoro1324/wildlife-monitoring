import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

// User types
export const USER_TYPES = {
  RANGER: 'ranger',
  PUBLIC: 'public',
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

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
              avatar: null,
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
        avatar: null,
      };
      
      setUser(userData);
      localStorage.setItem('wildlife_user', JSON.stringify(userData));
      setIsLoading(false);
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
        avatar: null,
      };
      
      setUser(newUser);
      localStorage.setItem('wildlife_user', JSON.stringify(newUser));
      setIsLoading(false);
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
    isAuthenticated: !!user,
    isLoading,
    isRanger,
    isPublicUser,
    loginAsRanger,
    signup,
    logout,
    updateProfile,
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
