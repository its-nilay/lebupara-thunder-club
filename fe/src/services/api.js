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
} from './mockData';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
  timeout: 6000,
});

// Attach JWT token from localStorage
api.interceptors.request.use((config) => {
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
      if (refresh) {
        try {
          const { data } = await axios.post(
            `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/auth/refresh`,
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
 * Executes an API call with automatic fallback to built-in seed data
 * if the backend is unreachable (e.g. unconfigured Vercel environment or offline).
 */
const withFallback = async (apiCall, fallbackFn) => {
  try {
    return await apiCall();
  } catch (err) {
    if (!err.response || err.code === 'ERR_NETWORK' || err.message === 'Network Error' || err.code === 'ECONNABORTED') {
      return fallbackFn();
    }
    throw err;
  }
};

// Public endpoints with graceful fallback
export const getHealth = () => api.get('/api/health');
export const getLeague = () => withFallback(() => api.get('/api/league'), getMockLeague);
export const getStandings = () => withFallback(() => api.get('/api/standings'), getMockStandings);
export const getTopScorers = () => withFallback(() => api.get('/api/top-scorers'), getMockTopScorers);
export const getMatches = () => withFallback(() => api.get('/api/matches'), getMockMatches);
export const getMatch = (id) => api.get(`/api/matches/${id}`);
export const getPlayers = (params) => withFallback(() => api.get('/api/players', { params }), getMockPlayers);
export const getPlayer = (id) => api.get(`/api/players/${id}`);
export const getDashboardStats = () => withFallback(() => api.get('/api/dashboard/stats'), getMockDashboardStats);

// Auth
export const login = async (data) => {
  try {
    return await api.post('/api/auth/login', data);
  } catch (err) {
    if (!err.response || err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
      return mockLogin(data.username, data.password);
    }
    throw err;
  }
};

export const logout = async () => {
  try {
    await api.post('/api/auth/logout');
  } catch {
    // Ignore network failure on logout
  }
};

export const getMe = async () => {
  try {
    return await api.get('/api/auth/me');
  } catch (err) {
    const token = localStorage.getItem('access_token');
    if (token && token.startsWith('demo-admin-token-')) {
      return getMockMe();
    }
    throw err;
  }
};

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
