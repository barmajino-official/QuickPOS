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
import './OrdersPage.css';

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

        <div className="orders_page">
          {loading ? (
            <div className="orders_loading">
              <span className="loading loading-spinner loading-lg orders_spinner" />
            </div>
          ) : (
            <div className="orders_card">
              {orders.length === 0 ? (
                <div className="orders_empty">
                  <p className="orders_empty_text">No orders yet.</p>
                </div>
              ) : (
                <div className="orders_scroll">
                  <table className="table w-full orders_table">
                    <thead className="orders_thead">
                      <tr>
                        <th className="orders_th">Invoice</th>
                        <th className="orders_th">Customer</th>
                        <th className="orders_th">Staff</th>
                        <th className="orders_th_right">Total</th>
                        <th className="orders_th">Status</th>
                        <th className="orders_th">Date</th>
                        <th className="orders_th_right">Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {orders.map((o) => (
                        <tr key={o.id} className="orders_row">
                          <td className="orders_td_invoice">
                            INV-{String(o.id).padStart(INVOICE_PAD, '0')}
                          </td>
                          <td className="orders_td">{o.customerName ?? 'Guest'}</td>
                          <td className="orders_td_staff">{o.staffName ?? '—'}</td>
                          <td className="orders_td_total">{formatCurrency(o.total)}</td>
                          <td className="orders_td">
                            <span
                              className={
                                o.status === 'Completed'
                                  ? 'badge badge-sm badge-success orders_badge_completed'
                                  : 'badge badge-sm badge-warning orders_badge_pending'
                              }
                            >
                              {o.status}
                            </span>
                          </td>
                          <td className="orders_td_date">{formatDate(o.createdAt)}</td>
                          <td className="orders_td_actions">
                            <div className="orders_actions_group">
                              <button
                                className="btn btn-xs btn-ghost orders_btn_receipt"
                                onClick={() => handleViewReceipt(o.id)}
                                disabled={receiptLoading}
                              >
                                Receipt
                              </button>
                              <button
                                className="btn btn-xs btn-ghost orders_btn_delete"
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
        <div className="modal modal-open receipt_overlay print:modal-close">
          <div className="modal-box receipt_card">
            <div className="receipt_header">
              <h2 className="receipt_title">QuickPOS Pro</h2>
              <p className="receipt_subtitle">Sales Receipt</p>
            </div>

            <div className="receipt_body">
              <div className="receipt_meta_row">
                <span className="receipt_meta_label">Invoice</span>
                <span className="receipt_meta_value">
                  INV-{String(receipt.id).padStart(INVOICE_PAD, '0')}
                </span>
              </div>
              <div className="receipt_meta_row">
                <span className="receipt_meta_label">Date</span>
                <span>{formatDate(receipt.createdAt)}</span>
              </div>
              <div className="receipt_meta_row">
                <span className="receipt_meta_label">Customer</span>
                <span>{receipt.customerName ?? 'Guest'}</span>
              </div>
              <div className="receipt_meta_row">
                <span className="receipt_meta_label">Staff</span>
                <span>{receipt.staffName ?? '—'}</span>
              </div>

              <div className="divider my-2 receipt_divider" />

              <table className="table table-sm w-full receipt_table">
                <thead className="receipt_thead">
                  <tr>
                    <th className="receipt_item_th">Item</th>
                    <th className="receipt_qty_th">Qty</th>
                    <th className="receipt_total_th">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(receipt.items ?? []).map((item) => (
                    <tr key={item.id} className="receipt_item_row">
                      <td className="receipt_item_cell">
                        <div className="receipt_item_name">{item.productName}</div>
                        <div className="receipt_item_price">
                          {formatCurrency(item.unitPrice)} each
                        </div>
                      </td>
                      <td className="receipt_qty_cell">{item.quantity}</td>
                      <td className="receipt_total_cell">
                        {formatCurrency(item.unitPrice * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="divider my-2 receipt_divider" />

              <div className="receipt_grand_total">
                <span>Grand Total</span>
                <span className="receipt_grand_total_value">
                  {formatCurrency(receipt.total)}
                </span>
              </div>
            </div>

            <div className="receipt_actions print:hidden">
              <button className="btn btn-ghost flex-1 rounded-full receipt_btn_close" onClick={handleCloseReceipt}>
                Close
              </button>
              <button className="btn btn-primary flex-1 rounded-full receipt_btn_print" onClick={handlePrint}>
                Print
              </button>
            </div>
          </div>

          <div className="modal-backdrop bg-black/20 receipt_backdrop print:hidden" onClick={handleCloseReceipt} />
        </div>
      )}
    </ProtectedRoute>
  );
}
