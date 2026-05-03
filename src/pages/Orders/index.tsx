// Orders — Logic
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import OrdersView from "./view";

export function Orders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [customerid, setCustomerid] = useState<number>(-1);
  useEffect(() => {
    load(customerid);
  }, [customerid]);

  const load = async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      let data: any;

      if (id != -1) {
        const { data, error: apiError } = await supabase
          .from("orders")
          .select("*, customers(name), staff(name), order_items(*)")
          .order("created_at", { ascending: false })
          .eq("customer_id", id);
        if (apiError) throw apiError;
      } else {
        const { data, error: apiError } = await supabase
          .from("orders")
          .select("*, customers(name), staff(name), order_items(*)")
          .order("created_at", { ascending: false });
        if (apiError) throw apiError;
      }

      setOrders(data || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  const viewDetails = (order: any) => {
    setSelectedOrder(order);
  };

  const closeDetails = () => {
    setSelectedOrder(null);
  };

  const deleteOrder = async (id: number) => {
    if (!confirm("Are you sure you want to delete this order?")) return;
    await supabase.from("orders").delete().eq("id", id);
    setOrders(orders.filter((o) => o.id !== id));
  };

  if (error) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-error">Error</h2>
        <p>{error}</p>
        <button className="btn mt-4" onClick={load}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <OrdersView
      orders={orders}
      loading={loading}
      selectedOrder={selectedOrder}
      selectedItems={selectedOrder?.order_items || []}
      viewDetails={viewDetails}
      closeDetails={closeDetails}
      setCustomerid={setCustomerid}
    />
  );
}

export default Orders;
