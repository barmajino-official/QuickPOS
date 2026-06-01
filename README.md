# QuickPOS Pro

A modern, permission-aware **Point of Sale & inventory management** web app. Full-stack: a React 19 SPA, a .NET 10 REST API, and PostgreSQL — all orchestrated with Docker Compose.

---

## ✨ Features

- **Dashboard** — KPI cards (today's revenue / orders, totals), low-stock & expiring-soon alerts, top products & staff, and a 7-day **revenue + orders trend chart** (Recharts).
- **Point of Sale** — product grid with search (name **or barcode**) and category filter, live cart with stock validation, customer selector, and a transactional checkout that decrements stock atomically.
- **Orders** — history table with a printable receipt modal.
- **Products** — full CRUD with **image upload**, **barcode**, **cost price**, category & brand, expiry tracking, low-stock badges, sortable columns, and **group-by None / Category / Brand**.
- **Brands** — CRUD with brand image, plus a per-brand **analytics page**: units sold, revenue, profit (revenue − cost of goods), stock units, stock value, and inventory budget.
- **Categories / Customers / Staff** — CRUD with search where it helps.
- **Staff & RBAC** — granular per-page permissions stored as JSONB; the backend enforces them **per request from the database**, so permission changes take effect without re-login.
- **Auth** — JWT (BCrypt-hashed passwords), first-time owner setup, live permission sync in the UI.
- **Theming** — Material Design 3 "Montajat" light/dark theme via Tailwind v4 + DaisyUI v5.

---

## 🧱 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 · React Router v7 (SPA) · Tailwind CSS v4 · DaisyUI v5 · Zustand · Recharts · TypeScript |
| Backend | .NET 10 · ASP.NET Core controllers · EF Core 9 (Npgsql) · JWT Bearer · BCrypt |
| Database | PostgreSQL 15 |
| Tooling | Docker Compose · Bun (frontend) · Make |

---

## 🚀 Quick Start

**Prerequisites:** Docker + Docker Compose, and `make`.

```bash
# 1. Start all services (db + backend + frontend)
make up

# 2. First-time database setup (schema + demo seed + migrations)
make db-init

# 3. See where everything is running
make urls
```

Then open **http://localhost:9003**. On the login screen choose **"First time? Set up admin account"** to create the owner — that account gets all permissions.

| Service | URL |
|---|---|
| Frontend | http://localhost:9003 |
| Backend API | http://localhost:9002 (Swagger: `/swagger`) |
| PostgreSQL | localhost:9001 (`pos_iul_db` / `pos_iul_user`) |

---

## 🛠 Make Commands

Run `make help` for the full list. Highlights:

| Command | Description |
|---|---|
| `make up` / `make dev` | Start services (background / foreground) |
| `make rebuild` | Rebuild images after dependency changes |
| `make down` | Stop & remove containers |
| `make logs-be` / `logs-fe` / `logs-db` | Tail a service's logs |
| `make db-init` | Schema + seed + migrations (first run) |
| `make db-reset` | ⚠️ Drop & recreate schema, re-seed |
| `make db-shell` | Interactive `psql` |
| `make fe-typecheck` | TypeScript check (in container, via Bun) |
| `make fe-add PKG="…"` | Add a frontend dependency |
| `make fix-perms` | Fix root-owned files Docker creates |

---

## 📁 Project Structure

```
.
├── backend/                # .NET 10 API
│   ├── Controllers/        #   Auth, Products, Brands, Categories, Customers, Orders, Staff, Dashboard
│   ├── Models/             #   EF Core entities (EntityBase<T> base class)
│   ├── DTOs/               #   request/response records
│   ├── Data/AppDbContext   #   EF Core, two schemas (auth + public), snake_case mapping
│   ├── Services/           #   AuthService (JWT/BCrypt), ImageService (uploads)
│   └── Authorization/      #   PermissionAttribute — per-request DB permission checks
├── frontend/app/           # React Router v7 SPA
│   ├── api/                #   typed API client (proxied /api, /uploads)
│   ├── components/         #   AppLayout, Sidebar, TopBar, SalesTrendChart, …
│   ├── routes/             #   one folder per page
│   ├── store/              #   Zustand stores (session, ui)
│   ├── lib/                #   permissions, usePermissionSync
│   └── types/              #   shared TypeScript types
├── database.sql            # full schema (source of truth)
├── seed.sql                # demo data
├── migrations/             # incremental SQL migrations
├── docker-compose.yml
└── Makefile
```

---

## 🔐 Permissions (RBAC)

Each route is guarded by a `ProtectedRoute` reading the staff member's `permissions` JSONB. Keys: `dashboard`, `pos`, `orders`, `products`, `brands`, `categories`, `customers`, `staff`. Profile is open to any authenticated user. The backend re-checks the **current** permissions from the database on every protected request (`PermissionAttribute`), returning `403` when not allowed.

---

## ⚙️ Configuration

Backend settings are injected via environment variables in `docker-compose.yml`:

- `ConnectionStrings__DefaultConnection` — Postgres connection
- `JwtSettings__Secret` / `__ExpiryHours` / `__DevAuthToken`
- `Uploads__Path` / `__MaxBytes`

> **Before any real deployment**, change the JWT secret, the database password, and the dev auth token — the committed values are local-development placeholders only.

---

## 🗄 Database

`database.sql` is the schema source of truth (schemas `auth` + `public`). Apply incremental changes from `migrations/` via `make db-migrate`. Postgres data lives in the Docker-managed `database/` directory (git-ignored).
