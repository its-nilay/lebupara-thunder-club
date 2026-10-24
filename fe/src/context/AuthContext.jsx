import { createContext, useContext, useState, useEffect } from 'react';
import { login as apiLogin, logout as apiLogout } from '../services/api';

const AuthContext = createContext(null);

const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'Admin@123';
const AUTH_KEY = 'ltc_admin_auth';

/**
 * After a successful local login, fetch a real JWT from the backend.
 * Retries every 5s while Render is waking up.
 * Calls onReady() once JWT is obtained.
 */
async function fetchJWTInBackground(username, password, onReady) {
  for (let attempt = 0; attempt < 15; attempt++) {
    try {
      const { data } = await apiLogin({ username, password });
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      onReady?.();
      return;
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 422) return;
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [serverReady, setServerReady] = useState(false); // true once JWT obtained

  useEffect(() => {
    const saved = localStorage.getItem(AUTH_KEY);
    // If already have a token from a previous session, mark ready immediately
    const hasToken = !!localStorage.getItem('access_token');
    if (saved === 'true') {
      setUser({ username: 'admin', role: 'admin' });
      if (hasToken) {
        setServerReady(true);
      } else {
        fetchJWTInBackground(ADMIN_USERNAME, ADMIN_PASSWORD, () => setServerReady(true));
      }
    }
    setLoading(false);
  }, []);

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
    setServerReady(false); // will become true once JWT arrives
    fetchJWTInBackground(ADMIN_USERNAME, ADMIN_PASSWORD, () => setServerReady(true));
  };

  const logout = async () => {
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
