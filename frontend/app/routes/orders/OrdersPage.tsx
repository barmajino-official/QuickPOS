/**
 * @file OrdersPage.tsx
 * @description Order history table with receipt modal and delete capability.
 *              Each order shows invoice ID, customer, staff, total, status, and timestamp.
 *              The receipt modal shows full line items and supports browser print.
 * @notes Requires "orders" permission. Uses ProtectedRoute guard.
 */
import { useEffect, useState } from 'react';

import { ordersApi } from '~/api/orders';
import { useUiStore } from '~/store/uiStore';
import { ProtectedRoute } from '~/components/ProtectedRoute/ProtectedRoute';
import { AppLayout } from '~/components/AppLayout/AppLayout';
import { TopBar } from '~/components/AppLayout/TopBar/TopBar';
import type { Order } from '~/types';

/** Invoice prefix pad length */
const INVOICE_PAD = 6;

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

const formatDate = (str: string) =>
  new Date(str).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [receipt, setReceipt] = useState<Order | null>(null);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const { showToast } = useUiStore();

  const loadData = async () => {
    try {
      setLoading(true);
      setOrders((await ordersApi.list()) as Order[]);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to load orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  /* ── Handlers ──────────────────────────────────────────────── */

  const handleViewReceipt = async (id: number) => {
    try {
      setReceiptLoading(true);
      const order = (await ordersApi.get(id)) as Order;
      setReceipt(order);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to load receipt', 'error');
    } finally {
      setReceiptLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this order? This cannot be undone.')) return;
    try {
      await ordersApi.remove(id);
      showToast('Order deleted', 'success');
      loadData();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to delete order', 'error');
    }
  };

  const handleCloseReceipt = () => setReceipt(null);
  const handlePrint = () => window.print();

  /* ── Render ────────────────────────────────────────────────── */

  return (
    <ProtectedRoute permission="orders">
      <AppLayout>
        <TopBar title="Orders" />

        <div className="p-6 md:p-8 w-full [animation:fadeUp_0.5s_var(--m3-emphasized)_both]">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <span className="loading loading-spinner loading-lg text-[var(--color-primary)]" />
            </div>
          ) : (
            <div className="bg-[var(--color-base-100)] rounded-[24px] shadow-sm overflow-hidden w-full">
              {orders.length === 0 ? (
                <div className="p-10 text-center text-[var(--color-neutral)]">
                  <p className="text-lg">No orders yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table w-full">
                    <thead className="bg-[var(--color-base-200)]/50 text-[var(--color-neutral)]">
                      <tr>
                        <th className="px-6 py-4 font-medium tracking-wide uppercase text-xs">Invoice</th>
                        <th className="px-6 py-4 font-medium tracking-wide uppercase text-xs">Customer</th>
                        <th className="px-6 py-4 font-medium tracking-wide uppercase text-xs">Staff</th>
                        <th className="px-6 py-4 font-medium tracking-wide uppercase text-xs text-right">Total</th>
                        <th className="px-6 py-4 font-medium tracking-wide uppercase text-xs">Status</th>
                        <th className="px-6 py-4 font-medium tracking-wide uppercase text-xs">Date</th>
                        <th className="px-6 py-4 font-medium tracking-wide uppercase text-xs text-right">Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {orders.map((o) => (
                        <tr key={o.id} className="border-b border-[var(--color-base-300)] last:border-0 [transition:background-color_0.15s_var(--m3-standard)] hover:bg-[color-mix(in_srgb,var(--color-base-200)_30%,transparent)]">
                          <td className="px-6 py-4 font-mono text-sm font-medium text-[var(--color-primary)]">
                            INV-{String(o.id).padStart(INVOICE_PAD, '0')}
                          </td>
                          <td className="px-6 py-4 text-sm">{o.customerName ?? 'Guest'}</td>
                          <td className="px-6 py-4 text-sm text-[var(--color-neutral)]">{o.staffName ?? '—'}</td>
                          <td className="px-6 py-4 text-right font-medium">{formatCurrency(o.total)}</td>
                          <td className="px-6 py-4 text-sm">
                            <span
                              className={
                                o.status === 'Completed'
                                  ? 'badge badge-sm badge-success font-medium'
                                  : 'badge badge-sm badge-warning font-medium'
                              }
                            >
                              {o.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs text-[var(--color-neutral)]">{formatDate(o.createdAt)}</td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                className="btn btn-xs btn-ghost text-[var(--color-info)]"
                                onClick={() => handleViewReceipt(o.id)}
                                disabled={receiptLoading}
                              >
                                Receipt
                              </button>
                              <button
                                className="btn btn-xs btn-ghost text-[var(--color-error)]"
                                onClick={() => handleDelete(o.id)}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </AppLayout>

      {/* ── Receipt modal ──────────────────────────────────────── */}

      {receipt && (
        <div className="modal modal-open print:modal-close">
          <div className="modal-box bg-[var(--color-base-100)] rounded-[24px] max-w-md shadow-lg border border-[var(--color-base-300)] p-0 overflow-hidden">
            <div className="bg-[var(--color-base-200)]/50 px-8 py-6 text-center border-b border-[var(--color-base-300)]">
              <h2 className="text-xl font-bold">QuickPOS Pro</h2>
              <p className="text-xs text-[var(--color-neutral)] mt-1">Sales Receipt</p>
            </div>

            <div className="px-8 py-6 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--color-neutral)]">Invoice</span>
                <span className="font-mono font-medium">
                  INV-{String(receipt.id).padStart(INVOICE_PAD, '0')}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--color-neutral)]">Date</span>
                <span>{formatDate(receipt.createdAt)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--color-neutral)]">Customer</span>
                <span>{receipt.customerName ?? 'Guest'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--color-neutral)]">Staff</span>
                <span>{receipt.staffName ?? '—'}</span>
              </div>

              <div className="divider my-2" />

              <table className="table table-sm w-full">
                <thead className="text-[var(--color-neutral)] text-xs uppercase">
                  <tr>
                    <th className="pl-0">Item</th>
                    <th className="text-center">Qty</th>
                    <th className="text-right pr-0">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(receipt.items ?? []).map((item) => (
                    <tr key={item.id} className="border-0">
                      <td className="pl-0 py-2">
                        <div className="font-medium text-sm">{item.productName}</div>
                        <div className="text-xs text-[var(--color-neutral)]">
                          {formatCurrency(item.unitPrice)} each
                        </div>
                      </td>
                      <td className="text-center py-2 text-sm">{item.quantity}</td>
                      <td className="text-right pr-0 py-2 font-medium text-sm">
                        {formatCurrency(item.unitPrice * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="divider my-2" />

              <div className="flex justify-between text-lg font-bold">
                <span>Grand Total</span>
                <span className="text-[var(--color-primary)]">
                  {formatCurrency(receipt.total)}
                </span>
              </div>
            </div>

            <div className="px-8 pb-6 flex gap-3 print:hidden">
              <button className="btn btn-ghost flex-1 rounded-full" onClick={handleCloseReceipt}>
                Close
              </button>
              <button className="btn btn-primary flex-1 rounded-full" onClick={handlePrint}>
                Print
              </button>
            </div>
          </div>

          <div className="modal-backdrop bg-black/20 print:hidden" onClick={handleCloseReceipt} />
        </div>
      )}
    </ProtectedRoute>
  );
}
