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

        <div className="p-4 sm:p-6 lg:p-8 w-full" style={{ animation: 'fadeUp 0.5s var(--m3-emphasized) both' }}>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <span className="loading loading-spinner loading-lg text-[var(--color-primary)]" />
            </div>
          ) : data ? (
            <div className="space-y-6">

              {/* ── Brand Profile Banner ────────────────────────── */}
              <div className="flex items-center gap-6 bg-[var(--color-base-100)] rounded-[24px] border border-[var(--color-base-300)] p-6">
                {data.imageUrl ? (
                  <img src={toImageSrc(data.imageUrl)} alt={data.name} className="w-20 h-20 rounded-2xl object-cover border border-[var(--color-base-300)]" />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-[var(--color-base-200)] flex items-center justify-center text-4xl border border-[var(--color-base-300)]">🏢</div>
                )}
                <div>
                  <h1 className="text-2xl font-bold text-[var(--color-base-content)]">{data.name}</h1>
                  <p className="text-sm text-[var(--color-neutral)]">Brand Analytics & Product Tracking</p>
                </div>
              </div>


              {/* ── KPI cards ───────────────────────────────────── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <div className="bg-[var(--color-base-100)] rounded-[24px] border border-[var(--color-base-300)] p-6 flex flex-col gap-2">
                  <span className="text-xs font-medium text-[var(--color-neutral)] uppercase tracking-widest">Units Sold</span>
                  <span className="text-3xl font-normal leading-none text-[var(--color-base-content)]" style={{ fontFamily: '"Roboto Flex", "Roboto", sans-serif' }}>{data.unitsSold}</span>
                </div>
                <div className="bg-[var(--color-base-100)] rounded-[24px] border border-[var(--color-base-300)] p-6 flex flex-col gap-2">
                  <span className="text-xs font-medium text-[var(--color-neutral)] uppercase tracking-widest">Revenue</span>
                  <span className="text-3xl font-normal leading-none text-[var(--color-primary)]" style={{ fontFamily: '"Roboto Flex", "Roboto", sans-serif' }}>{formatCurrency(data.revenue)}</span>
                </div>
                <div className="bg-[var(--color-base-100)] rounded-[24px] border border-[var(--color-base-300)] p-6 flex flex-col gap-2">
                  <span className="text-xs font-medium text-[var(--color-neutral)] uppercase tracking-widest">Profit</span>
                  <span className={`text-3xl font-normal leading-none ${data.profit >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-error)]'}`} style={{ fontFamily: '"Roboto Flex", "Roboto", sans-serif' }}>
                    {formatCurrency(data.profit)}
                  </span>
                </div>
                <div className="bg-[var(--color-base-100)] rounded-[24px] border border-[var(--color-base-300)] p-6 flex flex-col gap-2">
                  <span className="text-xs font-medium text-[var(--color-neutral)] uppercase tracking-widest">Stock Left</span>
                  <span className="text-3xl font-normal leading-none text-[var(--color-base-content)]" style={{ fontFamily: '"Roboto Flex", "Roboto", sans-serif' }}>{data.stockUnits} <span className="text-base text-[var(--color-neutral)]">units</span></span>
                </div>
                <div className="bg-[var(--color-base-100)] rounded-[24px] border border-[var(--color-base-300)] p-6 flex flex-col gap-2">
                  <span className="text-xs font-medium text-[var(--color-neutral)] uppercase tracking-widest">Stock Value</span>
                  <span className="text-3xl font-normal leading-none text-[var(--color-base-content)]" style={{ fontFamily: '"Roboto Flex", "Roboto", sans-serif' }}>{formatCurrency(data.stockValue)}</span>
                </div>
                <div className="bg-[var(--color-base-100)] rounded-[24px] border border-[var(--color-base-300)] p-6 flex flex-col gap-2">
                  <span className="text-xs font-medium text-[var(--color-neutral)] uppercase tracking-widest">Inventory Budget</span>
                  <span className="text-3xl font-normal leading-none text-[var(--color-base-content)]" style={{ fontFamily: '"Roboto Flex", "Roboto", sans-serif' }}>{formatCurrency(data.inventoryBudget)}</span>
                </div>
              </div>

              {/* ── Products of this brand ──────────────────────── */}
              <div className="bg-[var(--color-base-100)] rounded-[24px] border border-[var(--color-base-300)] overflow-hidden">
                <div className="px-6 py-5">
                  <h2 className="text-base font-medium text-[var(--color-base-content)]">Products ({data.products.length})</h2>
                </div>
                {data.products.length === 0 ? (
                  <div className="p-10 text-center text-[var(--color-neutral)]">No products linked to this brand yet.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="table w-full">
                      <thead className="bg-[var(--color-base-200)]/50 text-[var(--color-neutral)]">
                        <tr>
                          <th className="px-6 py-3 font-medium tracking-wide uppercase text-xs">Product</th>
                          <th className="px-6 py-3 font-medium tracking-wide uppercase text-xs text-right">Price</th>
                          <th className="px-6 py-3 font-medium tracking-wide uppercase text-xs text-right">Cost</th>
                          <th className="px-6 py-3 font-medium tracking-wide uppercase text-xs text-right">Stock</th>
                          <th className="px-6 py-3 font-medium tracking-wide uppercase text-xs text-right">Units Sold</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.products.map((p) => (
                          <tr key={p.id} className="border-b border-[var(--color-base-300)] last:border-0">
                            <td className="px-6 py-4 font-medium text-[var(--color-base-content)]">{p.name}</td>
                            <td className="px-6 py-4 text-right">{formatCurrency(p.price)}</td>
                            <td className="px-6 py-4 text-right text-[var(--color-neutral)]">{formatCurrency(p.cost)}</td>
                            <td className="px-6 py-4 text-right">{p.stock}</td>
                            <td className="px-6 py-4 text-right font-medium text-[var(--color-primary)]">{p.unitsSold}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="text-center text-[var(--color-error)] py-10">Failed to load brand analytics.</div>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
