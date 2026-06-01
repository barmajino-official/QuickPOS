/**
 * @file routes.ts
 * @description Application route configuration.
 *              The index route redirects to /dashboard (handled by LoginPage
 *              which auto-redirects if authenticated).
 */
import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/login/LoginPage.tsx", { id: "index" }),
  route("/login", "routes/login/LoginPage.tsx"),
  route("/dashboard", "routes/dashboard/DashboardPage.tsx"),
  route("/pos", "routes/pos/PosPage.tsx"),
  route("/orders", "routes/orders/OrdersPage.tsx"),
  route("/products", "routes/products/ProductsPage.tsx"),
  route("/brands", "routes/brands/BrandsPage.tsx"),
  route("/brands/:id", "routes/brands/BrandDetailPage.tsx"),
  route("/categories", "routes/categories/CategoriesPage.tsx"),
  route("/customers", "routes/customers/CustomersPage.tsx"),
  route("/staff", "routes/staff/StaffPage.tsx"),
  route("/profile", "routes/profile/ProfilePage.tsx"),
] satisfies RouteConfig;
