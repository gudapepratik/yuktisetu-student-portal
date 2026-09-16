import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { authApi } from '../api/auth';
import { refreshAuthToken } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const refreshTimerRef = useRef(null);

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

  const cancelProactiveRefresh = useCallback(() => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, []);

  // Refreshes the access token ~60s before it actually expires, so a logged
  // in user's session renews silently instead of always waiting for a 401.
  // Failure here is not fatal by itself -- the next real request will hit
  // the reactive 401-refresh path in api/client.js and log the user out if
  // the refresh token itself has also gone bad.
  const scheduleProactiveRefresh = useCallback((expSeconds) => {
    cancelProactiveRefresh();
    const delayMs = Math.max(expSeconds - 60, 30) * 1000;
    refreshTimerRef.current = setTimeout(async () => {
      try {
        await refreshAuthToken();
        const newToken = localStorage.getItem('ys_access_token');
        const payload = newToken ? decodeJwt(newToken) : null;
        if (payload?.exp) {
          scheduleProactiveRefresh(payload.exp - Math.floor(Date.now() / 1000));
        }
      } catch {
        // swallowed -- the reactive 401 path handles a truly dead session
      }
    }, delayMs);
  }, [cancelProactiveRefresh]);

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
        scheduleProactiveRefresh(payload.exp - Math.floor(Date.now() / 1000));
      } else {
        logout();
      }
    }
    setLoading(false);

    return () => cancelProactiveRefresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A refresh attempt (proactive or reactive) exhausted the refresh token
  // too -- api/client.js dispatches this instead of importing React state
  // directly. Reset local user state so the SPA falls back to the Login view.
  useEffect(() => {
    const handleExpired = () => {
      cancelProactiveRefresh();
      setUser(null);
    };
    window.addEventListener('ys:auth-expired', handleExpired);
    return () => window.removeEventListener('ys:auth-expired', handleExpired);
  }, [cancelProactiveRefresh]);

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
    if (payload?.exp) {
      scheduleProactiveRefresh(payload.exp - Math.floor(Date.now() / 1000));
    }
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
    cancelProactiveRefresh();
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
