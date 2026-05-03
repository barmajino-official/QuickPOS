-- ============================================================
-- QuickPOS Pro — Stable Enterprise Schema (Strict & Robust)
-- Run this completely in your Supabase SQL Editor
-- ============================================================

-- 1. Enable UUID Extension (required for secure IDs and auth)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Clean Up Old Policies Safely (Prevents "Already Exists" Errors)
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "auth_all" ON public.categories;
    DROP POLICY IF EXISTS "auth_all" ON public.products;
    DROP POLICY IF EXISTS "auth_all" ON public.customers;
    DROP POLICY IF EXISTS "auth_all" ON public.staff;
    DROP POLICY IF EXISTS "auth_all" ON public.orders;
    DROP POLICY IF EXISTS "auth_all" ON public.order_items;
    
    DROP POLICY IF EXISTS "auth_upload" ON storage.objects;
    DROP POLICY IF EXISTS "auth_update" ON storage.objects;
    DROP POLICY IF EXISTS "auth_delete" ON storage.objects;
    DROP POLICY IF EXISTS "public_read" ON storage.objects;
EXCEPTION WHEN OTHERS THEN
    -- Ignore if tables or schemas don't exist yet
END $$;

-- 3. Core Tables with Strict Constraints
CREATE TABLE IF NOT EXISTS public.categories (
  id serial PRIMARY KEY,
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.products (
  id serial PRIMARY KEY,
  name text NOT NULL,
  price numeric NOT NULL DEFAULT 0 CHECK (price >= 0),
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  category_id integer REFERENCES public.categories(id) ON DELETE SET NULL,
  image_url text,
  expiry_date date,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.customers (
  id serial PRIMARY KEY,
  name text NOT NULL,
  phone text,
  email text,
  address text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.staff (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  phone text,
  role text NOT NULL DEFAULT 'Cashier',
  permissions jsonb DEFAULT '{"pos": true, "dashboard": false, "products": false, "categories": false, "customers": false, "staff": false, "orders": false}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Safely ensure permissions column exists if you have an older version of the table
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS permissions jsonb DEFAULT '{"pos": true, "dashboard": false, "products": false, "categories": false, "customers": false, "staff": false, "orders": false}'::jsonb;

CREATE TABLE IF NOT EXISTS public.orders (
  id serial PRIMARY KEY,
  total numeric NOT NULL DEFAULT 0 CHECK (total >= 0),
  status text NOT NULL DEFAULT 'Completed',
  customer_id integer REFERENCES public.customers(id) ON DELETE SET NULL,
  staff_id uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.order_items (
  id serial PRIMARY KEY,
  order_id integer NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id integer REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price numeric NOT NULL DEFAULT 0 CHECK (unit_price >= 0)
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies (Full access for authenticated staff)
CREATE POLICY "auth_all" ON public.categories FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON public.products FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON public.customers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON public.staff FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON public.orders FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON public.order_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 6. Storage Policies (Ensure bucket 'product_images' exists and is public via dashboard)
CREATE POLICY "auth_upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product_images');
CREATE POLICY "auth_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'product_images');
CREATE POLICY "auth_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'product_images');
CREATE POLICY "public_read" ON storage.objects FOR SELECT TO public USING (bucket_id = 'product_images');

-- 7. Secure & Stable Staff Creation Function
-- This correctly creates auth.users records exactly how GoTrue expects them (prevents login crashes)
CREATE OR REPLACE FUNCTION public.create_staff(
  staff_email text,
  staff_password text,
  staff_name text,
  staff_phone text DEFAULT NULL,
  staff_role text DEFAULT 'Cashier',
  staff_permissions jsonb DEFAULT '{"pos": true}'::jsonb
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Check if user already exists
  SELECT id INTO new_user_id FROM auth.users WHERE email = staff_email;
  
  -- If not, carefully create the user with all required internal JSON structures
  IF new_user_id IS NULL THEN
    new_user_id := gen_random_uuid();
    
    INSERT INTO auth.users (
      instance_id, id, aud, role, email,
      encrypted_password, email_confirmed_at,
      created_at, updated_at, confirmation_token,
      raw_app_meta_data, raw_user_meta_data,
      is_super_admin, is_sso_user
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      new_user_id, 'authenticated', 'authenticated', staff_email,
      crypt(staff_password, gen_salt('bf')),
      now(), now(), now(), '',
      '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
      false, false
    );
    
    -- Insert into auth.identities to ensure standard Supabase login stability
    INSERT INTO auth.identities (
      id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), new_user_id::text, new_user_id, format('{"sub":"%s","email":"%s"}', new_user_id::text, staff_email)::jsonb, 'email', now(), now(), now()
    );
  END IF;
  
  -- Upsert the public profile securely
  INSERT INTO public.staff (id, name, email, phone, role, permissions)
  VALUES (new_user_id, staff_name, staff_email, staff_phone, staff_role, staff_permissions)
  ON CONFLICT (id) DO UPDATE 
  SET name = EXCLUDED.name, 
      phone = EXCLUDED.phone, 
      role = EXCLUDED.role, 
      permissions = EXCLUDED.permissions;
      
  RETURN new_user_id;
END;
$$;


-- Force PostgREST schema reload instantly to prevent caching issues!
NOTIFY pgrst, 'reload schema';