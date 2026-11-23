import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api.js';
import { isTokenValid, parseJwt } from '../utils/jwt.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    const savedToken = localStorage.getItem('salon_auth_token');
    return isTokenValid(savedToken) ? savedToken : null;
  });

  const [user, setUser] = useState(() => {
    try {
      const savedToken = localStorage.getItem('salon_auth_token');
      if (!isTokenValid(savedToken)) {
        localStorage.removeItem('salon_auth_token');
        localStorage.removeItem('salon_auth_user');
        return null;
      }
      const savedUser = localStorage.getItem('salon_auth_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(true);

  // Validate session on app launch
  useEffect(() => {
    const savedToken = localStorage.getItem('salon_auth_token');

    if (!savedToken || !isTokenValid(savedToken)) {
      logout();
      setLoading(false);
      return;
    }

    // Verify token with backend /auth/me
    api
      .get('/auth/me')
      .then((res) => {
        if (res.data?.data) {
          setUser(res.data.data);
          setToken(savedToken);
          localStorage.setItem('salon_auth_user', JSON.stringify(res.data.data));
        }
      })
      .catch(() => {
        logout();
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token: jwtToken, user: userData } = res.data.data;

    // Validate that returned token is a valid JWT
    if (!isTokenValid(jwtToken)) {
      throw new Error('Received invalid or expired token from authentication server');
    }

    localStorage.setItem('salon_auth_token', jwtToken);
    localStorage.setItem('salon_auth_user', JSON.stringify(userData));

    setToken(jwtToken);
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('salon_auth_token');
    localStorage.removeItem('salon_auth_user');
    setToken(null);
    setUser(null);
  };

  // Inspect JWT token claims
  const tokenClaims = token ? parseJwt(token) : null;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        tokenClaims,
        loading,
        login,
        logout,
        isAuthenticated: !!user && !!token,
        isAdmin: user?.role === 'ADMIN',
        isReceptionist: user?.role === 'RECEPTIONIST' || user?.role === 'ADMIN',
        isBarber: user?.role === 'BARBER',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
