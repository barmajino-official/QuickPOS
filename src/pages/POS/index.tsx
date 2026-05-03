// POS — Logic
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import type { Product, CartItem, Customer } from "../../lib/types";
import POSView from "./view";

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
      setLoading(true);
      setError(null);
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

      // Safeguard against missing order.id
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

  return (
    <POSView
      products={filtered}
      customers={customers}
      categories={categories}
      cart={cart}
      total={total}
      loading={loading}
      search={search}
      setSearch={setSearch}
      filterCat={filterCat}
      setFilterCat={setFilterCat}
      customerId={customerId}
      setCustomerId={setCustomerId}
      addToCart={addToCart}
      updateQty={updateQty}
      removeFromCart={removeFromCart}
      checkout={checkout}
    />
  );
}

export default POS;
