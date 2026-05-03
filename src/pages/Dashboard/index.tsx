import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export interface DashboardData {
  totalProducts: number;
  totalOrders: number;
  todayRevenue: number;
  totalCustomers: number;
  lowStockProducts: any[];
  expiringProducts: any[];
  topProducts: any[];
  topStaff: any[];
}

export function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadStep, setLoadStep] = useState("Initializing...");

  useEffect(() => {
    async function load() {
      try {
        console.log("Dashboard: Starting data load...");
        setLoading(true);
        setError(null);
        setLoadStep("Checking inventory...");

        const today = new Date().toISOString().split("T")[0];
        const nextWeek = new Date(Date.now() + 7 * 86400000)
          .toISOString()
          .split("T")[0];

        const [
          prod,
          ord,
          todayOrd,
          cust,
          lowStock,
          expiring,
          topProd,
          topStaffData,
        ] = await Promise.all([
          supabase.from("products").select("*", { count: "exact", head: true }),
          supabase.from("orders").select("*", { count: "exact", head: true }),
          supabase
            .from("orders")
            .select("total")
            .gte("created_at", today + "T00:00:00"),
          supabase
            .from("customers")
            .select("*", { count: "exact", head: true }),
          supabase
            .from("products")
            .select("id, name, stock")
            .lte("stock", 5)
            .order("stock")
            .limit(10),
          supabase
            .from("products")
            .select("id, name, expiry_date")
            .not("expiry_date", "is", null)
            .lte("expiry_date", nextWeek)
            .order("expiry_date")
            .limit(10),
          supabase.from("order_items").select("product_name, quantity"),
          supabase.from("orders").select("staff_id, staff(name)"),
        ]);
        setLoadStep("Processing metrics...");

        if (prod.error || ord.error) {
          console.error("Database query failed:", prod.error || ord.error);
          throw new Error(
            "Database schema error. Please run NOTIFY pgrst, 'reload schema' in your SQL editor.",
          );
        }

        const revenue = (todayOrd.data || []).reduce(
          (s, o) => s + Number(o.total),
          0,
        );

        const prodMap: Record<string, number> = {};
        (topProd.data || []).forEach((i: any) => {
          prodMap[i.product_name] = (prodMap[i.product_name] || 0) + i.quantity;
        });
        const topProducts = Object.entries(prodMap)
          .map(([name, qty]) => ({ name, qty }))
          .sort((a, b) => b.qty - a.qty)
          .slice(0, 5);

        const staffMap: Record<string, { name: string; count: number }> = {};
        (topStaffData.data || []).forEach((o: any) => {
          if (o.staff_id && o.staff) {
            if (!staffMap[o.staff_id])
              staffMap[o.staff_id] = { name: o.staff.name, count: 0 };
            staffMap[o.staff_id]!.count++;
          }
        });
        const topStaff = Object.values(staffMap)
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        setData({
          totalProducts: prod.count || 0,
          totalOrders: ord.count || 0,
          todayRevenue: revenue,
          totalCustomers: cust.count || 0,
          lowStockProducts: lowStock.data || [],
          expiringProducts: (expiring.data || []).filter(
            (p: any) => p.expiry_date,
          ),
          topProducts,
          topStaff,
        });
      } catch (err: any) {
        console.error("Dashboard Load Error:", err);
        setError(
          err.message ||
            "Failed to load dashboard data. Check your connection.",
        );
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-fade-in">
        <div className="text-4xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-error mb-2">Failed to Load</h2>
        <p className="text-base-content/60 text-sm max-w-md">{error}</p>
        <button
          className="btn btn-primary btn-sm mt-6"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="flex flex-col h-full items-center justify-center space-y-4">
        <span className="loading loading-spinner loading-lg text-primary"></span>
        <p className="text-sm font-mono opacity-50 animate-pulse">{loadStep}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="flex justify-between items-end mb-4 border-b border-base-300 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-base-content">
            Dashboard Overview
          </h1>
          <p className="opacity-60 text-sm mt-1">
            Real-time metrics and alerts.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: "Today's Revenue",
            value: `$${data.todayRevenue.toFixed(2)}`,
            border: "border-l-blue-500",
          },
          {
            title: "Total Orders",
            value: data.totalOrders,
            border: "border-l-indigo-500",
          },
          {
            title: "Total Products",
            value: data.totalProducts,
            border: "border-l-emerald-500",
          },
          {
            title: "Total Customers",
            value: data.totalCustomers,
            border: "border-l-amber-500",
          },
        ].map((stat, i) => (
          <div
            key={i}
            className={`bg-base-100 border border-base-300 border-l-4 ${stat.border} rounded-md shadow-sm p-5`}
          >
            <h2 className="text-xs font-semibold uppercase tracking-wider opacity-60 mb-2">
              {stat.title}
            </h2>
            <p className="text-3xl font-bold text-base-content">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-row-2 gap-6 pt-2">
        {/* Alerts Column */}
        <div className="space-x-6 grid grid-cols-2">
          <div className="bg-base-100 border border-base-300 rounded-md shadow-sm overflow-hidden">
            <div className="bg-error/10 border-b border-base-300 px-4 py-3 flex items-center justify-between">
              <h2 className="font-bold text-sm text-error">Low Stock Alerts</h2>
              <span className="badge badge-error badge-sm rounded-sm text-xs font-bold">
                {data.lowStockProducts.length}
              </span>
            </div>
            <div className="p-0">
              {data.lowStockProducts.length === 0 ? (
                <div className="text-center py-6 text-xs text-base-content/50">
                  Inventory levels are optimal.
                </div>
              ) : (
                <ul className="divide-y divide-base-300">
                  {data.lowStockProducts.map((p: any) => (
                    <li
                      key={p.id}
                      className="flex justify-between items-center px-4 py-3 hover:bg-base-200/50"
                    >
                      <span className="text-sm font-medium">{p.name}</span>
                      <span className="badge badge-error badge-outline badge-sm rounded-sm font-semibold">
                        {p.stock} remaining
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="bg-base-100 border border-base-300 rounded-md shadow-sm overflow-hidden">
            <div className="bg-warning/10 border-b border-base-300 px-4 py-3 flex items-center justify-between">
              <h2 className="font-bold text-sm text-warning-content">
                Expiring Soon
              </h2>
              <span className="badge badge-warning badge-sm rounded-sm text-xs font-bold">
                {data.expiringProducts.length}
              </span>
            </div>
            <div className="p-0">
              {data.expiringProducts.length === 0 ? (
                <div className="text-center py-6 text-xs text-base-content/50">
                  No products expiring within 7 days.
                </div>
              ) : (
                <ul className="divide-y divide-base-300">
                  {data.expiringProducts.map((p: any) => (
                    <li
                      key={p.id}
                      className="flex justify-between items-center px-4 py-3 hover:bg-base-200/50"
                    >
                      <span className="text-sm font-medium">{p.name}</span>
                      <span className="text-xs font-mono opacity-70 bg-warning/20 px-2 py-1 rounded-sm text-warning-content">
                        {p.expiry_date}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Rankings Column */}
        <div className="space-x-6 grid grid-cols-2">
          <div className="bg-base-100 border border-base-300 rounded-md shadow-sm overflow-hidden">
            <div className="bg-base-200/50 border-b border-base-300 px-4 py-3">
              <h2 className="font-bold text-sm">Top Selling Products</h2>
            </div>
            <div className="p-0">
              {data.topProducts.length === 0 ? (
                <div className="text-center py-6 text-xs text-base-content/50">
                  Insufficient sales data.
                </div>
              ) : (
                <ul className="divide-y divide-base-300">
                  {data.topProducts.map((p: any, i: number) => (
                    <li
                      key={p.name}
                      className="flex items-center px-4 py-3 hover:bg-base-200/50"
                    >
                      <span className="w-6 text-xs font-bold text-base-content/40">
                        {i + 1}.
                      </span>
                      <span className="text-sm flex-1">{p.name}</span>
                      <span className="text-xs font-bold bg-base-200 px-2 py-1 rounded-sm text-base-content/70">
                        {p.qty} unit{p.qty > 1 ? "s" : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="bg-base-100 border border-base-300 rounded-md shadow-sm overflow-hidden">
            <div className="bg-base-200/50 border-b border-base-300 px-4 py-3">
              <h2 className="font-bold text-sm">Top Performing Staff</h2>
            </div>
            <div className="p-0">
              {data.topStaff.length === 0 ? (
                <div className="text-center py-6 text-xs text-base-content/50">
                  Insufficient sales data.
                </div>
              ) : (
                <ul className="divide-y divide-base-300">
                  {data.topStaff.map((s: any, i: number) => (
                    <li
                      key={s.name}
                      className="flex items-center px-4 py-3 hover:bg-base-200/50"
                    >
                      <span className="w-6 text-xs font-bold text-base-content/40">
                        {i + 1}.
                      </span>
                      <span className="text-sm flex-1">{s.name}</span>
                      <span className="text-xs font-bold bg-base-200 px-2 py-1 rounded-sm text-base-content/70">
                        {s.count} order{s.count > 1 ? "s" : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
