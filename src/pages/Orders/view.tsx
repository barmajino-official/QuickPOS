interface Props {
  orders: any[];
  loading: boolean;
  selectedOrder: any | null;
  selectedItems: any[];
  viewDetails: (order: any) => void;
  closeDetails: () => void;
}

export default function OrdersView({
  orders,
  loading,
  selectedOrder,
  selectedItems,
  viewDetails,
  closeDetails,
}: Props) {
  if (loading)
    return (
      <div className="flex justify-center p-16">
        <span className="loading loading-spinner text-primary"></span>
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-base-content">
            Order Transactions
          </h1>
          <p className="text-sm opacity-60">
            Review past sales and print receipts.
          </p>
        </div>
      </div>

      <div className="bg-base-100 border border-base-300 shadow-sm rounded-md overflow-hidden">
        {orders.length === 0 ? (
          <div className="text-center py-16 opacity-50 text-sm">
            No transaction records found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-zebra table-sm w-full">
              <thead className="bg-base-200/50 text-base-content/70">
                <tr>
                  <th className="font-semibold uppercase tracking-wider text-[10px]">
                    Reference ID
                  </th>
                  <th className="font-semibold uppercase tracking-wider text-[10px]">
                    Customer
                  </th>
                  <th className="font-semibold uppercase tracking-wider text-[10px]">
                    Processed By
                  </th>
                  <th className="font-semibold uppercase tracking-wider text-[10px]">
                    Total Paid
                  </th>
                  <th className="font-semibold uppercase tracking-wider text-[10px]">
                    Status
                  </th>
                  <th className="font-semibold uppercase tracking-wider text-[10px]">
                    Timestamp
                  </th>
                  <th className="text-right font-semibold uppercase tracking-wider text-[10px]">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr
                    key={o.id}
                    className="hover:bg-blue-50/50 cursor-pointer"
                    onClick={() => viewDetails(o)}
                  >
                    <td className="py-2">
                      <span className="font-mono font-bold bg-base-200 border border-base-300 px-1.5 py-0.5 rounded-sm text-xs text-base-content/80">
                        INV-{o.id.toString().padStart(6, "0")}
                      </span>
                    </td>
                    <td className="text-sm font-medium">
                      {o.customers?.name || (
                        <span className="opacity-50 italic">Guest</span>
                      )}
                    </td>
                    <td className="text-xs opacity-70">
                      {o.staff?.name || "System"}
                    </td>
                    <td className="font-bold text-sm text-blue-600">
                      ${Number(o.total).toFixed(2)}
                    </td>
                    <td>
                      <span
                        className={`px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wide border ${o.status === "Completed" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td>
                      <div className="text-xs font-mono opacity-70">
                        {new Date(o.created_at).toLocaleString("en-US", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </div>
                    </td>
                    <td className="text-right">
                      <button className="btn btn-xs btn-ghost text-blue-600 rounded-sm px-2">
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Receipt Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-md shadow-2xl w-full max-w-sm border border-slate-300 max-h-[90vh] flex flex-col font-mono text-slate-800">
            {/* Header */}
            <div className="p-6 text-center border-b border-slate-200 border-dashed">
              <h3 className="text-xl font-bold tracking-tight mb-1">
                QuickPOS PRO
              </h3>
              <p className="text-xs text-slate-500">Transaction Receipt</p>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              <div className="space-y-1 mb-6 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Receipt No:</span>{" "}
                  <span className="font-bold">
                    INV-{selectedOrder.id.toString().padStart(6, "0")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Date/Time:</span>{" "}
                  <span>
                    {new Date(selectedOrder.created_at).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Cashier:</span>{" "}
                  <span>{selectedOrder.staff?.name || "System"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Customer:</span>{" "}
                  <span>
                    {selectedOrder.customers?.name || "Walk-in Guest"}
                  </span>
                </div>
              </div>

              <div className="border-y border-slate-200 border-dashed py-3 mb-4 space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                  <span>ITEM</span>
                  <span>AMT</span>
                </div>
                {selectedItems.length === 0 ? (
                  <p className="text-center opacity-40 text-xs italic py-2">
                    No item lines found
                  </p>
                ) : (
                  selectedItems.map((item) => (
                    <div key={item.id} className="text-sm">
                      <div className="flex justify-between items-start">
                        <span className="font-semibold break-all max-w-[200px] leading-tight">
                          {item.product_name}
                        </span>
                        <span className="font-bold">
                          $
                          {(item.quantity * Number(item.unit_price)).toFixed(2)}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {item.quantity} @ ${Number(item.unit_price).toFixed(2)}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="space-y-1 text-sm">
                <div className="flex justify-between font-bold text-lg pt-2">
                  <span>TOTAL</span>
                  <span>${Number(selectedOrder.total).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-500 pt-1">
                  <span>Status</span>
                  <span>{selectedOrder.status}</span>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-2">
              <button
                className="btn btn-sm btn-ghost rounded-sm px-4"
                onClick={closeDetails}
              >
                Close
              </button>
              <button
                className="btn btn-sm btn-primary rounded-sm px-4 shadow-sm"
                onClick={() => window.print()}
              >
                Print Copy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
