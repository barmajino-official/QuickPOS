/**
 * @file BrandDetailPage.tsx
 * @description Brand analytics view: KPI cards (units sold, revenue, profit, stock
 *              units, stock value, inventory budget) plus the brand's product list
 *              with per-product units sold.
 *
 * @notes Requires "products" permission. Route param :id. CSS in ./BrandDetailPage.css.
 */
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';

import { brandsApi } from '~/api/brands';
import { BASE_URL } from '~/api/client';
import { useUiStore } from '~/store/uiStore';
import { ProtectedRoute } from '~/components/ProtectedRoute/ProtectedRoute';
import { AppLayout } from '~/components/AppLayout/AppLayout';
import { TopBar } from '~/components/AppLayout/TopBar/TopBar';
import type { BrandAnalytics } from '~/types';

import './BrandDetailPage.css';

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

export default function BrandDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState<BrandAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const showToast = useUiStore((s) => s.showToast);

  useEffect(() => {
    if (!id) return;
    brandsApi
      .analytics(Number(id))
      .then((res) => setData(res as BrandAnalytics))
      .catch((err: unknown) =>
        showToast(err instanceof Error ? err.message : 'Failed to load brand analytics', 'error'),
      )
      .finally(() => setLoading(false));
  }, [id]);

  const toImageSrc = (url: string | null) =>
    url ? (url.startsWith('http') ? url : `${BASE_URL}${url}`) : '';

  return (
    <ProtectedRoute permission="brands">
      <AppLayout>
        <TopBar
          title={data ? data.name : 'Brand'}
          actions={
            <Link to="/brands" className="btn btn-ghost btn-sm rounded-full brand_back_btn">
              ← All brands
            </Link>
          }
        />

        <div className="brand_detail_page">
          {loading ? (
            <div className="brand_detail_loading">
              <span className="loading loading-spinner loading-lg text-[var(--color-primary)]" />
            </div>
          ) : data ? (
            <div className="brand_detail_content">

              {/* ── Brand Profile Banner ────────────────────────── */}
              <div className="brand_profile_banner">
                {data.imageUrl ? (
                  <img src={toImageSrc(data.imageUrl)} alt={data.name} className="brand_banner_img" />
                ) : (
                  <div className="brand_banner_placeholder">🏢</div>
                )}
                <div>
                  <h1 className="brand_banner_name">{data.name}</h1>
                  <p className="brand_banner_meta">Brand Analytics & Product Tracking</p>
                </div>
              </div>


              {/* ── KPI cards ───────────────────────────────────── */}
              <div className="brand_kpi_grid">
                <div className="brand_kpi_card">
                  <span className="brand_kpi_label">Units Sold</span>
                  <span className="brand_kpi_value">{data.unitsSold}</span>
                </div>
                <div className="brand_kpi_card">
                  <span className="brand_kpi_label">Revenue</span>
                  <span className="brand_kpi_value brand_kpi_primary">{formatCurrency(data.revenue)}</span>
                </div>
                <div className="brand_kpi_card">
                  <span className="brand_kpi_label">Profit</span>
                  <span className={`brand_kpi_value ${data.profit >= 0 ? 'brand_kpi_success' : 'brand_kpi_error'}`}>
                    {formatCurrency(data.profit)}
                  </span>
                </div>
                <div className="brand_kpi_card">
                  <span className="brand_kpi_label">Stock Left</span>
                  <span className="brand_kpi_value">{data.stockUnits} <span className="brand_kpi_unit">units</span></span>
                </div>
                <div className="brand_kpi_card">
                  <span className="brand_kpi_label">Stock Value</span>
                  <span className="brand_kpi_value">{formatCurrency(data.stockValue)}</span>
                </div>
                <div className="brand_kpi_card">
                  <span className="brand_kpi_label">Inventory Budget</span>
                  <span className="brand_kpi_value">{formatCurrency(data.inventoryBudget)}</span>
                </div>
              </div>

              {/* ── Products of this brand ──────────────────────── */}
              <div className="brand_products_card">
                <div className="brand_products_header">
                  <h2 className="brand_products_title">Products ({data.products.length})</h2>
                </div>
                {data.products.length === 0 ? (
                  <div className="brand_products_empty">No products linked to this brand yet.</div>
                ) : (
                  <div className="brand_products_scroll">
                    <table className="table w-full brand_products_table">
                      <thead className="brand_products_thead">
                        <tr>
                          <th className="brand_products_th">Product</th>
                          <th className="brand_products_th_right">Price</th>
                          <th className="brand_products_th_right">Cost</th>
                          <th className="brand_products_th_right">Stock</th>
                          <th className="brand_products_th_right">Units Sold</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.products.map((p) => (
                          <tr key={p.id} className="brand_products_row">
                            <td className="brand_products_td_name">{p.name}</td>
                            <td className="brand_products_td_right">{formatCurrency(p.price)}</td>
                            <td className="brand_products_td_muted">{formatCurrency(p.cost)}</td>
                            <td className="brand_products_td_right">{p.stock}</td>
                            <td className="brand_products_td_sold">{p.unitsSold}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="brand_detail_error">Failed to load brand analytics.</div>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
