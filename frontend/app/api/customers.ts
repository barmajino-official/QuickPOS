/**
 * @file customers.ts
 * @description API endpoints for managing customers.
 */
import { api, qs } from './client';

export const customersApi = {
  list:   (filters?: Record<string, unknown>) => api.get(`/api/customers${qs(filters)}`),
  create: (body: unknown)         => api.post('/api/customers', body),
  update: (id: number, b: unknown)=> api.put(`/api/customers/${id}`, b),
  remove: (id: number)            => api.del(`/api/customers/${id}`),
};
