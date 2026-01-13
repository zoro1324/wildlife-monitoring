import { createContext, useContext, useState, useEffect } from 'react';

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
    const storedUser = localStorage.getItem('wildlife_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  // Ranger login with credentials
  const loginAsRanger = async (email, password) => {
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    // Ranger credentials check
    if (email === 'ranger@wildlife.gov' && password === 'demo123') {
      const userData = {
        id: '1',
        name: 'Forest Ranger',
        email: email,
        role: 'Senior Wildlife Officer',
        userType: USER_TYPES.RANGER,
        avatar: null,
      };
      setUser(userData);
      localStorage.setItem('wildlife_user', JSON.stringify(userData));
      setIsLoading(false);
      return { success: true };
    }
    
    setIsLoading(false);
    return { success: false, error: 'Invalid credentials' };
  };

  // Public access - no login required
  const enterAsPublic = () => {
    const userData = {
      id: 'public-guest',
      name: 'Wildlife Visitor',
      email: null,
      role: 'Public Visitor',
      userType: USER_TYPES.PUBLIC,
      avatar: null,
    };
    setUser(userData);
    localStorage.setItem('wildlife_user', JSON.stringify(userData));
  };

  const logout = () => {
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
    enterAsPublic,
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
