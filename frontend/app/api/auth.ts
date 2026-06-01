/**
 * @file auth.ts
 * @description Authentication API methods.
 */
import { api } from './client';

export const authApi = {
  login:    (body: { email: string; password: string })    => api.post('/api/auth/login', body),
  register: (body: { name: string; email: string; password: string; phone?: string }) => api.post('/api/auth/register', body),
  me:       ()                                              => api.get('/api/auth/me'),
};
