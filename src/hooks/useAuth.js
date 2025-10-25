// src/hooks/useAuth.js
import { useState, useEffect, createContext, useContext } from 'react';
import { authAPI } from '../services/api'; // Corrected path assuming api.js is in ../services/
import { toast } from 'react-toastify';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Track initial loading state

  // Initialize auth state from localStorage on component mount
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('leakhere_user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage:", error);
      localStorage.removeItem('leakhere_user'); // Clear corrupted data
    } finally {
      setLoading(false); // Mark loading complete after checking storage
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  // Register new user
  const register = async (username, password) => {
    try {
      const response = await authAPI.register(username, password);
      // Assuming API returns user details upon successful registration
      const userData = {
        username: response.data.username,
        user_id: response.data.user_id,
        // Add any other relevant user data returned by your API
      };
      setUser(userData);
      localStorage.setItem('leakhere_user', JSON.stringify(userData));
      toast.success('Account created successfully! 🎉');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed. Please try again.';
      console.error("Registration error:", error.response?.data || error);
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Login existing user
  const login = async (username, password) => {
    try {
      const response = await authAPI.login(username, password);
      // Assuming API returns user details upon successful login
      const userData = {
        username: response.data.username,
        user_id: response.data.user_id,
        // Add any other relevant user data
      };
      setUser(userData);
      localStorage.setItem('leakhere_user', JSON.stringify(userData));
      toast.success(`Welcome back, ${userData.username}! 🎉`);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed. Please check your credentials.';
      console.error("Login error:", error.response?.data || error);
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Logout user
  const logout = () => {
    setUser(null);
    localStorage.removeItem('leakhere_user');
    toast.info('You have been logged out.'); // Use info for logout
    // Optionally redirect or perform other cleanup
  };

  // Check if user is authenticated
  const isAuthenticated = () => !!user;

  // Get user initial for avatars/display
  const getUserInitial = () => {
    if (!user || !user.username) return '?';
    return user.username.charAt(0).toUpperCase();
  };

  // Value provided to context consumers
  const value = {
    user,
    loading, // Provide loading state for initial auth check
    register,
    login,
    logout,
    isAuthenticated,
    getUserInitial,
  };

  // Don't render children until the initial auth check is complete
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Custom hook to easily consume the AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) { // Check for undefined instead of !context
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Default export remains the hook itself for convenience
export default useAuth;