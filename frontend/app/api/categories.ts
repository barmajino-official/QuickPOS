/**
 * @file categories.ts
 * @description API endpoints for managing categories.
 */
import { api } from './client';

export const categoriesApi = {
  list:   ()                      => api.get('/api/categories'),
  create: (body: unknown)         => api.post('/api/categories', body),
  update: (id: number, b: unknown)=> api.put(`/api/categories/${id}`, b),
  remove: (id: number)            => api.del(`/api/categories/${id}`),
};
