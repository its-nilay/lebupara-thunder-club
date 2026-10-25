import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { login as apiLogin, logout as apiLogout } from '../services/api';

const AuthContext = createContext(null);

const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'Admin@123';
const AUTH_KEY = 'ltc_admin_auth';
// Refresh JWT every 20 minutes (token expires at 30 min — stay well ahead)
const JWT_REFRESH_INTERVAL_MS = 20 * 60 * 1000;

/**
 * Fetch a real JWT from the backend. Retries every 5s until it succeeds.
 * Returns true on success, false if credentials were rejected.
 */
async function fetchJWT(onReady) {
  for (let attempt = 0; attempt < 20; attempt++) {
    try {
      const { data } = await apiLogin({ username: ADMIN_USERNAME, password: ADMIN_PASSWORD });
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      onReady?.();
      return true;
    } catch (err) {
      // Wrong credentials — stop immediately (shouldn't happen with hardcoded creds)
      if (err.response?.status === 401 || err.response?.status === 422) return false;
      // Network / server error — wait and retry
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
  return false;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [serverReady, setServerReady] = useState(false);
  const refreshTimerRef = useRef(null);

  /** Start a periodic timer that refreshes the JWT every 20 min */
  const startRefreshTimer = (onReady) => {
    if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    refreshTimerRef.current = setInterval(() => {
      // Re-fetch JWT silently to keep it fresh
      fetchJWT(onReady);
    }, JWT_REFRESH_INTERVAL_MS);
  };

  useEffect(() => {
    const saved = localStorage.getItem(AUTH_KEY);
    const hasToken = !!localStorage.getItem('access_token');

    if (saved === 'true') {
      setUser({ username: 'admin', role: 'admin' });

      const onReady = () => setServerReady(true);

      if (hasToken) {
        // Token already in storage — mark ready, but still start refresh cycle
        setServerReady(true);
        startRefreshTimer(onReady);
      } else {
        // No token yet — fetch it (Render may be waking up)
        fetchJWT(onReady).then(() => startRefreshTimer(onReady));
      }
    }
    setLoading(false);

    return () => {
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    };
  }, []); // eslint-disable-line

  const login = async (username, password) => {
    if (
      username.trim().toLowerCase() !== ADMIN_USERNAME ||
      password !== ADMIN_PASSWORD
    ) {
      const err = new Error('Invalid username or password');
      err.response = { status: 401 };
      throw err;
    }
    localStorage.setItem(AUTH_KEY, 'true');
    setUser({ username: 'admin', role: 'admin' });
    setServerReady(false);

    const onReady = () => setServerReady(true);
    fetchJWT(onReady).then(() => startRefreshTimer(onReady));
  };

  const logout = async () => {
    if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    try { await apiLogout(); } catch {}
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
    setServerReady(false);
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAdmin, serverReady }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
