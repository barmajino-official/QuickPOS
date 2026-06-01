# Roadmap — Proxy, Brands, Barcode, Filters

**Date:** 2026-06-01
**Status:** Phase A in progress; B–E pending their own specs/plans.

Decisions captured from brainstorming:
- Brand detail page shows **all** metrics: units sold, total revenue, stock left (units), stock value.
- **Cost price** is added to products → enables profit (revenue − cost of goods sold) and inventory budget (stock × cost). "Budget" = inventory budget of a brand's remaining stock.
- Build order: **A → (B + C) → D → E**.

---

## Phase A — Proxy + relative URLs  *(current)*

**Goal:** Stop hardcoding the backend origin; serve `/api` and `/uploads` same-origin through the Vite dev proxy.

- `frontend/vite.config.ts`: add
  ```ts
  server: {
    proxy: {
      '/api':     { target: 'http://backend:8080', changeOrigin: true },
      '/uploads': { target: 'http://backend:8080', changeOrigin: true },
    },
    hmr: { overlay: false },
  }
  ```
  Target is the compose **service name** `backend:8080` (internal port), because the frontend runs in a container — `localhost` there is the frontend, not the backend.
- `frontend/app/api/client.ts`: `BASE_URL = ''` (relative). All calls become `/api/...`; images become `/uploads/...`, both proxied. No CORS needed.
- Image helpers keep using `` `${BASE_URL}${url}` `` which now yields a relative `/uploads/...`.

---

## Phase B — Barcode

- `products.barcode text` column (nullable, unique optional).
- Product model/DTO/form/table get `barcode`.
- Products `GET ?search=` matches name **or** barcode; POS search matches name **or** barcode (exact scan support).

## Phase C — Brands

- New `public.brands` table: `id serial pk, name text not null, phone text, email text, link text, created_at timestamptz`.
- `products.brand_id integer` FK → brands(id) ON DELETE SET NULL.
- `products.cost numeric not null default 0 check (cost >= 0)` (cost price).
- Brands CRUD page (table + modal), brand selector + cost field in the product form.
- API module `brands.ts`, `BrandsController`.

## Phase D — Brand analytics

- `GET /api/brands/{id}/analytics` returns:
  - `unitsSold` = Σ order_items.quantity for this brand's products
  - `revenue` = Σ (order_items.unit_price × quantity)
  - `costOfSold` = Σ (products.cost × order_items.quantity)
  - `profit` = revenue − costOfSold
  - `stockUnits` = Σ products.stock
  - `stockValue` = Σ (products.stock × products.price)
  - `inventoryBudget` = Σ (products.stock × products.cost)
- Brand detail view renders these as KPI cards + the brand's product list.

## Phase E — Filters

- Products list: filter by category, brand, stock status (in/low/out) + search (name/barcode).
- POS: add brand filter alongside the existing category filter + barcode search.
