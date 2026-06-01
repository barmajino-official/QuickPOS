/**
 * @file PosPage.tsx
 * @description Interactive checkout. Product grid (search + category filter) on the
 *              left, cart with quantity controls, customer selector and checkout on
 *              the right. Stacks vertically below the `lg` breakpoint.
 *
 * @notes Requires "pos" permission. Checkout posts an order + items and decrements
 *        stock in one backend transaction. Stock is validated locally before adding
 *        to the cart and before incrementing. CSS lives in ./PosPage.css.
 */
import { useEffect, useState } from 'react';

import { productsApi } from '~/api/products';
import { categoriesApi } from '~/api/categories';
import { customersApi } from '~/api/customers';
import { ordersApi } from '~/api/orders';
import { useSessionStore } from '~/store/sessionStore';
import { useUiStore } from '~/store/uiStore';
import { ProtectedRoute } from '~/components/ProtectedRoute/ProtectedRoute';
import { AppLayout } from '~/components/AppLayout/AppLayout';
import { TopBar } from '~/components/AppLayout/TopBar/TopBar';
import type { Product, Category, Customer } from '~/types';

import './PosPage.css';

const LOW_STOCK_THRESHOLD = 5;

interface CartItem {
  productId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
  maxStock: number;
}

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

export default function PosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);

  const staff = useSessionStore((s) => s.staff);
  const showToast = useUiStore((s) => s.showToast);

  useEffect(() => {
    Promise.all([productsApi.list(), categoriesApi.list(), customersApi.list()])
      .then(([prods, cats, custs]) => {
        setProducts(prods as Product[]);
        setCategories(cats as Category[]);
        setCustomers(custs as Customer[]);
      })
      .catch((err: unknown) =>
        showToast(err instanceof Error ? err.message : 'Failed to load POS data', 'error'),
      )
      .finally(() => setLoading(false));
  }, []);

  const filteredProducts = products.filter((p) => {
    const q = search.toLowerCase();
    const matchesSearch =
      p.name.toLowerCase().includes(q) || (p.barcode ?? '').toLowerCase().includes(q);
    const matchesCategory = !categoryFilter || p.categoryId === parseInt(categoryFilter, 10);
    return matchesSearch && matchesCategory;
  });

  const cartTotal = cart.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      showToast('Out of stock', 'error');
      return;
    }
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        if (existing.quantity >= existing.maxStock) {
          showToast('Max stock reached', 'error');
          return prev;
        }
        return prev.map((i) => (i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [
        ...prev,
        { productId: product.id, productName: product.name, unitPrice: product.price, quantity: 1, maxStock: product.stock },
      ];
    });
  };

  const updateQty = (productId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) =>
          i.productId === productId
            ? { ...i, quantity: Math.max(0, Math.min(i.maxStock, i.quantity + delta)) }
            : i,
        )
        .filter((i) => i.quantity > 0),
    );
  };

  const removeFromCart = (productId: number) =>
    setCart((prev) => prev.filter((i) => i.productId !== productId));

  const handleCustomerChange = (e: React.ChangeEvent<HTMLSelectElement>) =>
    setSelectedCustomerId(e.target.value ? parseInt(e.target.value, 10) : null);

  const handleCheckout = async () => {
    if (cart.length === 0) {
      showToast('Cart is empty', 'error');
      return;
    }
    if (!staff) {
      showToast('No active session', 'error');
      return;
    }
    try {
      setProcessing(true);
      await ordersApi.create({
        total: cartTotal,
        status: 'Completed',
        customerId: selectedCustomerId,
        staffId: staff.id,
        items: cart.map((i) => ({
          productId: i.productId,
          productName: i.productName,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        })),
      });
      showToast('Transaction complete', 'success');
      setCart([]);
      setSelectedCustomerId(null);
      setProducts((await productsApi.list()) as Product[]);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Checkout failed', 'error');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <ProtectedRoute permission="pos">
      <AppLayout>
        <TopBar title="Point of Sale" />

        {loading ? (
          <div className="pos_loading">
            <span className="loading loading-spinner loading-lg text-[var(--color-primary)] pos_spinner" />
          </div>
        ) : (
          <div className="pos_layout">

            {/* ── Products ──────────────────────────────────────── */}
            <div className="pos_products">
              <div className="pos_filters">
                <input
                  type="text"
                  placeholder="Search by name or barcode…"
                  className="input input-bordered flex-1 rounded-full bg-[var(--color-base-100)] pos_search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <select
                  className="select select-bordered rounded-full bg-[var(--color-base-100)] sm:min-w-[180px] pos_category"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="">All categories</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="pos_grid_scroll">
                {filteredProducts.length === 0 ? (
                  <div className="pos_grid_empty">No products found.</div>
                ) : (
                  <div className="pos_grid">
                    {filteredProducts.map((p) => {
                      const inCart = cart.some((i) => i.productId === p.id);
                      const isOut = p.stock <= 0;
                      const isLow = p.stock <= LOW_STOCK_THRESHOLD;
                      return (
                        <button
                          key={p.id}
                          onClick={() => addToCart(p)}
                          disabled={isOut}
                          className={`pos_product ${isOut ? 'pos_product_out' : ''} ${inCart ? 'pos_product_active' : ''}`}
                        >
                          {p.imageUrl ? (
                            <img src={p.imageUrl} alt={p.name} className="pos_product_img" />
                          ) : (
                            <div className="pos_product_placeholder">🛍️</div>
                          )}
                          <div className="pos_product_name">{p.name}</div>
                          <div className="pos_product_price">{formatCurrency(p.price)}</div>
                          <div className="pos_product_foot">
                            <span className={`pos_product_stock ${isLow ? 'pos_product_stock_low' : ''}`}>
                              {p.stock} left
                            </span>
                            {isLow && !isOut && <span className="badge badge-error badge-xs pos_product_low_badge">LOW</span>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* ── Cart ──────────────────────────────────────────── */}
            <aside className="pos_cart">
              <div className="pos_cart_head">
                <h2 className="pos_cart_title">Cart ({cart.length})</h2>
              </div>

              <div className="pos_cart_items">
                {cart.length === 0 ? (
                  <div className="pos_cart_empty">Add products to get started</div>
                ) : (
                  cart.map((item) => (
                    <div key={item.productId} className="pos_cart_item">
                      <div className="pos_cart_item_top">
                        <span className="pos_cart_item_name">{item.productName}</span>
                        <button className="pos_cart_item_remove" onClick={() => removeFromCart(item.productId)}>✕</button>
                      </div>
                      <div className="pos_cart_item_bottom">
                        <div className="pos_qty">
                          <button className="pos_qty_btn" onClick={() => updateQty(item.productId, -1)}>−</button>
                          <span className="pos_qty_value">{item.quantity}</span>
                          <button
                            className="pos_qty_btn"
                            onClick={() => updateQty(item.productId, 1)}
                            disabled={item.quantity >= item.maxStock}
                          >+</button>
                        </div>
                        <span className="pos_cart_item_total">{formatCurrency(item.unitPrice * item.quantity)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="pos_cart_foot">
                <select className="select select-bordered w-full rounded-2xl text-sm pos_cart_customer" value={selectedCustomerId ?? ''} onChange={handleCustomerChange}>
                  <option value="">Guest (no account)</option>
                  {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>

                <div className="pos_cart_total_row">
                  <span className="pos_cart_total_label">Grand Total</span>
                  <span className="pos_cart_total_value">{formatCurrency(cartTotal)}</span>
                </div>

                <button
                  className="btn btn-primary w-full rounded-full text-base font-semibold shadow-sm pos_checkout"
                  onClick={handleCheckout}
                  disabled={cart.length === 0 || processing}
                >
                  {processing ? <span className="loading loading-spinner loading-sm" /> : 'Process Transaction'}
                </button>
              </div>
            </aside>

          </div>
        )}
      </AppLayout>
    </ProtectedRoute>
  );
}
