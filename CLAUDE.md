# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**QuickPOS Pro** — a Point of Sale and inventory management web app with RBAC.  
The codebase is in early development; `app_idea.md` describes the full target architecture.

### Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + React Router v7 (SSR mode) + Tailwind CSS v4 + DaisyUI v5 |
| Backend | .NET 10 minimal API |
| Database | PostgreSQL 15 |
| Runtime | Bun (frontend), Docker Compose for all services |

---

## React / Frontend Guidelines

**Always invoke the `barmajino-react-guidelines` skill before writing, scaffolding, or reviewing any React code.**  
That skill is the single source of truth for all frontend conventions (directory structure, API layer, component splitting, CSS rules, naming, ordering, etc.).

### Directory mapping (skill → this project)

The skill uses `src/` as its root. This project uses React Router v7 framework mode, so the mapping is:

| Skill path | This project |
|---|---|
| `src/api/` | `frontend/app/api/` |
| `src/components/` | `frontend/app/components/` |
| `src/store/` | `frontend/app/store/` |
| `src/types/` | `frontend/app/types/` |
| `src/views/<page>/` | `frontend/app/routes/<page>/` |

Route modules live in `frontend/app/routes/` and are declared in `frontend/app/routes.ts`.  
The path alias `~/` maps to `frontend/app/` (configured in `tsconfig.json`).

### CSS / Theming — Tailwind v4 + DaisyUI v5

> **Critical difference from the skill's §5**: This project uses **Tailwind CSS v4**, which has no `tailwind.config.js`. All configuration is CSS-only.

- Global stylesheet: `frontend/app/app.css` — the only file that imports Tailwind and declares the theme.
- DaisyUI v5 is loaded via `@plugin "daisyui";` in `app.css`.
- The M3 "Montajat" theme is declared via `@plugin "daisyui/theme" { name: "montajat"; ... }` — two variants: `montajat` (light) and `montajat-dark` (dark, activates on `prefers-color-scheme: dark`).
- Custom utilities (`m3-elevation-1/2/3`, `m3-nav-pill-active`, `m3-interactive`, `animate-fade-up`, `animate-page-enter`) are already defined in `app.css`.
- Refer to the DaisyUI token names (`primary`, `secondary`, `base-100`, etc.) in component CSS files — not raw hex values.
- No `tailwind.config.js` should ever be created for this project.

### Fonts

The project uses **Roboto Flex** / Roboto (not Inter). Load via Google Fonts in `root.tsx`.

---

## Running the Project

Everything runs through Docker Compose:

```bash
docker compose up          # start all services (db + backend + frontend)
docker compose up --build  # rebuild images first
docker compose down        # stop and remove containers
```

Service ports:
- **PostgreSQL**: `localhost:9001`
- **Backend API**: `localhost:9002`
- **Frontend (Vite dev)**: `localhost:9003`

Hot-reload is active for both services via volume mounts: `dotnet watch` for backend, Vite HMR for frontend.

## One-time Bootstrap (first setup only)

```bash
make setup-all   # creates project scaffolding and installs deps via Docker
```

> After running `make setup-all`, Docker creates files as root. Fix ownership before editing:
> ```bash
> sudo chown -R barmajino:barmajinopc frontend backend uploads
> sudo chmod 750 database && sudo chgrp barmajinopc database
> ```

## Database Schema Reset

Set `Database__Reset=true` in the backend environment in `docker-compose.yml`, restart the backend, confirm the seed ran, then set it back to `false`.

## Frontend Development (outside Docker)

```bash
cd frontend
bun run dev          # local dev server
bun run build        # production build
bun run typecheck    # type generation + tsc check
```

## Backend Development (outside Docker)

```bash
cd backend
dotnet watch run     # hot-reload dev server
dotnet restore       # restore NuGet packages
```

OpenAPI is exposed at `/openapi/v1.json` in development.  
Connection string, uploads path, Gemini API key, and JWT dev token are injected via environment variables (see `docker-compose.yml`). Uploaded images are bind-mounted at `./uploads/`.

---

## Architecture (Target — see `app_idea.md`)

**9 pages with RBAC** — each route guarded by a `ProtectedRoute` component reading a `permissions` JSONB field on the `staff` record.

| Route | Permission key |
|---|---|
| `/dashboard` | `dashboard` |
| `/pos` | `pos` |
| `/orders` | `orders` |
| `/products` | `products` |
| `/categories` | `categories` |
| `/customers` | `customers` |
| `/staff` | `staff` |
| `/profile` | *(all authenticated)* |

**Auth flow**: React Context (`AuthProvider`) monitors the active session, loads the staff profile from the DB, and caches the permissions object.  
**Staff creation**: A secondary API client instance must be used when creating new staff so the currently-logged-in admin is not signed out.

**POS checkout sequence**:
1. Validate stock locally before adding to cart.
2. Insert `orders` row.
3. Insert `order_items` rows.
4. Decrement stock via `decrement_stock` stored procedure (or direct update).

**Validation**: Zod schemas for all forms (products, categories, customers).

## Database

Schema source of truth: `database.sql`. Apply it once against the PostgreSQL container to initialise.

Key tables: `auth.users`, `public.staff`, `public.categories`, `public.products`, `public.customers`, `public.orders`, `public.order_items`.

`staff.permissions` is a `JSONB` column; keys match the permission grid above.

> The `database/` directory is owned by the postgres process (uid 70) inside Docker. Do not manually edit its contents. To reset: `sudo rm -rf database && docker compose up`.
