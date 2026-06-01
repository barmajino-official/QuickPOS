/**
 * @file staff.ts
 * @description API endpoints for managing staff members.
 */
import { api, qs } from './client';

export const staffApi = {
  list:   (filters?: Record<string, unknown>) => api.get(`/api/staff${qs(filters)}`),
  create: (body: unknown)         => api.post('/api/staff', body),
  update: (id: string, b: unknown)=> api.put(`/api/staff/${id}`, b),
  remove: (id: string)            => api.del(`/api/staff/${id}`),
};
