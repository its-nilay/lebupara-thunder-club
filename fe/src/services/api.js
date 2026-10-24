import axios from 'axios';
import {
  getMockLeague,
  getMockStandings,
  getMockTopScorers,
  getMockMatches,
  getMockPlayers,
  getMockDashboardStats,
  mockLogin,
  getMockMe,
  mockResetSeason,
  mockUpdateLeague,
  mockAddNextMatch,
  mockDeleteMatch,
  mockUpdateMatch,
  mockSaveResult,
  mockCompleteMatch,
  mockReopenMatch,
  mockPostponeMatch,
  mockCreateTeam,
  mockUpdateTeam,
  mockCreatePlayer,
  mockUpdatePlayer,
  mockGetAuditLogs,
} from './mockData';

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
  return 'https://lebupara-thunder-club.onrender.com';
};

export const hasActiveBackend = () => {
  return true;
};

// Purge any stale demo tokens so user always authenticates with real cloud JWT
if (typeof localStorage !== 'undefined') {
  try {
    const token = localStorage.getItem('access_token');
    if (token && token.startsWith('demo-admin-token-')) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
  } catch {}
}

export const setCustomApiUrl = (url) => {
  if (typeof window !== 'undefined') {
    if (url && url.trim()) {
      const clean = url.trim().replace(/\/+$/, '');
      localStorage.setItem('ltc_backend_url', clean);
      api.defaults.baseURL = clean;
    } else {
      localStorage.removeItem('ltc_backend_url');
      api.defaults.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
    }
  }
};

export const testBackendConnection = async (targetUrl) => {
  const url = (targetUrl || getActiveApiUrl()).replace(/\/+$/, '');
  const res = await axios.get(`${url}/api/health`, { timeout: 20000 });
  return res.data?.status === 'ok' || res.data?.status === 'healthy';
};

const api = axios.create({
  baseURL: getActiveApiUrl(),
  headers: { 'Content-Type': 'application/json' },
  timeout: 45000,
});

// Attach JWT token from localStorage and ensure latest baseURL
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

/**
 * Executes an API call with automatic fallback to built-in seed/offline engine
 * if no cloud backend is configured or if the server is temporarily waking up.
 */
const withFallback = async (apiCall, fallbackFn) => {
  const isBackendConfigured = hasActiveBackend();
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('access_token') : null;
  const isDemoToken = token && token.startsWith('demo-admin-token-');

  // If a live cloud backend is configured, attempt the live API call first so that
  // changes are stored centrally in the database and visible across all devices (PC, Mobile, etc.).
  if (isBackendConfigured) {
    try {
      return await apiCall();
    } catch (err) {
      // If the token is a demo token, the live backend will reject it with 401.
      if (err.response?.status === 401 && isDemoToken) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      }

      const isNetworkError =
        !err.response ||
        err.code === 'ERR_NETWORK' ||
        err.message === 'Network Error' ||
        err.code === 'ECONNABORTED';

      if (isNetworkError && fallbackFn) {
        return fallbackFn();
      }
      throw err;
    }
  }

  // If no live cloud backend is configured at all, run in local offline mode
  if (fallbackFn) {
    return fallbackFn();
  }
  return apiCall();
};

// Public endpoints with graceful fallback
export const getHealth = () => api.get('/api/health');
export const getLeague = () => withFallback(() => api.get('/api/league'), getMockLeague);
export const getStandings = () => withFallback(() => api.get('/api/standings'), getMockStandings);
export const getTopScorers = () => withFallback(() => api.get('/api/top-scorers'), getMockTopScorers);
export const getMatches = () => withFallback(() => api.get('/api/matches'), getMockMatches);
export const getMatch = (id) =>
  withFallback(
    () => api.get(`/api/matches/${id}`),
    () => {
      const { data } = getMockMatches();
      const match = data.find((m) => m.id === Number(id));
      return { data: match };
    }
  );
export const getPlayers = (params) => withFallback(() => api.get('/api/players', { params }), getMockPlayers);
export const getPlayer = (id) =>
  withFallback(
    () => api.get(`/api/players/${id}`),
    () => {
      const { data } = getMockPlayers();
      const player = data.find((p) => p.id === Number(id));
      return { data: player };
    }
  );
export const getDashboardStats = () => withFallback(() => api.get('/api/dashboard/stats'), getMockDashboardStats);

// Auth — no retry loop; Login page handles wakeup and only calls this when server is ready
export const login = async (data) => {
  return await api.post('/api/auth/login', data);
};

export const logout = async () => {
  try {
    await api.post('/api/auth/logout');
  } catch {
    // Ignore network failure on logout
  }
};

export const getMe = async () => {
  return await api.get('/api/auth/me');
};

export const refreshToken = (refresh_token) => api.post('/api/auth/refresh', { refresh_token });

// Admin - Matches (Direct live backend execution ensures immediate cloud sync across all devices)
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
export const getAuditLogs = (params) =>
  withFallback(() => api.get('/api/admin/audit-logs', { params }), () => mockGetAuditLogs(params));

export default api;
