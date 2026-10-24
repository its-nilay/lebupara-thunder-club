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

// Purge any stale demo tokens
if (typeof localStorage !== 'undefined') {
  try {
    const token = localStorage.getItem('access_token');
    if (token && token.startsWith('demo-admin-token-')) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
  } catch {}
}

const api = axios.create({
  baseURL: getActiveApiUrl(),
  headers: { 'Content-Type': 'application/json' },
  timeout: 45000,
});

// Always use the latest baseURL and attach JWT token
api.interceptors.request.use((config) => {
  config.baseURL = getActiveApiUrl();
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      const refresh = localStorage.getItem('refresh_token');
      if (refresh && !refresh.startsWith('demo-')) {
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
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Health / wakeup
export const getHealth = () => api.get('/api/health');

/**
 * Wake the server by polling /api/health until it responds.
 * Called on app startup so all subsequent data fetches hit the live DB.
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

// Public data endpoints — always fetch from real backend (no mock fallback)
// This ensures data is always in sync across all devices and browsers.
export const getLeague = () => api.get('/api/league');
export const getStandings = () => api.get('/api/standings');
export const getTopScorers = () => api.get('/api/top-scorers');
export const getMatches = () => api.get('/api/matches');
export const getMatch = (id) => api.get(`/api/matches/${id}`);
export const getPlayers = (params) => api.get('/api/players', { params });
export const getPlayer = (id) => api.get(`/api/players/${id}`);
export const getDashboardStats = () => api.get('/api/dashboard/stats');

// Auth
export const login = (data) => api.post('/api/auth/login', data);

export const logout = async () => {
  try {
    await api.post('/api/auth/logout');
  } catch {}
};

export const getMe = () => api.get('/api/auth/me');
export const refreshToken = (refresh_token) => api.post('/api/auth/refresh', { refresh_token });

// Admin - Matches
export const adminCreateMatch = (data) => api.post('/api/admin/matches', data);
export const adminAddNextMatch = () => api.post('/api/admin/matches/add-next');
export const adminDeleteMatch = (id) => api.delete(`/api/admin/matches/${id}`);
export const adminUpdateMatch = (id, data) => api.patch(`/api/admin/matches/${id}`, data);
export const adminSaveResult = (id, data) => api.put(`/api/admin/matches/${id}/result`, data);
export const adminCompleteMatch = (id, data) => api.post(`/api/admin/matches/${id}/complete`, data);
export const adminReopenMatch = (id) => api.post(`/api/admin/matches/${id}/reopen`);
export const adminPostponeMatch = (id) => api.post(`/api/admin/matches/${id}/postpone`);

// Admin - Players
export const adminCreatePlayer = (data) => api.post('/api/admin/players', data);
export const adminUpdatePlayer = (id, data) => api.patch(`/api/admin/players/${id}`, data);

// Admin - Teams & League
export const adminCreateTeam = (data) => api.post('/api/admin/teams', data);
export const adminUpdateTeam = (id, data) => api.patch(`/api/admin/teams/${id}`, data);
export const adminUpdateLeague = (data) => api.patch('/api/admin/league', data);
export const adminResetSeason = () => api.post('/api/admin/league/reset-season');

// Admin - Audit
export const getAuditLogs = (params) => api.get('/api/admin/audit-logs', { params });

export default api;
