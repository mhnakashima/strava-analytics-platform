import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

export const apiClient = axios.create({ baseURL: BASE_URL });

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('access_token');
      window.location.href = '/';
    }
    return Promise.reject(err);
  }
);

// ── Activities ────────────────────────────────────────────────

export const activitiesApi = {
  list: (params?: Record<string, unknown>) => apiClient.get('/activities', { params }).then((r) => r.data),
  detail: (id: number) => apiClient.get(`/activities/${id}`).then((r) => r.data),
  summary: (params?: Record<string, unknown>) => apiClient.get('/activities/summary', { params }).then((r) => r.data),
  timeline: (params?: Record<string, unknown>) => apiClient.get('/activities/timeline', { params }).then((r) => r.data),
  sync: () => apiClient.post('/activities/sync').then((r) => r.data),
};

// ── Analytics ─────────────────────────────────────────────────

export const analyticsApi = {
  trends: (params?: Record<string, unknown>) => apiClient.get('/analytics/trends', { params }).then((r) => r.data),
  heartrate: (params?: Record<string, unknown>) => apiClient.get('/analytics/heartrate', { params }).then((r) => r.data),
  consistency: (params?: Record<string, unknown>) => apiClient.get('/analytics/consistency', { params }).then((r) => r.data),
  clusters: () => apiClient.get('/analytics/clusters').then((r) => r.data),
  trainingProfile: () => apiClient.get('/analytics/training-profile').then((r) => r.data),
  bestTimes: () => apiClient.get('/analytics/best-times').then((r) => r.data),
  lastActivity: () => apiClient.get('/analytics/last-activity').then((r) => r.data),
  clusterStats: () => apiClient.get('/analytics/cluster-stats').then((r) => r.data),
  clusterTrend: () => apiClient.get('/analytics/cluster-trend').then((r) => r.data),
  trainingReadiness: () => apiClient.get('/analytics/training-readiness').then((r) => r.data),
  yearlyStats: () => apiClient.get('/analytics/yearly').then((r) => r.data),
  monthlyBreakdown: () => apiClient.get('/analytics/monthly').then((r) => r.data),
};

// ── ML ────────────────────────────────────────────────────────

export const mlApi = {
  retrain: () => apiClient.post('/ml/retrain').then((r) => r.data),
};
