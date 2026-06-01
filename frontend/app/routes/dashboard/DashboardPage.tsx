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

// 7. Styles (always last)
import './DashboardPage.css';


export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const { showToast } = useUiStore();

  useEffect(() => {
    dashboardApi.stats()
      .then(res => setStats(res as DashboardStats))
      .catch(err => showToast(err.message || 'Failed to load dashboard', 'error'))
      .finally(() => setLoading(false));
  }, [showToast]);

  return (
    <ProtectedRoute permission="dashboard">
      <AppLayout>
        <TopBar title="Dashboard" />
        <div className="dashboard_page">
          {loading ? (
            <div className="dashboard_loading">
              <span className="loading loading-spinner loading-lg text-primary" />
            </div>
          ) : stats ? (
            <div className="dashboard_grid">

              {/* ── Top Stats ── */}
              <div className="dashboard_stats_row">
                <div className="dashboard_stat_card">
                  <h3 className="dashboard_stat_label">Today's revenue</h3>
                  <p className="dashboard_stat_value dashboard_stat_value--primary">
                    {formatCurrency(stats.todayRevenue)}
                  </p>
                </div>
                <div className="dashboard_stat_card">
                  <h3 className="dashboard_stat_label">Today's orders</h3>
                  <p className="dashboard_stat_value dashboard_stat_value--default">
                    {stats.todayOrderCount}
                  </p>
                </div>
                <div className="dashboard_stat_card">
                  <h3 className="dashboard_stat_label">Total products</h3>
                  <p className="dashboard_stat_value dashboard_stat_value--default">
                    {stats.totalProducts}
                  </p>
                </div>
                <div className="dashboard_stat_card">
                  <h3 className="dashboard_stat_label">Total customers</h3>
                  <p className="dashboard_stat_value dashboard_stat_value--default">
                    {stats.totalCustomers}
                  </p>
                </div>
              </div>

              {/* ── Sales trend chart ── */}
              <div className="dashboard_chart_card">
                <div className="dashboard_chart_header">
                  <h2 className="dashboard_chart_title">Sales — last 7 days</h2>
                </div>
                <SalesTrendChart data={stats.salesTrend} />
              </div>

              {/* ── Alerts ── */}
              <div className="dashboard_alerts_row">

                {/* Low Stock */}
                <div className="dashboard_alert_card dashboard_alert_card--error">
                  <div className="dashboard_alert_header">
                    <h2 className="dashboard_alert_title--error">Low stock alerts</h2>
                    <Link to="/products" className="btn btn-sm btn-ghost rounded-full dashboard_alert_link text-error">
                      View all
                    </Link>
                  </div>
                  <div className="dashboard_alert_body">
                    <div className="dashboard_alert_table_wrap">
                      {stats.lowStockProducts.length === 0 ? (
                        <div className="dashboard_alert_empty">No low stock products!</div>
                      ) : (
                        <table className="table table-sm w-full">
                          <tbody>
                            {stats.lowStockProducts.map(p => (
                              <tr key={p.id} className="dashboard_alert_row">
                                <td className="dashboard_alert_td">{p.name}</td>
                                <td className="dashboard_alert_td_right">
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
                <div className="dashboard_alert_card dashboard_alert_card--warning">
                  <div className="dashboard_alert_header">
                    <h2 className="dashboard_alert_title--warning">Expiring soon</h2>
                    <Link to="/products" className="btn btn-sm btn-ghost rounded-full dashboard_alert_link text-warning">
                      View all
                    </Link>
                  </div>
                  <div className="dashboard_alert_body">
                    <div className="dashboard_alert_table_wrap">
                      {stats.expiringSoon.length === 0 ? (
                        <div className="dashboard_alert_empty">No products expiring soon.</div>
                      ) : (
                        <table className="table table-sm w-full">
                          <tbody>
                            {stats.expiringSoon.map(p => (
                              <tr key={p.id} className="dashboard_alert_row">
                                <td className="dashboard_alert_td">{p.name}</td>
                                <td className="dashboard_alert_td_right">
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
              <div className="dashboard_leaders_row">

                {/* Top Products */}
                <div className="dashboard_leader_card">
                  <div className="dashboard_leader_header">
                    <h2 className="dashboard_leader_title">Top selling products</h2>
                  </div>
                  <div className="dashboard_leader_body">
                    <div className="dashboard_leader_table_wrap">
                      {stats.topProducts.length === 0 ? (
                        <div className="dashboard_alert_empty">No sales data yet.</div>
                      ) : (
                        <table className="table table-sm w-full">
                          <tbody>
                            {stats.topProducts.map((p, i) => (
                              <tr key={p.id} className="dashboard_alert_row">
                                <td className="dashboard_leader_rank">#{i + 1}</td>
                                <td className="dashboard_leader_name">{p.name}</td>
                                <td className="dashboard_leader_value">{p.totalSold} sold</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                </div>

                {/* Top Staff */}
                <div className="dashboard_leader_card">
                  <div className="dashboard_leader_header">
                    <h2 className="dashboard_leader_title">Top staff members</h2>
                  </div>
                  <div className="dashboard_leader_body">
                    <div className="dashboard_leader_table_wrap">
                      {stats.topStaff.length === 0 ? (
                        <div className="dashboard_alert_empty">No staff data yet.</div>
                      ) : (
                        <table className="table table-sm w-full">
                          <tbody>
                            {stats.topStaff.map((s, i) => (
                              <tr key={s.id} className="dashboard_alert_row">
                                <td className="dashboard_leader_rank">#{i + 1}</td>
                                <td className="dashboard_leader_avatar_cell">
                                  <div className="dashboard_leader_avatar_row">
                                    <div className="avatar placeholder">
                                      <div className="dashboard_leader_avatar">
                                        {s.name.charAt(0).toUpperCase()}
                                      </div>
                                    </div>
                                    <span className="font-medium">{s.name}</span>
                                  </div>
                                </td>
                                <td className="dashboard_leader_value">{s.orderCount} orders</td>
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
            <div className="dashboard_error">Failed to load dashboard data.</div>
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
