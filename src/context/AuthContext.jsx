import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('airline_token') || null);
  const [userEmail, setUserEmail] = useState(() => localStorage.getItem('airline_email') || null);
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(token));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyToken = async () => {
      if (token) {
        try {
          const res = await authApi.isAuthenticated();
          if (res.data?.success) {
            setIsAuthenticated(true);
          } else {
            logout();
          }
        } catch {
          // Token invalid or expired
          logout();
        }
      }
      setLoading(false);
    };

    verifyToken();
  }, [token]);

  const login = (jwtToken, email) => {
    localStorage.setItem('airline_token', jwtToken);
    if (email) localStorage.setItem('airline_email', email);
    setToken(jwtToken);
    setUserEmail(email);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('airline_token');
    localStorage.removeItem('airline_email');
    setToken(null);
    setUserEmail(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ token, userEmail, isAuthenticated, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
