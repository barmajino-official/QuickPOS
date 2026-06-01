-- ==========================================
-- 1. SCHEMAS & SEQUENCES
-- ==========================================
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS public;

CREATE SEQUENCE IF NOT EXISTS public.categories_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.customers_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.brands_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.products_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.orders_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.order_items_id_seq;

-- ==========================================
-- 2. AUTHENTICATION (Base Dependency)
-- ==========================================
CREATE TABLE auth.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text UNIQUE,
  encrypted_password text,
  email_confirmed_at timestamp with time zone,
  last_sign_in_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id)
);

-- ==========================================
-- 3. INDEPENDENT TABLES (No Foreign Keys)
-- ==========================================
CREATE TABLE public.categories (
  id integer NOT NULL DEFAULT nextval('categories_id_seq'::regclass),
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT categories_pkey PRIMARY KEY (id)
);

CREATE TABLE public.customers (
  id integer NOT NULL DEFAULT nextval('customers_id_seq'::regclass),
  name text NOT NULL,
  phone text,
  email text,
  address text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT customers_pkey PRIMARY KEY (id)
);

CREATE TABLE public.brands (
  id integer NOT NULL DEFAULT nextval('brands_id_seq'::regclass),
  name text NOT NULL,
  phone text,
  email text,
  link text,
  image_url text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT brands_pkey PRIMARY KEY (id)
);

-- ==========================================
-- 4. 1st-LEVEL DEPENDENCIES
-- ==========================================
CREATE TABLE public.products (
  id integer NOT NULL DEFAULT nextval('products_id_seq'::regclass),
  name text NOT NULL,
  price numeric NOT NULL DEFAULT 0 CHECK (price >= 0::numeric),
  cost numeric NOT NULL DEFAULT 0 CHECK (cost >= 0::numeric),
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  category_id integer,
  brand_id integer,
  barcode text,
  image_url text,
  expiry_date date,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT products_pkey PRIMARY KEY (id),
  CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id),
  CONSTRAINT products_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE SET NULL
);

CREATE TABLE public.staff (
  id uuid NOT NULL,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  phone text,
  role text NOT NULL DEFAULT 'Cashier'::text,
  permissions jsonb DEFAULT '{"pos": true, "staff": false, "orders": false, "brands": false, "products": false, "customers": false, "dashboard": false, "categories": false}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT staff_pkey PRIMARY KEY (id),
  CONSTRAINT staff_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);

-- ==========================================
-- 5. 2nd-LEVEL DEPENDENCIES
-- ==========================================
CREATE TABLE public.orders (
  id integer NOT NULL DEFAULT nextval('orders_id_seq'::regclass),
  total numeric NOT NULL DEFAULT 0 CHECK (total >= 0::numeric),
  status text NOT NULL DEFAULT 'Completed'::text,
  customer_id integer,
  staff_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id),
  CONSTRAINT orders_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.staff(id)
);

-- ==========================================
-- 6. 3rd-LEVEL DEPENDENCIES
-- ==========================================
CREATE TABLE public.order_items (
  id integer NOT NULL DEFAULT nextval('order_items_id_seq'::regclass),
  order_id integer NOT NULL,
  product_id integer,
  product_name text NOT NULL,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price numeric NOT NULL DEFAULT 0 CHECK (unit_price >= 0::numeric),
  CONSTRAINT order_items_pkey PRIMARY KEY (id),
  CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id),
  CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);