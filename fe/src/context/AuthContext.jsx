import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { login as apiLogin, logout as apiLogout } from '../services/api';

const AuthContext = createContext(null);

const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'Admin@123';
const AUTH_KEY = 'ltc_admin_auth';

/**
 * After a successful local login, fetch a real JWT from the backend
 * silently in the background. This allows admin mutations to work
 * once Render finishes waking up, without blocking the login screen.
 */
async function fetchJWTInBackground(username, password) {
  for (let attempt = 0; attempt < 12; attempt++) {
    try {
      const { data } = await apiLogin({ username, password });
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      return; // success
    } catch (err) {
      // If the backend says wrong credentials, stop — something is misconfigured
      if (err.response?.status === 401 || err.response?.status === 422) return;
      // Network error = server still waking, wait 5s and retry
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore session from localStorage on page load
    const saved = localStorage.getItem(AUTH_KEY);
    if (saved === 'true') {
      setUser({ username: 'admin', role: 'admin' });
      // Try to get / refresh JWT silently (backend may still be waking)
      fetchJWTInBackground(ADMIN_USERNAME, ADMIN_PASSWORD);
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    // Instant credential check — no server round-trip needed
    if (
      username.trim().toLowerCase() !== ADMIN_USERNAME ||
      password !== ADMIN_PASSWORD
    ) {
      const err = new Error('Invalid username or password');
      err.response = { status: 401 };
      throw err;
    }

    // Grant access immediately
    localStorage.setItem(AUTH_KEY, 'true');
    setUser({ username: 'admin', role: 'admin' });

    // Fetch real JWT in background so admin mutations work once Render wakes
    fetchJWTInBackground(ADMIN_USERNAME, ADMIN_PASSWORD);
  };

  const logout = async () => {
    try { await apiLogout(); } catch {}
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
