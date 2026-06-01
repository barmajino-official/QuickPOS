-- ============================================================
-- Migration: brands table + product barcode / cost / brand_id
-- Idempotent — safe to run on an existing database.
-- ============================================================

CREATE SEQUENCE IF NOT EXISTS public.brands_id_seq;

CREATE TABLE IF NOT EXISTS public.brands (
  id integer NOT NULL DEFAULT nextval('brands_id_seq'::regclass),
  name text NOT NULL,
  phone text,
  email text,
  link text,
  image_url text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT brands_pkey PRIMARY KEY (id)
);

ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS image_url text;

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS barcode text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS cost numeric NOT NULL DEFAULT 0 CHECK (cost >= 0);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS brand_id integer;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_brand_id_fkey') THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_brand_id_fkey
      FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS products_barcode_idx ON public.products (barcode);

-- ── One-time backfill (only runs while data is still unset) ──────────

INSERT INTO public.brands (name, phone, email, link)
SELECT * FROM (VALUES
  ('Nestle',     '+1 800 555 0101', 'contact@nestle.example',   'https://nestle.example'),
  ('Coca-Cola',  '+1 800 555 0102', 'contact@cocacola.example', 'https://cocacola.example'),
  ('Generic Co', '+1 800 555 0103', 'hello@generic.example',    'https://generic.example')
) AS v(name, phone, email, link)
WHERE NOT EXISTS (SELECT 1 FROM public.brands);

-- Give existing products a cost (~60% of price) and assign a brand.
UPDATE public.products SET cost = ROUND(price * 0.6, 2) WHERE cost = 0;

UPDATE public.products p SET brand_id = (
  SELECT id FROM public.brands ORDER BY id LIMIT 1 OFFSET (p.id % 3)
) WHERE brand_id IS NULL;

-- Sample barcodes for existing products that lack one (13-digit EAN-like).
UPDATE public.products
SET barcode = LPAD((6400000000000 + id)::text, 13, '0')
WHERE barcode IS NULL;
