/**
 * @file brands.ts
 * @description All HTTP endpoints for the Brands domain. Wraps the base `api` client.
 *
 * @base-url  /api/brands
 * @notes     Reads are allowed for products- or pos-permitted users; writes require
 *            the products permission (enforced server-side).
 */
import { api } from './client';

export const brandsApi = {
  list:      ()                      => api.get('/api/brands'),
  get:       (id: number)            => api.get(`/api/brands/${id}`),
  analytics: (id: number)            => api.get(`/api/brands/${id}/analytics`),
  create:    (body: unknown)         => api.post('/api/brands', body),
  update:    (id: number, b: unknown)=> api.put(`/api/brands/${id}`, b),
  remove:    (id: number)            => api.del(`/api/brands/${id}`),
  uploadImage: (id: number, file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.upload(`/api/brands/${id}/image`, fd);
  },
};
