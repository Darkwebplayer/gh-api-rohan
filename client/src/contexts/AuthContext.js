import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

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

  const getToken = () => localStorage.getItem('authToken');

  const removeToken = () => localStorage.removeItem('authToken');

  const isAuthenticated = () => {
    const token = getToken();
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp > Date.now() / 1000;
    } catch {
      return false;
    }
  };

  const createAuthenticatedRequest = () => {
    const token = getToken();
    return axios.create({
      baseURL: process.env.REACT_APP_BACKEND_URL,
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json'
      }
    });
  };

  const checkAuth = async () => {
    if (!isAuthenticated()) {
      setLoading(false);
      return;
    }

    try {
      const api = createAuthenticatedRequest();
      const response = await api.get('/api/user');
      setUser(response.data);
    } catch (error) {
      console.error('Auth check failed:', error);
      removeToken();
      setUser(null);
    }
    setLoading(false);
  };

  const logout = () => {
    removeToken();
    setUser(null);
    window.location.href = '/';
  };

  const handleAuthToken = (token) => {
    localStorage.setItem('authToken', token);
    checkAuth();
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isAuthenticated,
      logout,
      handleAuthToken,
      createAuthenticatedRequest
    }}>
      {children}
    </AuthContext.Provider>
  );
};
