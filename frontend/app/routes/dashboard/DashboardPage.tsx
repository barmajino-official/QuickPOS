/**
 * @file DashboardPage.tsx
 * @description Dashboard overview page displaying live business statistics.
 *              Shows revenue, order count, product count, customer count,
 *              low-stock alerts, expiring products, and top sellers/staff.
 *
 * @notes  All data fetched from dashboardApi. No inline styles — see DashboardPage.css.
 */

// 1. React core
import { useEffect, useState } from 'react';

// 2. Third-party libraries
import { Link } from 'react-router';

// 3. Internal — API
import { dashboardApi } from '~/api/dashboard';

// 4. Internal — Store
import { useUiStore } from '~/store/uiStore';

// 5. Internal — Components
import { ProtectedRoute } from '~/components/ProtectedRoute/ProtectedRoute';
import { AppLayout } from '~/components/AppLayout/AppLayout';
import { TopBar } from '~/components/AppLayout/TopBar/TopBar';
import { SalesTrendChart } from '~/components/SalesTrendChart/SalesTrendChart';

// 6. Internal — Types
import type { DashboardStats } from '~/types';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const { showToast } = useUiStore();

  useEffect(() => {
    dashboardApi.stats()
      .then(res => setStats(res as DashboardStats))
      .catch((err: unknown) =>
        showToast(err instanceof Error ? err.message : 'Failed to load dashboard', 'error'),
      )
      .finally(() => setLoading(false));
  }, [showToast]);

  return (
    <ProtectedRoute permission="dashboard">
      <AppLayout>
        <TopBar title="Dashboard" />
        <div className="p-4 sm:p-6 lg:p-8 w-full" style={{ animation: 'fadeUp 0.5s var(--m3-emphasized) both' }}>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <span className="loading loading-spinner loading-lg text-primary" />
            </div>
          ) : stats ? (
            <div className="space-y-6">
              {/* ── Top Stats ── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-[var(--color-base-100)] rounded-[24px] shadow-sm p-6 flex flex-col justify-between hover:-translate-y-[2px] hover:shadow-[0px_1px_3px_0px_rgba(0,0,0,0.3),0px_4px_8px_3px_rgba(0,0,0,0.15)]" style={{ transition: 'background-color 0.25s var(--m3-standard), transform 0.35s var(--m3-emphasized), box-shadow 0.25s var(--m3-standard)' }}>
                  <h3 className="text-xs font-medium text-[var(--color-neutral)] uppercase tracking-widest">Today's revenue</h3>
                  <p className="text-4xl leading-none mt-4 text-[var(--color-primary)]" style={{ fontFamily: '"Roboto Flex", "Roboto", sans-serif', fontVariationSettings: '"wdth" 110, "GRAD" 50' }}>
                    {formatCurrency(stats.todayRevenue)}
                  </p>
                </div>
                <div className="bg-[var(--color-base-100)] rounded-[24px] shadow-sm p-6 flex flex-col justify-between hover:-translate-y-[2px] hover:shadow-[0px_1px_3px_0px_rgba(0,0,0,0.3),0px_4px_8px_3px_rgba(0,0,0,0.15)]" style={{ transition: 'background-color 0.25s var(--m3-standard), transform 0.35s var(--m3-emphasized), box-shadow 0.25s var(--m3-standard)' }}>
                  <h3 className="text-xs font-medium text-[var(--color-neutral)] uppercase tracking-widest">Today's orders</h3>
                  <p className="text-4xl leading-none mt-4 text-[var(--color-base-content)]" style={{ fontFamily: '"Roboto Flex", "Roboto", sans-serif', fontVariationSettings: '"wdth" 110, "GRAD" 50' }}>
                    {stats.todayOrderCount}
                  </p>
                </div>
                <div className="bg-[var(--color-base-100)] rounded-[24px] shadow-sm p-6 flex flex-col justify-between hover:-translate-y-[2px] hover:shadow-[0px_1px_3px_0px_rgba(0,0,0,0.3),0px_4px_8px_3px_rgba(0,0,0,0.15)]" style={{ transition: 'background-color 0.25s var(--m3-standard), transform 0.35s var(--m3-emphasized), box-shadow 0.25s var(--m3-standard)' }}>
                  <h3 className="text-xs font-medium text-[var(--color-neutral)] uppercase tracking-widest">Total products</h3>
                  <p className="text-4xl leading-none mt-4 text-[var(--color-base-content)]" style={{ fontFamily: '"Roboto Flex", "Roboto", sans-serif', fontVariationSettings: '"wdth" 110, "GRAD" 50' }}>
                    {stats.totalProducts}
                  </p>
                </div>
                <div className="bg-[var(--color-base-100)] rounded-[24px] shadow-sm p-6 flex flex-col justify-between hover:-translate-y-[2px] hover:shadow-[0px_1px_3px_0px_rgba(0,0,0,0.3),0px_4px_8px_3px_rgba(0,0,0,0.15)]" style={{ transition: 'background-color 0.25s var(--m3-standard), transform 0.35s var(--m3-emphasized), box-shadow 0.25s var(--m3-standard)' }}>
                  <h3 className="text-xs font-medium text-[var(--color-neutral)] uppercase tracking-widest">Total customers</h3>
                  <p className="text-4xl leading-none mt-4 text-[var(--color-base-content)]" style={{ fontFamily: '"Roboto Flex", "Roboto", sans-serif', fontVariationSettings: '"wdth" 110, "GRAD" 50' }}>
                    {stats.totalCustomers}
                  </p>
                </div>
              </div>

              {/* ── Sales trend chart ── */}
              <div className="bg-[var(--color-base-100)] rounded-[24px] border border-[var(--color-base-300)] p-5 sm:p-6">
                <div className="mb-4">
                  <h2 className="text-base font-medium text-[var(--color-base-content)]">Sales — last 7 days</h2>
                </div>
                <SalesTrendChart data={stats.salesTrend} />
              </div>

              {/* ── Alerts ── */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Low Stock */}
                <div className="rounded-[24px] overflow-hidden">
                  <div className="px-6 py-5 flex justify-between items-center">
                    <h2 className="text-base font-medium text-red-600">Low stock alerts</h2>
                    <Link to="/products" className="btn btn-sm btn-ghost rounded-full px-4 font-medium text-error">
                      View all
                    </Link>
                  </div>
                  <div className="p-2 pt-0">
                    <div className="bg-[var(--color-base-100)] rounded-[20px] overflow-hidden shadow-sm">
                      {stats.lowStockProducts.length === 0 ? (
                        <div className="p-8 text-center text-[var(--color-neutral)]">No low stock products!</div>
                      ) : (
                        <table className="table table-sm w-full">
                          <tbody>
                            {stats.lowStockProducts.map(p => (
                              <tr key={p.id} className="border-b-0 transition-colors">
                                <td className="font-medium px-6 py-4">{p.name}</td>
                                <td className="text-right px-6 py-4">
                                  <span className="badge badge-error badge-sm font-medium px-3 py-2">
                                    {p.stock} left
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expiring Soon */}
                <div className="rounded-[24px] overflow-hidden">
                  <div className="px-6 py-5 flex justify-between items-center">
                    <h2 className="text-base font-medium text-yellow-600">Expiring soon</h2>
                    <Link to="/products" className="btn btn-sm btn-ghost rounded-full px-4 font-medium text-warning">
                      View all
                    </Link>
                  </div>
                  <div className="p-2 pt-0">
                    <div className="bg-[var(--color-base-100)] rounded-[20px] overflow-hidden shadow-sm">
                      {stats.expiringSoon.length === 0 ? (
                        <div className="p-8 text-center text-[var(--color-neutral)]">No products expiring soon.</div>
                      ) : (
                        <table className="table table-sm w-full">
                          <tbody>
                            {stats.expiringSoon.map(p => (
                              <tr key={p.id} className="border-b-0 transition-colors">
                                <td className="font-medium px-6 py-4">{p.name}</td>
                                <td className="text-right px-6 py-4">
                                  <span className="badge badge-warning badge-sm font-medium px-3 py-2">
                                    {new Date(p.expiryDate).toLocaleDateString()} · {p.stock} left
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Leaderboards ── */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-10">
                {/* Top Products */}
                <div className="bg-[var(--color-base-200)] rounded-[24px] overflow-hidden">
                  <div className="px-6 py-5 flex justify-between items-center">
                    <h2 className="text-base font-medium text-[var(--color-base-content)]">Top selling products</h2>
                  </div>
                  <div className="p-2 pt-0">
                    <div className="bg-[var(--color-base-100)] rounded-[20px] overflow-hidden shadow-sm">
                      {stats.topProducts.length === 0 ? (
                        <div className="p-8 text-center text-[var(--color-neutral)]">No sales data yet.</div>
                      ) : (
                        <table className="table table-sm w-full">
                          <tbody>
                            {stats.topProducts.map((p, i) => (
                              <tr key={p.id} className="border-b-0 transition-colors">
                                <td className="w-12 text-center text-[var(--color-neutral)] font-medium px-6 py-4">#{i + 1}</td>
                                <td className="font-medium py-4">{p.name}</td>
                                <td className="text-right text-sm font-medium text-[var(--color-primary)] px-6 py-4">{p.totalSold} sold</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                </div>

                {/* Top Staff */}
                <div className="bg-[var(--color-base-200)] rounded-[24px] overflow-hidden">
                  <div className="px-6 py-5 flex justify-between items-center">
                    <h2 className="text-base font-medium text-[var(--color-base-content)]">Top staff members</h2>
                  </div>
                  <div className="p-2 pt-0">
                    <div className="bg-[var(--color-base-100)] rounded-[20px] overflow-hidden shadow-sm">
                      {stats.topStaff.length === 0 ? (
                        <div className="p-8 text-center text-[var(--color-neutral)]">No staff data yet.</div>
                      ) : (
                        <table className="table table-sm w-full">
                          <tbody>
                            {stats.topStaff.map((s, i) => (
                              <tr key={s.id} className="border-b-0 transition-colors">
                                <td className="w-12 text-center text-[var(--color-neutral)] font-medium px-6 py-4">#{i + 1}</td>
                                <td className="py-4">
                                  <div className="flex items-center gap-4">
                                    <div className="avatar placeholder">
                                      <div className="bg-[var(--color-primary)] text-[var(--color-primary-content)] rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm shadow-sm">
                                        {s.name.charAt(0).toUpperCase()}
                                      </div>
                                    </div>
                                    <span className="font-medium">{s.name}</span>
                                  </div>
                                </td>
                                <td className="text-right text-sm font-medium text-[var(--color-primary)] px-6 py-4">{s.orderCount} orders</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-error py-10">Failed to load dashboard data.</div>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}

// --- Helper Functions ---

/**
 * Formats a numeric value as USD currency.
 */
function formatCurrency(val: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(val);
}
