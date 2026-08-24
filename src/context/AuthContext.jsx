import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Parse JWT token payload safely without external dependencies
  const decodeJwt = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('ys_access_token');
    const refreshToken = localStorage.getItem('ys_refresh_token');

    if (token) {
      const payload = decodeJwt(token);
      if (payload && payload.exp * 1000 > Date.now()) {
        const roles = payload.roles || [];
        const primaryRole = roles[0]?.role || 'STUDENT';
        const collegeId = roles[0]?.collegeId || null;
        const deptId = roles[0]?.deptId || null;

        // Verify user has STUDENT role
        if (primaryRole !== 'STUDENT') {
          logout();
          setLoading(false);
          return;
        }

        setUser({
          userId: payload.sub,
          email: payload.email,
          roles,
          primaryRole,
          collegeId,
          deptId,
          token,
          refreshToken,
        });
      } else {
        logout();
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const data = await authApi.login({ email, password });
    if (!data.accessToken) {
      throw new Error('Invalid authentication response from server.');
    }

    const payload = decodeJwt(data.accessToken);
    const roles = data.roles || payload?.roles || [];
    const primaryRole = roles[0]?.role || 'STUDENT';

    // Verify user has STUDENT role (not admin)
    if (primaryRole !== 'STUDENT') {
      throw new Error('Access denied: Administrative accounts must use the Admin Portal.');
    }

    localStorage.setItem('ys_access_token', data.accessToken);
    if (data.refreshToken) {
      localStorage.setItem('ys_refresh_token', data.refreshToken);
    }

    const userObj = {
      userId: data.userId || payload?.sub,
      email: data.email || payload?.email,
      roles,
      primaryRole,
      collegeId: roles[0]?.collegeId || null,
      deptId: roles[0]?.deptId || null,
      token: data.accessToken,
      refreshToken: data.refreshToken,
    };

    setUser(userObj);
    return userObj;
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('ys_refresh_token');
    if (refreshToken) {
      try {
        await authApi.logout(refreshToken);
      } catch (err) {
        console.warn('Logout notification error:', err.message);
      }
    }
    localStorage.removeItem('ys_access_token');
    localStorage.removeItem('ys_refresh_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated: !!user }}>
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