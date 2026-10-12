import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('airline_token') || null);
  const [user, setUser] = useState(() => {
    const email = localStorage.getItem('airline_email');
    const id = localStorage.getItem('airline_user_id');
    return email ? { email, id: id ? parseInt(id, 10) : null } : null;
  });
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(token));
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem('airline_token');
    localStorage.removeItem('airline_email');
    localStorage.removeItem('airline_user_id');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  const login = useCallback((jwtToken, email, userId = null) => {
    localStorage.setItem('airline_token', jwtToken);
    if (email) localStorage.setItem('airline_email', email);
    if (userId) localStorage.setItem('airline_user_id', String(userId));

    setToken(jwtToken);
    setUser({ email, id: userId });
    setIsAuthenticated(true);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const verifyToken = async () => {
      const storedToken = localStorage.getItem('airline_token');
      if (storedToken) {
        try {
          const res = await authApi.isAuthenticated();
          if (isMounted) {
            if (res.data?.success) {
              const verifiedUserId = res.data.data;
              const storedEmail = localStorage.getItem('airline_email') || 'passenger@airline.com';
              login(storedToken, storedEmail, verifiedUserId);
            } else {
              logout();
            }
          }
        } catch {
          if (isMounted) {
            logout();
          }
        }
      }
      if (isMounted) {
        setLoading(false);
      }
    };

    verifyToken();
    return () => {
      isMounted = false;
    };
  }, [login, logout]);

  // Auth Action: Sign In
  const signin = async (email, password) => {
    const res = await authApi.signin({ email, password });
    if (res.data?.success) {
      const jwtToken = res.data.data;
      // Fetch verified user ID
      let userId = null;
      try {
        localStorage.setItem('airline_token', jwtToken);
        const verifyRes = await authApi.isAuthenticated();
        if (verifyRes.data?.success) {
          userId = verifyRes.data.data;
        }
      } catch {
        // Fallback
      }
      login(jwtToken, email, userId);
      return res.data;
    }
    throw new Error(res.data?.message || 'Sign in failed');
  };

  // Auth Action: Sign Up
  const signup = async (email, password) => {
    const res = await authApi.signup({ email, password });
    if (res.data?.success) {
      return res.data;
    }
    throw new Error(res.data?.message || 'Sign up failed');
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        userEmail: user?.email || null,
        userId: user?.id || null,
        isAuthenticated,
        loading,
        login,
        logout,
        signin,
        signup,
      }}
    >
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
