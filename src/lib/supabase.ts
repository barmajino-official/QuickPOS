import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = 'https://educonnect.barmajino.com';
export const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzc3NzU5MTEzLCJleHAiOjE5MzU0MzkxMTN9.mfhsjnnOWgXBk4o3L2mtoXu9f0V_giP2-U0UK957a6g';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // 🛑 This bypasses the native navigator.locks which is currently causing loops
    lock: async (_name, _acquireTimeout, fn) => {
      return await fn();
    },
  },
});