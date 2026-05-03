import { z } from 'zod';

// ─── Reusable field rules ──────────────────────────────────────────────────
const name   = z.string().min(2, 'Must be at least 2 characters').max(100, 'Too long');
const phone  = z.string().regex(/^[+\d\s\-()]{7,20}$/, 'Invalid phone number').or(z.literal(''));
const email  = z.string().email('Invalid email address').or(z.literal(''));
const price  = z.coerce.number().positive('Price must be greater than 0');
const stock  = z.coerce.number().int('Must be a whole number').min(0, 'Cannot be negative');

// ─── Category ─────────────────────────────────────────────────────────────
export const categorySchema = z.object({
  name:        z.string().min(2, 'Category name must be at least 2 characters').max(60, 'Too long'),
  description: z.string().max(500, 'Max 500 characters').optional().or(z.literal('')),
});
export type CategoryForm = z.infer<typeof categorySchema>;

// ─── Product ──────────────────────────────────────────────────────────────
export const productSchema = z.object({
  name:        z.string().min(2, 'Product name must be at least 2 characters').max(120, 'Too long'),
  price,
  stock,
  category_id: z.string().optional().or(z.literal('')),
  expiry_date: z.string().optional().or(z.literal('')),
});
export type ProductForm = z.infer<typeof productSchema>;

// ─── Customer ─────────────────────────────────────────────────────────────
export const customerSchema = z.object({
  name,
  phone:   phone.optional().or(z.literal('')),
  email:   email.optional().or(z.literal('')),
  address: z.string().max(300, 'Too long').optional().or(z.literal('')),
});
export type CustomerForm = z.infer<typeof customerSchema>;

// ─── Staff ────────────────────────────────────────────────────────────────
export const staffCreateSchema = z.object({
  name:     name,
  email:    z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone:    phone.optional().or(z.literal('')),
  role:     z.enum(['Admin', 'Manager', 'Cashier']),
});
export const staffEditSchema = z.object({
  name:  name,
  phone: phone.optional().or(z.literal('')),
});
export type StaffCreateForm = z.infer<typeof staffCreateSchema>;
export type StaffEditForm   = z.infer<typeof staffEditSchema>;
