/**
 * @file orders.ts
 * @description API endpoints for managing orders.
 */
import { api, qs } from './client';

export const ordersApi = {
  list:   (filters?: Record<string, unknown>) => api.get(`/api/orders${qs(filters)}`),
  get:    (id: number)            => api.get(`/api/orders/${id}`),
  create: (body: unknown)         => api.post('/api/orders', body),
  update: (id: number, b: unknown)=> api.put(`/api/orders/${id}`, b),
  remove: (id: number)            => api.del(`/api/orders/${id}`),
};
