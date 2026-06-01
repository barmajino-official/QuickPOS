---
name: barmajino-react-guidelines
description: Enforces strict React project architecture, coding conventions, UI theming, component splitting, and file documentation standards. Use this skill whenever the user asks to write, scaffold, refactor, or review any React code — including components, pages, API calls, state management, directory structure, styling, or UI design. Also trigger when the user says things like "add a new page", "create an API call", "add a store", "build a feature", "style this", "make it look clean", or "how should I structure this". This skill defines how ALL React code must be written in this project. Never write React code without consulting it first.
---

# Barmajino React Architecture Guidelines

These are the strict conventions to follow for every React task. No exceptions.

---

## 1. File Documentation Standard

**Every file must start with a JSDoc block comment** explaining what it is, why it exists, and how it works. No file without a header.

```tsx
/**
 * @file ProductCard.tsx
 * @description Displays a single product as a visual card with image, title, price,
 *              and a like button. Used inside the ProductGrid on the shop and home pages.
 *
 * @receives  product  – the full Product object to display
 * @receives  onLike   – callback fired when the user clicks the like button
 *
 * @notes     Does NOT fetch data. All data must be passed via props.
 *            CSS lives in ./ProductCard.css — edit styles there, not inline.
 */
```

**Rules:**
- `@file` — the filename.
- `@description` — what this file does and where it is used.
- `@receives` — each prop (for components) or parameter (for API methods, stores).
- `@notes` — any important constraints, gotchas, or reminders about this file.
- API files describe the domain they cover and the base URL they hit.
- Store files describe what global state they own and who consumes it.

---

## 2. API Integration — `/api/`

**Never** write inline `fetch` or `axios` calls inside components or views. All API calls live in `src/api/` as domain-specific exported objects.

```typescript
/**
 * @file products.ts
 * @description All HTTP endpoints for the Products domain.
 *              Wraps the base `api` client — never call fetch/axios directly.
 *
 * @base-url  /products
 * @notes     Use `qs()` for optional query-string filters.
 *            `remove` sends DELETE. `like`/`unlike` toggle the like state.
 */
import { api, qs } from './client';

export const productsApi = {
  list:        (filters?: Record<string, unknown>)  => api.get(`/products${qs(filters)}`),
  get:         (id: number | string)                => api.get(`/products/${id}`),
  byShop:      (shopId: number | string)            => api.get(`/products/shop/${shopId}`),
  create:      (form: unknown)                      => api.post('/products', form),
  update:      (id: number, form: unknown)          => api.put(`/products/${id}`, form),
  remove:      (id: number)                         => api.del(`/products/${id}`),
  like:        (id: number | string)                => api.post(`/products/${id}/like`),
  unlike:      (id: number | string)                => api.del(`/products/${id}/like`),
  suggestions: (id: number | string, take = 6)      => api.get(`/products/${id}/suggestions?take=${take}`),
};
```

**Rules:**
- One file per domain: `shops.ts`, `products.ts`, `auth.ts`, etc.
- Keep each method on a **single line**, column-aligned for scannability.
- Always import from `./client` — never use raw `fetch`/`axios` directly.

---

## 3. Directory Structure

```
src/
├── api/              # Domain API objects (shops.ts, products.ts, auth.ts …)
├── components/       # Dumb, reusable UI — each in its own sub-directory
│   ├── Button/
│   │   ├── Button.tsx
│   │   └── Button.css
│   └── ProductCard/
│       ├── ProductCard.tsx        # Card shell
│       ├── ProductCard.css
│       ├── ProductCardImage/
│       │   ├── ProductCardImage.tsx
│       │   └── ProductCardImage.css
│       └── ProductCardBody/
│           ├── ProductCardBody.tsx
│           └── ProductCardBody.css
├── store/            # Zustand global stores (session.ts, ui.ts …)
├── types/            # Shared TypeScript interfaces and types
└── views/            # Smart page components, split by section
    └── products/
        ├── ProductsPage.tsx       # Orchestrator — fetches data, composes sections
        ├── ProductsPage.css
        ├── HeroSection/
        │   ├── HeroSection.tsx
        │   └── HeroSection.css
        └── ProductGrid/
            ├── ProductGrid.tsx
            └── ProductGrid.css
```

**Rules:**
- Every component or section lives in its **own sub-directory**.
- Each sub-directory contains exactly **one `.tsx` file + one `.css` file**.
- Nest sub-components inside the parent directory when they only belong to that parent.
- If a sub-component is used in 2+ places → promote it to `src/components/`.

---

## 4. Component & Section Splitting

### When to split into a sub-component
- A repeated element (card, badge, avatar) used more than once → `/components/<Name>/`.
- A page section that has its own visual block (hero, grid, sidebar, footer) → sub-directory inside the view.
- A section longer than ~60 lines of JSX → split it out.

### Example — Products page split

```
views/products/
├── ProductsPage.tsx        ← only imports sections, no JSX markup of its own
├── HeroSection/
│   ├── HeroSection.tsx
│   └── HeroSection.css
└── ProductGrid/
    ├── ProductGrid.tsx     ← renders a grid of <ProductCard />
    └── ProductGrid.css
```

```tsx
/**
 * @file ProductsPage.tsx
 * @description Orchestrates the Products page. Fetches product list from the API
 *              and distributes data down to HeroSection and ProductGrid.
 * @notes  No JSX markup here — only layout composition via section components.
 */
export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => { productsApi.list().then(setProducts); }, []);

  return (
    <main className="products_page">
      <HeroSection />
      <ProductGrid items={products} />
    </main>
  );
}
```

### Example — Nested card split

```
components/ProductCard/
├── ProductCard.tsx          ← shell: receives product prop, composes image + body
├── ProductCard.css
├── ProductCardImage/
│   ├── ProductCardImage.tsx ← renders <img> with overlay badge
│   └── ProductCardImage.css
└── ProductCardBody/
    ├── ProductCardBody.tsx  ← title, price, like button
    └── ProductCardBody.css
```

---

## 5. Tailwind CSS Setup & CSS Rules

### Tailwind is the styling foundation

The project uses **Tailwind CSS** as its main CSS framework. Every `.css` file in the project has access to Tailwind utilities via `@apply`. Never install or import a separate CSS framework.

**`src/index.css`** is the global entry point — it must contain:

```css
/**
 * @file index.css
 * @description Global stylesheet. Imports Tailwind layers and declares
 *              all M3 design tokens as CSS custom properties.
 *              This is the ONLY file allowed to touch the body/root styles.
 */

@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --color-bg:               #F0F4F9;
  --color-surface:          #FFFFFF;
  --color-primary:          #0B57D0;
  --color-on-primary:       #FFFFFF;
  --color-nav-active-bg:    #D3E3FD;
  --color-nav-active-text:  #041E49;
  --color-text-primary:     #1F1F1F;
  --color-text-secondary:   #444746;
  --color-border:           #E0E2E0;
  --color-hover-bg:         #F2F6FC;
}

body {
  @apply font-sans text-sm;
  background-color: var(--color-bg);
  color: var(--color-text-primary);
}
```

**`tailwind.config.js`** must extend the theme with the M3 tokens so they are available as named utilities:

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg:               'var(--color-bg)',
        surface:          'var(--color-surface)',
        primary:          'var(--color-primary)',
        'on-primary':     'var(--color-on-primary)',
        'nav-active-bg':  'var(--color-nav-active-bg)',
        'nav-active-text':'var(--color-nav-active-text)',
        'text-primary':   'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        border:           'var(--color-border)',
        'hover-bg':       'var(--color-hover-bg)',
      },
      fontFamily: {
        sans: ['Inter', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        pill: '9999px',
        card: '24px',
        'card-inner': '16px',
        fab: '16px',
      },
    },
  },
};
```

This means in `@apply` blocks you can write `bg-surface`, `text-text-primary`, `rounded-card`, `rounded-pill` — no magic hex numbers needed.

---

### No Raw Tailwind in JSX

**Never** scatter long Tailwind chains directly on JSX tags. All styling goes into the co-located `.css` file using `@apply`.

```css
/* ProductCardBody.css */

/**
 * Styles for ProductCardBody.
 * Uses M3 surface + spacing tokens.
 * Import this file only in ProductCardBody.tsx.
 */

.card_body {
  @apply flex flex-col gap-2 p-6;
}

.card_title {
  @apply text-sm font-medium text-[#1F1F1F] leading-5;
}

.card_price {
  @apply text-sm text-[#444746];
}

.card_like_btn {
  @apply rounded-full px-4 py-2 text-sm font-medium
         bg-[#D3E3FD] text-[#041E49]
         transition-colors duration-200
         hover:bg-[#0B57D0] hover:text-white;
}
```

```tsx
// ProductCardBody.tsx  ← clean, readable JSX
import './ProductCardBody.css';

export function ProductCardBody({ title, price, onLike }: Props) {
  return (
    <div className="card_body">
      <span className="card_title">{title}</span>
      <span className="card_price">{price}</span>
      <button className="card_like_btn" onClick={onLike}>Like</button>
    </div>
  );
}
```

**Rules:**
- Class names use `snake_case` (e.g. `card_body`, `button_top`, `hero_title`).
- One CSS file per component — never share CSS files between components.
- If a Tailwind chain is longer than 3 utilities → move it to `@apply`.
- Never use inline `style={{}}` for anything that belongs to the visual design.

---

## 6. UI Theme — Material Design 3 (M3)

All UI must follow Google M3 conventions. Use these exact values.

### Color Palette

| Token | Hex | Use |
|---|---|---|
| `--color-bg` | `#F0F4F9` | App body background — never pure white |
| `--color-surface` | `#FFFFFF` | Cards, modals, sidebars |
| `--color-primary` | `#0B57D0` | Solid buttons, checkboxes, active accents |
| `--color-on-primary` | `#FFFFFF` | Text on primary buttons |
| `--color-nav-active-bg` | `#D3E3FD` | Active nav item background |
| `--color-nav-active-text` | `#041E49` | Active nav item text/icon |
| `--color-text-primary` | `#1F1F1F` | Headings, high-emphasis text |
| `--color-text-secondary` | `#444746` | Subtitles, descriptions, inactive icons |
| `--color-border` | `#E0E2E0` | Dividers, card outlines |
| `--color-hover-bg` | `#F2F6FC` | Hover background on list rows |

Declare these in `src/index.css` under `:root {}` and reference them via Tailwind arbitrary values `text-[var(--color-text-primary)]` or directly in CSS files.

### Border Radii

| Element | Value |
|---|---|
| Buttons, nav pills, search bars | `9999px` (full pill) |
| Large cards / modals | `24px` |
| Inner cards / thumbnails | `12px` – `16px` |
| FAB (rectangular) | `16px` |

### Typography

- Font: **Inter** or Roboto. Never system-ui fallbacks in production.
- Headings (H1/H2): weight `400`–`500`, size `24px`–`32px`. Never `700+`.
- Body: `14px`, line-height `20px`, weight `400`.
- Buttons: `14px`, weight `500`, sentence case only ("Sign up" not "SIGN UP").

### Elevation (Shadows)

```css
/* Flat outline — for content lists, file cards */
.surface_flat {
  @apply bg-white border border-[#E0E2E0];
}

/* Soft elevation — for modals, dropdowns, floating headers */
.surface_elevated {
  @apply bg-white;
  box-shadow: 0px 1px 2px 0px rgba(0,0,0,0.3),
              0px 2px 6px 2px rgba(0,0,0,0.15);
}
```

### Hover & Transition

```css
.interactive {
  @apply transition-colors duration-200 ease-in-out;
}
.interactive:hover {
  background-color: #F2F6FC;
}
```

### Spacing — 8pt Grid

Always use multiples of 8 for padding, margins, and gaps: `8px`, `16px`, `24px`, `32px`.
Card internal padding: always `24px`. Page horizontal padding: `24px` desktop, `16px` mobile.

---

## 7. Views (Smart) vs Components (Dumb)

### Views — `/views/`
- Own data fetching, URL params, form state, and submission handlers.
- Compose the page from section sub-components — no raw markup in the page root.
- Each view is split into sections (see §4).

### Components — `/components/`
- Props-only. Zero knowledge of routing, fetching, or global state.
- Reused in 2+ places → lives here.
- Split internally into sub-components when complex (see §4 card example).

---

## 8. State Management

| Scope | Tool | Location |
|---|---|---|
| Single page / form | `useState`, `useReducer` | Inside the view |
| Auth, user role, token | Zustand | `src/store/session.ts` |
| Toasts, modals, overlays | Zustand | `src/store/ui.ts` |

Do not push state to Zustand if it only lives on one screen.

---

## 9. TypeScript Types

- Shared interfaces → `src/types/`.
- File-local one-off types → top of the file that uses them.
- Never `any`. Use `unknown` when shape is truly dynamic.

---

## 10. Code Cleanliness & Ordering Standards

These rules apply to **every single file**, every time, without exception. Clean code is not optional — it is part of the deliverable.

### File Internal Order

Every `.tsx` file must follow this exact top-to-bottom order:

```
1. @file JSDoc header
2. Imports  (grouped, see below)
3. Types / interfaces local to this file
4. Constants (non-reactive, static values)
5. The component function
   └── hooks (useState, useEffect, etc.) — always at the top of the function body
   └── derived values / handlers
   └── return ( JSX )
6. Helper functions used only by this component (below the export)
```

### Import Grouping Order

Always separate imports into groups with a blank line between each:

```tsx
// 1. React core
import { useState, useEffect } from 'react';

// 2. Third-party libraries
import { useParams } from 'react-router-dom';

// 3. Internal — API
import { productsApi } from '@/api/products';

// 4. Internal — Store
import { useSessionStore } from '@/store/session';

// 5. Internal — Components
import { ProductCard } from '@/components/ProductCard/ProductCard';

// 6. Internal — Types
import type { Product } from '@/types/product';

// 7. Styles (always last)
import './ProductsPage.css';
```

### Naming Conventions

| Thing | Convention | Example |
|---|---|---|
| Component | `PascalCase` | `ProductCard` |
| CSS class | `snake_case` | `card_body`, `hero_title` |
| Function / handler | `camelCase` | `handleLike`, `fetchProducts` |
| Constant | `SCREAMING_SNAKE` if static config, `camelCase` if derived | `MAX_ITEMS`, `defaultFilter` |
| API object | `camelCase` + `Api` suffix | `productsApi`, `shopsApi` |
| Store | `camelCase` + `Store` suffix | `sessionStore`, `uiStore` |
| Type / Interface | `PascalCase` | `Product`, `ShopFilters` |

### Spacing & Formatting Rules

- **One blank line** between every logical block inside a function (hooks block, handlers block, return).
- **Two blank lines** between top-level declarations in a file.
- **No trailing spaces**, no commented-out dead code left in files.
- **No `console.log`** left in committed code — use a logger utility if debugging is needed.
- Max line length: **100 characters**. Break long lines — especially JSX props — onto separate lines.
- JSX props: one prop per line when there are 3 or more props on a single element.

```tsx
// ❌ Hard to read
<ProductCard product={item} onLike={handleLike} isActive={true} className="card_item" />

// ✅ Clean
<ProductCard
  product={item}
  onLike={handleLike}
  isActive={true}
  className="card_item"
/>
```

### Handler Naming

All event callbacks must be prefixed with `handle`:

```tsx
// ❌
const likeProduct = () => { ... }
const submit = () => { ... }

// ✅
const handleLike    = () => { ... }
const handleSubmit  = () => { ... }
const handleSearch  = (query: string) => { ... }
```

### No Magic Numbers or Strings

Never hardcode raw values mid-code. Extract them as named constants at the top of the file:

```tsx
// ❌
const items = productsApi.suggestions(id, 6);
setTimeout(fn, 3000);

// ✅
const SUGGESTIONS_COUNT = 6;
const TOAST_DURATION_MS = 3000;

const items = productsApi.suggestions(id, SUGGESTIONS_COUNT);
setTimeout(fn, TOAST_DURATION_MS);
```

### CSS File Ordering

Inside every `.css` file, order rules from outermost to innermost, matching the DOM structure:

```css
/* 1. Container / wrapper */
.card_body { ... }

/* 2. Direct children, top to bottom */
.card_title { ... }
.card_price { ... }

/* 3. Interactive states last */
.card_like_btn { ... }
.card_like_btn:hover { ... }
.card_like_btn:disabled { ... }
```

---

## 11. Pre-Code Checklist

Before writing any file, answer every question:

**Structure**
- [ ] **API call?** → `src/api/<domain>.ts`, single-line, with `@file` header.
- [ ] **New page?** → `src/views/<domain>/PageName.tsx` + split every section into its own sub-dir.
- [ ] **Reused UI element?** → `src/components/<Name>/<Name>.tsx` + `<Name>.css`.
- [ ] **Complex component?** → sub-dirs for each distinct sub-section.
- [ ] **State?** → local `useState` unless truly global → Zustand.

**Styling**
- [ ] **Tailwind config extended** with M3 tokens? → `tailwind.config.js` updated.
- [ ] **Styling in `.css` file** with `@apply`? → no raw Tailwind chains in JSX.
- [ ] **Class names in `snake_case`?** → yes.
- [ ] **Colors/radii/shadows** from M3 token names only (`bg-surface`, `rounded-card` …)?

**Code Quality**
- [ ] **File starts with `@file` JSDoc header?** → yes, always.
- [ ] **Imports grouped and ordered** (React → libs → api → store → components → types → styles)?
- [ ] **File internal order correct** (imports → types → constants → component → helpers)?
- [ ] **Handlers named `handleX`?** → yes.
- [ ] **No magic numbers or strings** — extracted to named constants?
- [ ] **Props on separate lines** when 3 or more?
- [ ] **No `console.log`, no dead commented code, no trailing spaces?**
- [ ] **CSS ordered** outermost → innermost → states?
