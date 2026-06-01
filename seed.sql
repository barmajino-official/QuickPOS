-- ==========================================
-- QuickPOS Pro — Seed Data
-- Run AFTER database.sql
-- ==========================================

-- Categories
INSERT INTO public.categories (name, description, created_at) VALUES
  ('Beverages',   'Drinks, juices, water, and soft drinks',     now()),
  ('Dairy',       'Milk, cheese, yogurt, and butter',           now()),
  ('Bakery',      'Bread, pastries, and baked goods',           now()),
  ('Snacks',      'Chips, nuts, and packaged snacks',           now()),
  ('Electronics', 'Batteries, accessories, and small gadgets',  now())
ON CONFLICT DO NOTHING;

-- Products (mix of normal, low-stock, and expiring-soon)
INSERT INTO public.products (name, price, stock, category_id, expiry_date, created_at) VALUES
  -- Beverages
  ('Mineral Water 500ml',    0.75,  120, (SELECT id FROM public.categories WHERE name='Beverages'), NULL,            now()),
  ('Orange Juice 1L',        2.50,    4, (SELECT id FROM public.categories WHERE name='Beverages'), NULL,            now()),  -- low stock
  ('Cola 330ml Can',         1.20,   85, (SELECT id FROM public.categories WHERE name='Beverages'), NULL,            now()),
  ('Green Tea 250ml',        1.80,    3, (SELECT id FROM public.categories WHERE name='Beverages'), NULL,            now()),  -- low stock

  -- Dairy
  ('Full Fat Milk 1L',       1.10,   40, (SELECT id FROM public.categories WHERE name='Dairy'),
     (CURRENT_DATE + INTERVAL '3 days')::date, now()),                                                                        -- expiring soon
  ('Greek Yogurt 200g',      1.50,   22, (SELECT id FROM public.categories WHERE name='Dairy'),
     (CURRENT_DATE + INTERVAL '5 days')::date, now()),                                                                        -- expiring soon
  ('Cheddar Cheese 200g',    3.20,   18, (SELECT id FROM public.categories WHERE name='Dairy'),
     (CURRENT_DATE + INTERVAL '30 days')::date, now()),

  -- Bakery
  ('White Bread 500g',       1.30,   35, (SELECT id FROM public.categories WHERE name='Bakery'),
     (CURRENT_DATE + INTERVAL '4 days')::date, now()),                                                                        -- expiring soon
  ('Croissant',              0.90,    2, (SELECT id FROM public.categories WHERE name='Bakery'),
     (CURRENT_DATE + INTERVAL '2 days')::date, now()),                                                                        -- low stock + expiring

  -- Snacks
  ('Potato Chips 150g',      2.00,   60, (SELECT id FROM public.categories WHERE name='Snacks'), NULL,            now()),
  ('Mixed Nuts 100g',        3.50,    5, (SELECT id FROM public.categories WHERE name='Snacks'), NULL,            now()),     -- low stock (exactly 5)
  ('Dark Chocolate 80g',     2.80,   45, (SELECT id FROM public.categories WHERE name='Snacks'),
     (CURRENT_DATE + INTERVAL '180 days')::date, now()),

  -- Electronics
  ('AA Batteries 4-pack',    4.50,   30, (SELECT id FROM public.categories WHERE name='Electronics'), NULL, now()),
  ('USB-C Cable 1m',         8.99,   15, (SELECT id FROM public.categories WHERE name='Electronics'), NULL, now()),
  ('Phone Screen Cleaner',   3.20,    1, (SELECT id FROM public.categories WHERE name='Electronics'), NULL, now())           -- low stock
ON CONFLICT DO NOTHING;

-- Customers
INSERT INTO public.customers (name, phone, email, address, created_at) VALUES
  ('Ahmed Al-Rashidi',  '+964 770 111 2233', 'ahmed.rashidi@email.com',   '12 Al-Mutanabbi St, Baghdad',    now()),
  ('Sara Khalil',       '+964 750 987 6543', 'sara.khalil@gmail.com',     '7 Palestine St, Erbil',          now()),
  ('Omar Hassan',       '+964 780 321 0987', 'omar.h@outlook.com',        '3 Nidal St, Basra',              now()),
  ('Layla Mahmoud',     '+964 771 456 7890', 'layla.mahmoud@yahoo.com',   '55 Al-Sadoun St, Baghdad',       now()),
  ('Kareem Al-Jabouri', '+964 751 234 5678', 'kareem.j@email.com',        '18 Kirkuk Rd, Sulaymaniyah',     now())
ON CONFLICT DO NOTHING;
