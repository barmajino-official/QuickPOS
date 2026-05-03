import {
  Routes,
  Route,
  Link,
  useNavigate,
  useLocation,
  Navigate,
} from "react-router";
import { useEffect, useState, useRef } from "react";
import { supabase } from "./lib/supabase";
import { AnimatePresence, motion } from "framer-motion";
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

// SVG Icons
const IconDashboard = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect width="7" height="9" x="3" y="3" rx="1" />
    <rect width="7" height="5" x="14" y="3" rx="1" />
    <rect width="7" height="9" x="14" y="12" rx="1" />
    <rect width="7" height="5" x="3" y="16" rx="1" />
  </svg>
);
const IconPOS = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="8" cy="21" r="1" />
    <circle cx="19" cy="21" r="1" />
    <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
  </svg>
);
const IconOrders = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" x2="8" y1="13" y2="13" />
    <line x1="16" x2="8" y1="17" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);
const IconProducts = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m7.5 4.27 9 5.15" />
    <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
    <path d="m3.3 7 8.7 5 8.7-5" />
    <path d="M12 22V12" />
  </svg>
);
const IconCategories = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
    <path d="M7 7h.01" />
  </svg>
);
const IconCustomers = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const IconStaff = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <circle cx="19" cy="11" r="2" />
    <path d="M19 8v1" />
    <path d="M19 13v1" />
    <path d="m21.6 9.5-.87.5" />
    <path d="m17.27 12-.87.5" />
    <path d="m21.6 12.5-.87-.5" />
    <path d="m17.27 10-.87-.5" />
  </svg>
);
const IconSun = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2" />
    <path d="M12 20v2" />
    <path d="m4.93 4.93 1.41 1.41" />
    <path d="m17.66 17.66 1.41 1.41" />
    <path d="M2 12h2" />
    <path d="M20 12h2" />
    <path d="m6.34 17.66-1.41 1.41" />
    <path d="m19.07 4.93-1.41 1.41" />
  </svg>
);
const IconMoon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
  </svg>
);

const allNavItems = [
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
];

export function App() {
  console.log("App: Rendering...");
  const [session, setSession] = useState<any>(null);
  const [permissions, setPermissions] = useState<Permissions | null>(null);
  const [loading, setLoading] = useState(true);
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const initialized = useRef(false);
  const lastUserRef = useRef<string | null>(null);
  const [theme, setTheme] = useState(
    () => localStorage.getItem("pos-theme") || "light",
  );
  const navigate = useNavigate();
  const location = useLocation();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Removed interval to prevent full-app re-renders every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("pos-theme", theme);
  }, [theme]);

  const loadPermissions = async (userId: string) => {
    if (lastUserRef.current === userId && permissions) return;
    if (permissionsLoading) return;
    
    try {
      lastUserRef.current = userId;
      console.log("Fetching permissions for user:", userId);
      setPermissionsLoading(true);
    const { data: staffData, error } = await supabase
      .from("staff")
      .select("permissions, role")
      .eq("id", userId)
      .single();
    if (error) {
      console.error("Staff fetch error:", error);
      setPermissions({
        dashboard: false,
        pos: true,
        orders: false,
        products: false,
        categories: false,
        customers: false,
        staff: false,
      });
    } else if (staffData?.role === "Admin") {
      setPermissions({
        dashboard: true,
        pos: true,
        orders: true,
        products: true,
        categories: true,
        customers: true,
        staff: true,
      });
    } else if (staffData?.permissions) {
      setPermissions(staffData.permissions);
    } else {
      setPermissions({
        dashboard: false,
        pos: true,
        orders: false,
        products: false,
        categories: false,
        customers: false,
        staff: false,
      });
    }
    } finally {
      setPermissionsLoading(false);
    }
  };

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    async function init() {
      console.log("App: Running init...");
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();
      
      if (currentSession?.user) {
        setSession(currentSession);
        await loadPermissions(currentSession.user.id);
      }
      setLoading(false);
    }
    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, s) => {
      console.log("App: Auth event:", event);
      setSession(s);
      if (s?.user) {
        await loadPermissions(s.user.id);
      } else {
        setPermissions(null);
        lastUserRef.current = null;
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  if (loading || (session && !permissions && permissionsLoading))
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-base-200">
        <span className="loading loading-spinner loading-lg text-primary mb-4"></span>
        <p className="text-sm font-mono opacity-50 animate-pulse">
          {loading ? "Initializing App..." : "Syncing Permissions..."}
        </p>
      </div>
    );

  if (!session)
    return (
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route
            path="/login"
            element={<Login theme={theme} toggleTheme={toggleTheme} />}
          />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AnimatePresence>
    );

  const visibleNavItems = permissions
    ? allNavItems.filter((item) => (permissions as any)[item.id] === true)
    : [];
  const isActive = (path: string) =>
    path === "/dashboard"
      ? location.pathname === "/" || location.pathname === "/dashboard"
      : location.pathname === path;

  const currentNav = allNavItems.find((i) => i.path === location.pathname);
  if (currentNav && permissions && !(permissions as any)[currentNav.id]) {
    const firstPermitted = visibleNavItems[0]?.path || "/profile";
    return <Navigate to={firstPermitted} replace />;
  }

  return (
    <div className="drawer lg:drawer-open bg-base-200 min-h-screen font-sans">
      <input id="sidebar" type="checkbox" className="drawer-toggle" />
      <div className="drawer-content flex flex-col h-screen overflow-hidden">
        {/* Top Navbar */}
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
            <span>
              {currentNav
                ? currentNav.label
                : location.pathname === "/profile"
                  ? "My Profile"
                  : ""}
            </span>
            <div className="divider divider-horizontal mx-0 h-4"></div>
            <span className="font-mono text-xs font-bold">
              {currentTime.toLocaleString("en-US", {
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
                  {session.user.email?.[0]}
                </div>
                <span className="text-xs font-medium hidden sm:inline-block truncate max-w-[120px]">
                  {session.user.email}
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
                    onClick={async () => {
                      await supabase.auth.signOut();
                      navigate("/login");
                    }}
                    className="text-error rounded-sm py-2 mt-1 hover:bg-error/10 font-medium"
                  >
                    Sign Out
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
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
                {permissions?.dashboard && (
                  <Route path="/dashboard" element={<Dashboard />} />
                )}
                {permissions?.dashboard && (
                  <Route
                    path="/"
                    element={<Navigate to="/dashboard" replace />}
                  />
                )}
                {permissions?.pos && (
                  <Route
                    path="/pos"
                    element={<POS staffId={session.user.id} />}
                  />
                )}
                {!permissions?.dashboard && permissions?.pos && (
                  <Route path="/" element={<Navigate to="/pos" replace />} />
                )}
                {permissions?.orders && (
                  <Route path="/orders" element={<Orders />} />
                )}
                {permissions?.products && (
                  <Route path="/products" element={<Products />} />
                )}
                {permissions?.categories && (
                  <Route path="/categories" element={<Categories />} />
                )}
                {permissions?.customers && (
                  <Route path="/customers" element={<Customers />} />
                )}
                {permissions?.staff && (
                  <Route path="/staff" element={<StaffPage />} />
                )}
                <Route path="/profile" element={<Profile />} />
                <Route
                  path="*"
                  element={
                    <Navigate
                      to={visibleNavItems[0]?.path || "/profile"}
                      replace
                    />
                  }
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
        ></label>
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
              {visibleNavItems.length === 0 && (
                <div className="px-4 py-2 text-xs opacity-50 italic">
                  No modules available
                </div>
              )}
              {visibleNavItems.map((item) => {
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

export default App;
