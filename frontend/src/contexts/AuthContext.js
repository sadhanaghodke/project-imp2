import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for existing token on app load
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (token) {
        try {
          // Set token in API headers
          authAPI.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Verify token and get user data
          const response = await authAPI.get('/auth/profile');
          setUser(response.data.user);
        } catch (error) {
          console.error('Token verification failed:', error);
          // Remove invalid token
          localStorage.removeItem('token');
          delete authAPI.defaults.headers.common['Authorization'];
        }
      }
      
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await authAPI.post('/auth/login', {
        email,
        password
      });

      const { user, token } = response.data;

      // Store token
      localStorage.setItem('token', token);
      
      // Set token in API headers
      authAPI.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Update user state
      setUser(user);

      toast.success(`Welcome back, ${user.name}!`);
      return { success: true, user };
    } catch (error) {
      console.error('Login error:', error);
      
      // Handle different error types
      let message = 'Login failed';
      
      if (error.response) {
        // Server responded with error
        if (error.response.status === 429) {
          message = 'Too many login attempts. Please try again in a few minutes.';
        } else if (error.response.data?.message) {
          message = error.response.data.message;
        } else if (error.response.data?.error) {
          message = error.response.data.error;
        }
      } else if (error.request) {
        // Request made but no response
        message = 'Cannot connect to server. Please check your connection.';
      } else {
        // Something else happened
        message = error.message || 'An unexpected error occurred';
      }
      
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const register = async (userData) => {
    try {
      console.log('Attempting registration with data:', userData);
      console.log('API URL:', authAPI.defaults.baseURL);
      
      // Clean up the data - remove empty phone field to avoid validation issues
      const cleanedData = { ...userData };
      if (!cleanedData.phone || cleanedData.phone.trim() === '') {
        delete cleanedData.phone;
      }
      
      console.log('Cleaned registration data:', cleanedData);
      
      const response = await authAPI.post('/auth/register', cleanedData);
      
      console.log('Registration response:', response.data);
      
      const { user, token } = response.data;

      // Store token
      localStorage.setItem('token', token);
      
      // Set token in API headers
      authAPI.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Update user state
      setUser(user);

      toast.success(`Welcome to MyCleanCity, ${user.name}!`);
      return { success: true, user };
    } catch (error) {
      console.error('Registration error details:', error);
      console.error('Error response:', error.response);
      console.error('Error message:', error.message);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
      
      const message = error.response?.data?.message || error.response?.data?.error || error.message || 'Registration failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const logout = () => {
    // Remove token
    localStorage.removeItem('token');
    
    // Remove token from API headers
    delete authAPI.defaults.headers.common['Authorization'];
    
    // Clear user state
    setUser(null);
    
    toast.success('Logged out successfully');
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await authAPI.put('/auth/profile', profileData);
      
      // Update user state with new data
      setUser(response.data.user);
      
      toast.success('Profile updated successfully');
      return { success: true, user: response.data.user };
    } catch (error) {
      const message = error.response?.data?.message || 'Profile update failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const refreshUser = async () => {
    try {
      const response = await authAPI.get('/auth/profile');
      setUser(response.data.user);
      return response.data.user;
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      return null;
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};