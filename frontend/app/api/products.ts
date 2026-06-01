/**
 * @file products.ts
 * @description API endpoints for managing products.
 */
import { api, qs } from './client';

export const productsApi = {
  list:        (filters?: Record<string, unknown>) => api.get(`/api/products${qs(filters)}`),
  create:      (body: unknown)          => api.post('/api/products', body),
  update:      (id: number, b: unknown) => api.put(`/api/products/${id}`, b),
  remove:      (id: number)             => api.del(`/api/products/${id}`),
  uploadImage: (id: number, file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.upload(`/api/products/${id}/image`, fd);
  },
};
