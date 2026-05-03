import type { DashboardData } from "./index";

interface Props {
  data: DashboardData | null;
  loading: boolean;
}

export default function DashboardView({ data, loading }: Props) {
  if (loading || !data)
    return (
      <div className="flex h-full items-center justify-center">
        <span className="loading loading-spinner text-primary"></span>
      </div>
    );

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        {/* Alerts Column */}
        <div className="space-y-6">
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
        <div className="space-y-6">
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
