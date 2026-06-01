# Frontend Phase 1 — Foundation + Login Design

**Date:** 2026-06-01
**Stack:** React 19 · React Router v7 (SPA mode) · Tailwind CSS v4 · DaisyUI v5 · Zustand · TypeScript
**Backend:** QuickPOS Pro API on `http://localhost:9002`
**Guidelines:** All code follows `barmajino-react-guidelines` — JSDoc headers, `app/` root, CSS-only styling, snake_case classes, Zustand for global state.

---

## 1. Config Changes

| File | Change |
|---|---|
| `frontend/react-router.config.ts` | `ssr: false` — pure SPA, all API calls from browser |
| `frontend/app/app.css` | Already has M3 montajat theme — copy root `app.css` here, add `@plugin "daisyui";` |
| `frontend/package.json` | Add `zustand`, `daisyui` |

---

## 2. Directory Structure

```
frontend/app/
├── api/
│   ├── client.ts          ← base fetch wrapper with JWT injection + 401 handler
│   ├── auth.ts            ← login, register, me
│   ├── categories.ts
│   ├── customers.ts
│   ├── dashboard.ts
│   ├── orders.ts
│   ├── products.ts
│   └── staff.ts
├── store/
│   ├── sessionStore.ts    ← token, staff profile, permissions
│   └── uiStore.ts         ← toasts, active modal key
├── types/
│   └── index.ts           ← all shared TypeScript interfaces
├── components/
│   ├── AppLayout/
│   │   ├── AppLayout.tsx
│   │   ├── AppLayout.css
│   │   ├── Sidebar/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Sidebar.css
│   │   │   └── NavItem/
│   │   │       ├── NavItem.tsx
│   │   │       └── NavItem.css
│   │   └── TopBar/
│   │       ├── TopBar.tsx
│   │       └── TopBar.css
│   └── ProtectedRoute/
│       ├── ProtectedRoute.tsx
│       └── ProtectedRoute.css
└── routes/
    └── login/
        ├── LoginPage.tsx
        └── LoginPage.css
```

---

## 3. Types (`app/types/index.ts`)

```ts
export interface StaffProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: Record<string, boolean>;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  staff: StaffProfile;
}

export interface Category {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  categoryId: number | null;
  imageUrl: string | null;
  expiryDate: string | null;
  createdAt: string;
  category: Category | null;
}

export interface Customer {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  createdAt: string;
}

export interface OrderItem {
  id: number;
  productId: number | null;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: number;
  total: number;
  status: string;
  customerId: number | null;
  customerName: string | null;
  staffId: string | null;
  staffName: string | null;
  createdAt: string;
  items?: OrderItem[];
}

export interface Staff {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  permissions: Record<string, boolean>;
  createdAt: string;
}

export interface DashboardStats {
  todayRevenue: number;
  todayOrderCount: number;
  totalProducts: number;
  totalCustomers: number;
  lowStockProducts: { id: number; name: string; stock: number }[];
  expiringSoon: { id: number; name: string; expiryDate: string; stock: number }[];
  topProducts: { id: number; name: string; totalSold: number }[];
  topStaff: { id: string; name: string; orderCount: number }[];
}
```

---

## 4. API Client (`app/api/client.ts`)

- Base URL: `http://localhost:9002`
- Reads JWT from `sessionStore` on every request
- Sets `Authorization: Bearer <token>` and `Content-Type: application/json`
- On **401** response: clears `sessionStore`, redirects to `/login`
- Exports: `api.get(path)`, `api.post(path, body)`, `api.put(path, body)`, `api.del(path)`
- `qs(filters?)` helper: converts `{ categoryId: 1 }` → `?categoryId=1`, returns `''` if filters is empty/undefined

---

## 5. Session Store (`app/store/sessionStore.ts`)

```ts
interface SessionState {
  token: string | null;
  staff: StaffProfile | null;
  setSession: (token: string, staff: StaffProfile) => void;
  clearSession: () => void;
  hasPermission: (key: string) => boolean;
}
```

- Persisted to `localStorage` key `pos_session` using Zustand `persist` middleware
- `hasPermission(key)` returns `staff?.permissions[key] === true`

---

## 6. UI Store (`app/store/uiStore.ts`)

```ts
interface UiState {
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  clearToast: () => void;
}
```

Toast auto-dismisses after 3 seconds. Used by all pages for feedback on save/delete/error.

---

## 7. API Modules

All files in `app/api/`, one per domain, single-line methods, column-aligned:

```ts
// auth.ts
export const authApi = {
  login:    (body: { email: string; password: string })    => api.post('/api/auth/login', body),
  register: (body: { name: string; email: string; password: string; phone?: string }) => api.post('/api/auth/register', body),
  me:       ()                                              => api.get('/api/auth/me'),
};

// categories.ts
export const categoriesApi = {
  list:   ()                      => api.get('/api/categories'),
  create: (body: unknown)         => api.post('/api/categories', body),
  update: (id: number, b: unknown)=> api.put(`/api/categories/${id}`, b),
  remove: (id: number)            => api.del(`/api/categories/${id}`),
};
// (similar pattern for products, customers, orders, staff, dashboard)
```

---

## 8. AppLayout + Sidebar

`AppLayout` wraps all authenticated pages: fixed left sidebar (240px) + scrollable main area.

**Sidebar nav items** (hidden if `permissions[key] !== true`):

| Label | Permission key | Route |
|---|---|---|
| Dashboard | `dashboard` | `/dashboard` |
| Point of Sale | `pos` | `/pos` |
| Orders | `orders` | `/orders` |
| Products | `products` | `/products` |
| Categories | `categories` | `/categories` |
| Customers | `customers` | `/customers` |
| Staff | `staff` | `/staff` |
| My Profile | *(all users)* | `/profile` |

Active item: `m3-nav-pill-active` class (pill shape, `--color-secondary` bg).
Bottom: user avatar (initials), name, role chip, Logout button.
`TopBar` shows current page title + optional action buttons (passed as props).

---

## 9. ProtectedRoute

```tsx
<ProtectedRoute permission="products">
  <ProductsPage />
</ProtectedRoute>
```

- No session → redirect `/login`
- Session but `permission` prop not satisfied → redirect to first permitted route (or `/profile`)
- `permission` prop optional — omit for profile (any authenticated user)

---

## 10. Login Page (`/login`)

Sections:
- **Header**: brand name "QuickPOS Pro" + theme toggle (DaisyUI `data-theme` toggle between `montajat` / `montajat-dark`)
- **Card**: email + password inputs, Sign in button, error alert if login fails
- **First-time setup toggle**: link to switch to register mode (name + email + password); always visible — if setup is already complete the backend returns 403, which surfaces as an error alert

On success: store token + staff in `sessionStore`, redirect to first permitted page.

---

## 11. Routes (`app/routes.ts`)

```ts
export default [
  index('routes/login/LoginPage.tsx'),
  route('/login', 'routes/login/LoginPage.tsx'),
  route('/dashboard', 'routes/dashboard/DashboardPage.tsx'),
  route('/pos', 'routes/pos/PosPage.tsx'),
  route('/orders', 'routes/orders/OrdersPage.tsx'),
  route('/products', 'routes/products/ProductsPage.tsx'),
  route('/categories', 'routes/categories/CategoriesPage.tsx'),
  route('/customers', 'routes/customers/CustomersPage.tsx'),
  route('/staff', 'routes/staff/StaffPage.tsx'),
  route('/profile', 'routes/profile/ProfilePage.tsx'),
] satisfies RouteConfig;
```

Phases 2–4 pages are stub components until implemented.

---

## 12. root.tsx changes

- Load Roboto Flex from Google Fonts (matches `app.css` font stack)
- Render a `<Toast />` component that reads from `uiStore` (global toast overlay)
- Remove default welcome page link
