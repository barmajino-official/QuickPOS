/**
 * @file dashboard.ts
 * @description API endpoints for dashboard statistics.
 */
import { api, qs } from './client';

export const dashboardApi = {
  stats: (filters?: Record<string, unknown>) => api.get(`/api/dashboard${qs(filters)}`),
};
