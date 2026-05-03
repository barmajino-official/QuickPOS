import { Routes, Route, Link, useLocation, Navigate } from "react-router";
import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "./lib/auth";
import type { Permissions } from "./lib/types";
import "./output.css";

import { Dashboard } from "./pages/Dashboard";
import { Products } from "./pages/Products";
import { Categories } from "./pages/Categories";
import { Customers } from "./pages/Customers";
import { POS } from "./pages/POS";
import { Orders } from "./pages/Orders";
import { StaffPage } from "./pages/Staff";
import { Profile } from "./pages/Profile";
import { Login } from "./pages/Login";
import {
  IconDashboard,
  IconPOS,
  IconOrders,
  IconProducts,
  IconCategories,
  IconCustomers,
  IconStaff,
  IconSun,
  IconMoon,
} from "./components/Icons";

const NAV_ITEMS = [
  {
    path: "/dashboard",
    id: "dashboard",
    label: "Dashboard",
    icon: IconDashboard,
  },
  { path: "/pos", id: "pos", label: "Point of Sale", icon: IconPOS },
  { path: "/orders", id: "orders", label: "Orders History", icon: IconOrders },
  { path: "/products", id: "products", label: "Inventory", icon: IconProducts },
  {
    path: "/categories",
    id: "categories",
    label: "Categories",
    icon: IconCategories,
  },
  {
    path: "/customers",
    id: "customers",
    label: "Customers",
    icon: IconCustomers,
  },
  { path: "/staff", id: "staff", label: "Staff Management", icon: IconStaff },
] as const;

// Wraps a route and redirects to the first permitted page if permission is denied.
function ProtectedRoute({
  permKey,
  children,
}: {
  permKey: keyof Permissions;
  children: ReactNode;
}) {
  const { permissions } = useAuth();
  if (!permissions?.[permKey]) {
    const first = NAV_ITEMS.find(
      (i) => permissions?.[i.id as keyof Permissions],
    );
    return <Navigate to={first?.path ?? "/profile"} replace />;
  }
  return <>{children}</>;
}

function AppShell() {
  const { session, permissions, signOut } = useAuth();
  const location = useLocation();
  const [theme, setTheme] = useState(
    () => localStorage.getItem("pos-theme") ?? "light",
  );
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("pos-theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));
  const visibleNav = NAV_ITEMS.filter(
    (i) => permissions?.[i.id as keyof Permissions],
  );
  const isActive = (path: string) =>
    location.pathname === path ||
    (path === "/dashboard" && location.pathname === "/");
  const pageLabel =
    NAV_ITEMS.find((i) => i.path === location.pathname)?.label ??
    (location.pathname === "/profile" ? "My Profile" : "");
  const defaultPath = permissions?.dashboard
    ? "/dashboard"
    : (visibleNav[0]?.path ?? "/profile");

  return (
    <div className="drawer lg:drawer-open bg-base-200 min-h-screen font-sans">
      <input id="sidebar" type="checkbox" className="drawer-toggle" />

      <div className="drawer-content flex flex-col h-screen overflow-hidden">
        {/* Navbar */}
        <div className="navbar bg-base-100 border-b border-base-300 sticky top-0 z-30 px-6 py-2 shadow-sm min-h-0 h-14">
          <label
            htmlFor="sidebar"
            className="btn btn-ghost btn-sm btn-square lg:hidden mr-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="h-5 w-5 stroke-current text-base-content"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </label>

          <div className="flex-1 lg:hidden text-lg font-bold text-base-content tracking-tight">
            QuickPOS
          </div>

          <div className="flex-1 hidden lg:flex items-center text-sm font-medium opacity-60 text-base-content gap-4">
            <span>{pageLabel}</span>
            <div className="divider divider-horizontal mx-0 h-4" />
            <span className="font-mono text-xs font-bold">
              {time.toLocaleString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </span>
          </div>

          <div className="flex-none gap-3">
            <label className="swap swap-rotate btn btn-ghost btn-sm btn-circle text-base-content hover:bg-base-200 transition-colors">
              <input
                type="checkbox"
                checked={theme === "dark"}
                onChange={toggleTheme}
              />
              <div className="swap-on flex items-center justify-center">
                {IconMoon}
              </div>
              <div className="swap-off flex items-center justify-center">
                {IconSun}
              </div>
            </label>

            <div className="dropdown dropdown-end">
              <div
                tabIndex={0}
                role="button"
                className="btn btn-ghost btn-sm px-2 gap-2 hover:bg-base-200 transition-colors border border-base-300 rounded-md text-base-content"
              >
                <div className="w-5 h-5 rounded-sm bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase">
                  {session?.user.email?.[0]}
                </div>
                <span className="text-xs font-medium hidden sm:inline-block truncate max-w-[120px]">
                  {session?.user.email}
                </span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="opacity-50"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>
              <ul
                tabIndex={0}
                className="menu menu-sm dropdown-content mt-2 z-1 p-1 shadow-md bg-base-100 rounded-md w-48 border border-base-300"
              >
                <li>
                  <Link
                    to="/profile"
                    className="rounded-sm py-2 text-base-content font-medium"
                  >
                    Account Profile
                  </Link>
                </li>
                <li>
                  <button
                    onClick={signOut}
                    className="text-error rounded-sm py-2 mt-1 hover:bg-error/10 font-medium"
                  >
                    Sign Out
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 bg-base-200/50">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="h-full max-w-7xl mx-auto"
            >
              <Routes location={location}>
                <Route
                  path="/"
                  element={<Navigate to={defaultPath} replace />}
                />
                <Route
                  path="/login"
                  element={<Navigate to={defaultPath} replace />}
                />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute permKey="dashboard">
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/pos"
                  element={
                    <ProtectedRoute permKey="pos">
                      <POS staffId={session!.user.id} />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/orders"
                  element={
                    <ProtectedRoute permKey="orders">
                      <Orders />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/products"
                  element={
                    <ProtectedRoute permKey="products">
                      <Products />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/categories"
                  element={
                    <ProtectedRoute permKey="categories">
                      <Categories />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/customers"
                  element={
                    <ProtectedRoute permKey="customers">
                      <Customers />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/staff"
                  element={
                    <ProtectedRoute permKey="staff">
                      <StaffPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="/profile" element={<Profile />} />
                <Route
                  path="*"
                  element={<Navigate to={defaultPath} replace />}
                />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Sidebar */}
      <div className="drawer-side z-40">
        <label
          htmlFor="sidebar"
          aria-label="close sidebar"
          className="drawer-overlay"
        />
        <aside className="bg-base-100 text-base-content w-64 h-full flex flex-col border-r border-base-300">
          <div className="h-14 flex items-center px-6 border-b border-base-300 bg-base-200/30">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-sm bg-primary flex items-center justify-center text-primary-content font-bold text-xs shadow-sm">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <h1 className="text-base font-bold tracking-tight text-base-content">
                QuickPOS{" "}
                <span className="opacity-50 text-xs font-normal ml-1">Pro</span>
              </h1>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto py-4">
            <div className="px-4 text-[10px] font-bold uppercase tracking-widest text-base-content/50 mb-2">
              Main Menu
            </div>
            <ul className="px-2 space-y-0.5">
              {visibleNav.length === 0 && (
                <div className="px-4 py-2 text-xs opacity-50 italic">
                  No modules available
                </div>
              )}
              {visibleNav.map((item) => {
                const active = isActive(item.path);
                return (
                  <li key={item.path}>
                    <Link to={item.path} className="block group">
                      <div
                        className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm ${active ? "bg-primary/10 text-primary font-bold" : "hover:bg-base-200 text-base-content/80 font-medium"}`}
                      >
                        <span
                          className={`opacity-80 text-base ${active ? "text-primary" : "grayscale group-hover:grayscale-0"}`}
                        >
                          {item.icon}
                        </span>
                        {item.label}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

export function App() {
  const { session, permissions, loading } = useAuth();

  if (loading || (session && !permissions))
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-base-200">
        <span className="loading loading-spinner loading-lg text-primary mb-4" />
        <p className="text-sm font-mono opacity-50 animate-pulse">
          {loading ? "Initializing..." : "Syncing Permissions..."}
        </p>
      </div>
    );

  if (!session)
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );

  return <AppShell />;
}

export default App;
