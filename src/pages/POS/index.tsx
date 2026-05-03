import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import type { Product, CartItem, Customer } from "../../lib/types";

interface Props {
  staffId: string;
}

export function POS({ staffId }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [loadStep, setLoadStep] = useState("Initializing POS...");
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("");

  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerId, setCustomerId] = useState("");

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      console.log("POS: Starting data load...");
      setLoading(true);
      setError(null);
      setLoadStep("Loading products and customers...");
      const [prod, cust, cat] = await Promise.all([
        supabase.from("products").select("*").order("name"),
        supabase.from("customers").select("*").order("name"),
        supabase.from("categories").select("*").order("name"),
      ]);

      if (prod.error || cust.error || cat.error) {
        console.error("API Error", prod.error || cust.error || cat.error);
        throw new Error("Database schema error or network failure.");
      }

      setProducts(prod.data || []);
      setCustomers(cust.data || []);
      setCategories(cat.data || []);
    } catch (err: any) {
      console.error("POS Load Error:", err);
      setError(err.message || "Failed to connect to the database.");
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (p: Product) => {
    if (p.stock <= 0) {
      alert("Out of stock!");
      return;
    }
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === p.id);
      if (existing) {
        if (existing.quantity >= p.stock) return prev;
        return prev.map((i) =>
          i.product.id === p.id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [...prev, { product: p, quantity: 1 }];
    });
  };

  const updateQty = (id: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    setCart((prev) =>
      prev.map((i) => (i.product.id === id ? { ...i, quantity } : i)),
    );
  };

  const removeFromCart = (id: number) => {
    setCart((prev) => prev.filter((i) => i.product.id !== id));
  };

  const checkout = async () => {
    if (cart.length === 0) return;
    try {
      const total = cart.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0,
      );

      setLoading(true);

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          total,
          staff_id: staffId,
          customer_id: customerId ? parseInt(customerId) : null,
          status: "Completed",
        })
        .select("id")
        .single();

      if (orderError) {
        alert("Checkout failed: " + orderError.message);
        return;
      }

      if (!order || !order.id) {
        throw new Error("Failed to retrieve new order ID");
      }

      const orderItems = cart.map((item) => ({
        order_id: order.id,
        product_id: item.product.id,
        product_name: item.product.name,
        quantity: item.quantity,
        unit_price: item.product.price,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);
      if (itemsError) {
        console.error("Failed to insert order items:", itemsError);
      }

      for (const item of cart) {
        const { error: rpcError } = await supabase.rpc("decrement_stock", {
          p_id: item.product.id,
          amount: item.quantity,
        });
        if (rpcError) {
          await supabase
            .from("products")
            .update({ stock: item.product.stock - item.quantity })
            .eq("id", item.product.id);
        }
      }

      setCart([]);
      setCustomerId("");
      await load();
    } catch (err: any) {
      console.error("Checkout exception:", err);
      alert(
        "An unexpected error occurred during checkout: " +
          (err.message || String(err)),
      );
    } finally {
      setLoading(false);
    }
  };

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = !filterCat || p.category_id?.toString() === filterCat;
    return matchSearch && matchCat;
  });

  const total = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-6rem)]">
        <div className="text-4xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-error mb-2">POS Error</h2>
        <p className="text-base-content/60">{error}</p>
        <button className="btn btn-primary btn-sm mt-4" onClick={load}>
          Retry Connection
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col h-full items-center justify-center space-y-4">
        <span className="loading loading-spinner loading-lg text-primary"></span>
        <p className="text-sm font-mono opacity-50 animate-pulse">{loadStep}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-6rem)] animate-fade-in max-w-[1600px] mx-auto">
      {/* Left: Products */}
      <div className="flex-1 flex flex-col min-h-0 bg-base-100 border border-base-300 rounded-md shadow-sm">
        <div className="flex flex-col sm:flex-row gap-2 p-4 border-b border-base-300 items-center justify-between bg-base-200/30">
          <h1 className="text-xl font-bold tracking-tight shrink-0 hidden sm:block">
            Point of Sale
          </h1>
          <div className="flex gap-2 w-full sm:w-auto flex-1 sm:max-w-md justify-end">
            <input
              type="text"
              placeholder="Search item..."
              className="input input-sm input-bordered flex-1 rounded-sm bg-base-100"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="select select-sm select-bordered w-32 sm:w-40 rounded-sm bg-base-100 text-xs"
              value={filterCat}
              onChange={(e) => setFilterCat(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="opacity-50 text-sm">
              No items match the current filter.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 p-4 overflow-y-auto flex-1 content-start custom-scrollbar bg-base-200/10">
            {filtered.map((p) => (
              <button
                key={p.id}
                onClick={() => addToCart(p)}
                className="bg-base-100 border border-base-300 rounded-md shadow-sm hover:border-blue-500 overflow-hidden text-left flex flex-col transition-colors group"
              >
                {p.image_url ? (
                  <div className="h-28 w-full bg-base-200 relative overflow-hidden border-b border-base-200">
                    <img
                      src={p.image_url}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                    />
                    {p.stock <= 5 && (
                      <div className="absolute top-1 right-1 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm">
                        LOW STOCK
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-28 w-full bg-base-200 flex items-center justify-center text-3xl opacity-30 border-b border-base-200 relative">
                    🛍️
                    {p.stock <= 5 && (
                      <div className="absolute top-1 right-1 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm opacity-100">
                        LOW STOCK
                      </div>
                    )}
                  </div>
                )}
                <div className="p-3">
                  <h3
                    className="font-semibold text-xs leading-tight mb-1 truncate text-base-content"
                    title={p.name}
                  >
                    {p.name}
                  </h3>
                  <div className="flex justify-between items-end mt-1">
                    <span className="text-blue-600 font-bold text-sm">
                      ${Number(p.price).toFixed(2)}
                    </span>
                    <span className="text-[10px] font-mono text-base-content/50">
                      {p.stock} in stock
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right: Cart */}
      <div className="w-full lg:w-96 shrink-0 flex flex-col h-full bg-base-100 border border-base-300 rounded-md shadow-sm">
        {/* Cart Header */}
        <div className="p-4 border-b border-base-300 bg-base-200/30">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-bold">Current Order</h2>
            <span className="bg-blue-100 text-blue-700 font-bold text-xs px-2 py-0.5 rounded-sm">
              {cart.length} item{cart.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-base-content/60 mb-1 block tracking-wider">
              Customer Link
            </label>
            <select
              className="select select-sm select-bordered w-full rounded-sm bg-base-100 text-xs"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
            >
              <option value="">Walk-in Customer (Guest)</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-0 bg-base-200/10 custom-scrollbar divide-y divide-base-300/50">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-40">
              <span className="text-4xl mb-2">🛒</span>
              <p className="text-sm font-medium">Cart is empty</p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.product.id}
                className="flex items-center gap-2 bg-base-100 p-3 hover:bg-base-200/50"
              >
                <div className="flex-1 min-w-0">
                  <p
                    className="font-semibold text-xs truncate text-base-content leading-tight"
                    title={item.product.name}
                  >
                    {item.product.name}
                  </p>
                  <p className="text-[11px] font-mono text-base-content/60 mt-0.5">
                    ${Number(item.product.price).toFixed(2)} / ea
                  </p>
                </div>
                <div className="flex items-center gap-1 border border-base-300 rounded-sm bg-base-200/50">
                  <button
                    className="btn btn-xs btn-ghost btn-square rounded-none h-6 min-h-0 px-2"
                    onClick={() =>
                      updateQty(item.product.id, item.quantity - 1)
                    }
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M5 12h14" />
                    </svg>
                  </button>
                  <span className="w-6 text-center font-bold text-xs">
                    {item.quantity}
                  </span>
                  <button
                    className="btn btn-xs btn-ghost btn-square rounded-none h-6 min-h-0 px-2"
                    onClick={() =>
                      updateQty(item.product.id, item.quantity + 1)
                    }
                    disabled={item.quantity >= item.product.stock}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </button>
                </div>
                <div className="w-16 text-right font-bold text-xs">
                  ${(item.quantity * item.product.price).toFixed(2)}
                </div>
                <button
                  className="btn btn-xs btn-ghost btn-square text-error hover:bg-red-50 ml-1 h-6 min-h-0 w-6"
                  onClick={() => removeFromCart(item.product.id)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Cart Footer */}
        <div className="p-4 border-t border-base-300 bg-base-100">
          <div className="flex justify-between items-end mb-4 px-1">
            <span className="text-xs font-bold text-base-content/60 uppercase tracking-widest">
              Grand Total
            </span>
            <span className="text-3xl font-bold text-blue-600">
              ${total.toFixed(2)}
            </span>
          </div>
          <button
            className="btn bg-blue-600 hover:bg-blue-700 text-white w-full rounded-md font-bold text-sm border-none"
            onClick={checkout}
            disabled={cart.length === 0}
          >
            Process Transaction
          </button>
        </div>
      </div>
    </div>
  );
}

export default POS;
