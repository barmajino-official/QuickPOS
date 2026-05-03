// Dashboard — Logic
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import DashboardView from "./view";

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

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);

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

        // Check if any of the critical queries returned an error due to schema issues
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

  return <DashboardView data={data} loading={loading} />;
}

export default Dashboard;
