import axios from 'axios';

const BACKEND_URL = 'https://lebupara-thunder-club.onrender.com';

export const getActiveApiUrl = () => {
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem('ltc_backend_url');
    if (custom && custom.trim()) {
      return custom.trim().replace(/\/+$/, '');
    }
  }
  if (import.meta.env.VITE_API_BASE_URL && import.meta.env.VITE_API_BASE_URL.trim()) {
    return import.meta.env.VITE_API_BASE_URL.trim().replace(/\/+$/, '');
  }
  return BACKEND_URL;
};

const api = axios.create({
  baseURL: getActiveApiUrl(),
  headers: { 'Content-Type': 'application/json' },
  timeout: 45000,
  withCredentials: false, // JWT is in Authorization header; cookies not needed
});

// Always use latest baseURL and attach JWT
api.interceptors.request.use((config) => {
  config.baseURL = getActiveApiUrl();
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401, try token refresh once. On failure, reject cleanly (don't clear tokens/redirect).
// AuthContext handles proactive JWT refresh every 20 min so this should rarely trigger.
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      const refresh = localStorage.getItem('refresh_token');
      if (refresh) {
        try {
          const { data } = await axios.post(
            `${getActiveApiUrl()}/api/auth/refresh`,
            { refresh_token: refresh }
          );
          localStorage.setItem('access_token', data.access_token);
          localStorage.setItem('refresh_token', data.refresh_token);
          error.config.headers.Authorization = `Bearer ${data.access_token}`;
          return api(error.config);
        } catch {
          // Refresh failed (server may be restarting) — do NOT clear tokens.
          // AuthContext's periodic refresh will get a new JWT shortly.
        }
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Wait until a valid JWT is in localStorage (background fetch from AuthContext).
 * Admin mutations call this so they don't fire before the server has authenticated.
 * Times out after 60s and proceeds anyway (will get a real error from the server).
 */
const waitForJWT = () =>
  new Promise((resolve) => {
    const token = localStorage.getItem('access_token');
    if (token) return resolve();
    const start = Date.now();
    const poll = setInterval(() => {
      if (localStorage.getItem('access_token') || Date.now() - start > 60000) {
        clearInterval(poll);
        resolve();
      }
    }, 500);
  });

// Health / wakeup
export const getHealth = () => api.get('/api/health');

/**
 * Wake the server by polling /api/health until it responds.
 */
export const wakeServer = (onStatus) => {
  const url = getActiveApiUrl();
  let cancelled = false;
  let timer = null;
  const startTime = Date.now();

  const attempt = async () => {
    try {
      const res = await fetch(`${url}/api/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(8000),
      });
      if (!cancelled && res.ok) {
        onStatus?.('online');
        return;
      }
    } catch {}

    if (cancelled) return;
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    onStatus?.('waking', elapsed);

    if (Date.now() - startTime < 120000) {
      timer = setTimeout(attempt, 4000);
    } else {
      onStatus?.('timeout');
    }
  };

  attempt();

  return () => {
    cancelled = true;
    if (timer) clearTimeout(timer);
  };
};

// Public data endpoints — always from real backend for cross-device sync
export const getLeague = () => api.get('/api/league');
export const getStandings = () => api.get('/api/standings');
export const getTopScorers = () => api.get('/api/top-scorers');
export const getMatches = () => api.get('/api/matches');
export const getMatch = (id) => api.get(`/api/matches/${id}`);
export const getPlayers = (params) => api.get('/api/players', { params });
export const getPlayer = (id) => api.get(`/api/players/${id}`);
export const getDashboardStats = () => api.get('/api/dashboard/stats');

// Auth login — used by background JWT fetcher in AuthContext
export const login = async (data) => {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return await api.post('/api/auth/login', data);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 422 || err.response?.status === 400) {
        throw err;
      }
      if (attempt < 4) await new Promise((r) => setTimeout(r, 5000));
      else throw err;
    }
  }
};

export const logout = async () => {
  try { await api.post('/api/auth/logout'); } catch {}
};

export const getMe = () => api.get('/api/auth/me');
export const refreshToken = (refresh_token) => api.post('/api/auth/refresh', { refresh_token });

// ─── Admin mutations — wait for JWT before firing ───────────────────────────
// This ensures they work even if Render is still waking up when user logs in.

export const adminCreateMatch = async (data) => { await waitForJWT(); return api.post('/api/admin/matches', data); };
export const adminAddNextMatch = async () => { await waitForJWT(); return api.post('/api/admin/matches/add-next'); };
export const adminDeleteMatch = async (id) => { await waitForJWT(); return api.delete(`/api/admin/matches/${id}`); };
export const adminUpdateMatch = async (id, data) => { await waitForJWT(); return api.patch(`/api/admin/matches/${id}`, data); };
export const adminSaveResult = async (id, data) => { await waitForJWT(); return api.put(`/api/admin/matches/${id}/result`, data); };
export const adminCompleteMatch = async (id, data) => { await waitForJWT(); return api.post(`/api/admin/matches/${id}/complete`, data); };
export const adminReopenMatch = async (id) => { await waitForJWT(); return api.post(`/api/admin/matches/${id}/reopen`); };
export const adminPostponeMatch = async (id) => { await waitForJWT(); return api.post(`/api/admin/matches/${id}/postpone`); };

export const adminCreatePlayer = async (data) => { await waitForJWT(); return api.post('/api/admin/players', data); };
export const adminUpdatePlayer = async (id, data) => { await waitForJWT(); return api.patch(`/api/admin/players/${id}`, data); };

export const adminCreateTeam = async (data) => { await waitForJWT(); return api.post('/api/admin/teams', data); };
export const adminUpdateTeam = async (id, data) => { await waitForJWT(); return api.patch(`/api/admin/teams/${id}`, data); };
export const adminUpdateLeague = async (data) => { await waitForJWT(); return api.patch('/api/admin/league', data); };
export const adminResetSeason = async () => { await waitForJWT(); return api.post('/api/admin/league/reset-season'); };

export const getAuditLogs = (params) => api.get('/api/admin/audit-logs', { params });

export default api;
