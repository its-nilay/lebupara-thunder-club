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

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
  timeout: 20000,
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
      if (refresh && !refresh.startsWith('demo-')) {
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
 * Executes an API call with automatic fallback to built-in seed/offline engine
 * if the backend is unreachable (e.g. unconfigured Vercel environment or offline server).
 */
const withFallback = async (apiCall, fallbackFn) => {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('access_token') : null;
  const isDemoToken = token && token.startsWith('demo-admin-token-');
  const isRemoteHost = typeof window !== 'undefined' &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1';
  const hasConfiguredBackend = Boolean(
    import.meta.env.VITE_API_BASE_URL &&
    !import.meta.env.VITE_API_BASE_URL.includes('localhost')
  );

  // If running in demo mode or deployed on Vercel without a configured remote backend,
  // invoke the local fallback engine immediately without failing on localhost:8000.
  if ((isDemoToken || (isRemoteHost && !hasConfiguredBackend)) && fallbackFn) {
    return fallbackFn();
  }

  try {
    return await apiCall();
  } catch (err) {
    const isNetworkError =
      !err.response ||
      err.code === 'ERR_NETWORK' ||
      err.message === 'Network Error' ||
      err.code === 'ECONNABORTED' ||
      (err.response?.status === 404 && !hasConfiguredBackend);

    if (isNetworkError && fallbackFn) {
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

// Auth
export const login = async (data) => {
  const isRemoteHost = typeof window !== 'undefined' &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1';
  const hasConfiguredBackend = Boolean(
    import.meta.env.VITE_API_BASE_URL &&
    !import.meta.env.VITE_API_BASE_URL.includes('localhost')
  );

  if (isRemoteHost && !hasConfiguredBackend) {
    return mockLogin(data.username, data.password);
  }

  try {
    return await api.post('/api/auth/login', data);
  } catch (err) {
    if (!err.response || err.code === 'ERR_NETWORK' || err.message === 'Network Error' || err.code === 'ECONNABORTED') {
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
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('access_token') : null;
  if (token && token.startsWith('demo-admin-token-')) {
    return getMockMe();
  }
  try {
    return await api.get('/api/auth/me');
  } catch (err) {
    if (token && token.startsWith('demo-admin-token-')) {
      return getMockMe();
    }
    if (!err.response || err.code === 'ERR_NETWORK' || err.message === 'Network Error' || err.code === 'ECONNABORTED') {
      return getMockMe();
    }
    throw err;
  }
};

export const refreshToken = (refresh_token) => api.post('/api/auth/refresh', { refresh_token });

// Admin - Matches
export const adminCreateMatch = (data) =>
  withFallback(() => api.post('/api/admin/matches', data), () => mockAddNextMatch());
export const adminAddNextMatch = () =>
  withFallback(() => api.post('/api/admin/matches/add-next'), mockAddNextMatch);
export const adminDeleteMatch = (id) =>
  withFallback(() => api.delete(`/api/admin/matches/${id}`), () => mockDeleteMatch(id));
export const adminUpdateMatch = (id, data) =>
  withFallback(() => api.patch(`/api/admin/matches/${id}`, data), () => mockUpdateMatch(id, data));
export const adminSaveResult = (id, data) =>
  withFallback(() => api.put(`/api/admin/matches/${id}/result`, data), () => mockSaveResult(id, data));
export const adminCompleteMatch = (id, data) =>
  withFallback(() => api.post(`/api/admin/matches/${id}/complete`, data), () => mockCompleteMatch(id, data));
export const adminReopenMatch = (id) =>
  withFallback(() => api.post(`/api/admin/matches/${id}/reopen`), () => mockReopenMatch(id));
export const adminPostponeMatch = (id) =>
  withFallback(() => api.post(`/api/admin/matches/${id}/postpone`), () => mockPostponeMatch(id));

// Admin - Players
export const adminCreatePlayer = (data) =>
  withFallback(() => api.post('/api/admin/players', data), () => mockCreatePlayer(data));
export const adminUpdatePlayer = (id, data) =>
  withFallback(() => api.patch(`/api/admin/players/${id}`, data), () => mockUpdatePlayer(id, data));

// Admin - Teams & League
export const adminCreateTeam = (data) =>
  withFallback(() => api.post('/api/admin/teams', data), () => mockCreateTeam(data));
export const adminUpdateTeam = (id, data) =>
  withFallback(() => api.patch(`/api/admin/teams/${id}`, data), () => mockUpdateTeam(id, data));
export const adminUpdateLeague = (data) =>
  withFallback(() => api.patch('/api/admin/league', data), () => mockUpdateLeague(data));
export const adminResetSeason = () =>
  withFallback(() => api.post('/api/admin/league/reset-season'), mockResetSeason);

// Admin - Audit
export const getAuditLogs = (params) =>
  withFallback(() => api.get('/api/admin/audit-logs', { params }), () => mockGetAuditLogs(params));

export default api;
