/**
 * @file PosPage.tsx
 * @description Interactive checkout. Product grid (search + category filter) on the
 *              left, cart with quantity controls, customer selector and checkout on
 *              the right. Stacks vertically below the `lg` breakpoint.
 *
 * @notes Requires "pos" permission. Checkout posts an order + items and decrements
 *        stock in one backend transaction. Stock is validated locally before adding
 *        to the cart and before incrementing.
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
          <div className="flex items-center justify-center flex-1">
            <span className="loading loading-spinner loading-lg text-[var(--color-primary)]" />
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row flex-1 lg:overflow-hidden min-h-0">

            {/* ── Products ──────────────────────────────────────── */}
            <div className="flex-1 flex flex-col min-w-0 p-4 sm:p-6 lg:overflow-hidden">
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <input
                  type="text"
                  placeholder="Search by name or barcode…"
                  className="input input-bordered flex-1 rounded-full bg-[var(--color-base-100)] focus:outline-none focus:border-[var(--color-primary)]"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <select
                  className="select select-bordered rounded-full bg-[var(--color-base-100)] sm:min-w-[180px]"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="">All categories</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="flex-1 lg:overflow-y-auto">
                {filteredProducts.length === 0 ? (
                  <div className="flex items-center justify-center h-40 text-[var(--color-neutral)]">No products found.</div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
                    {filteredProducts.map((p) => {
                      const inCart = cart.some((i) => i.productId === p.id);
                      const isOut = p.stock <= 0;
                      const isLow = p.stock <= LOW_STOCK_THRESHOLD;
                      return (
                        <button
                          key={p.id}
                          onClick={() => addToCart(p)}
                          disabled={isOut}
                          className={`bg-[var(--color-base-100)] border text-left p-3 rounded-[20px] cursor-pointer [transition:border-color_0.2s_var(--m3-standard),transform_0.2s_var(--m3-emphasized),box-shadow_0.2s_var(--m3-standard)] enabled:hover:border-[var(--color-primary)] enabled:hover:-translate-y-[2px] enabled:hover:shadow-[0px_1px_2px_0px_rgba(0,0,0,0.3),0px_2px_6px_2px_rgba(0,0,0,0.15)] enabled:active:translate-y-0 enabled:active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${inCart ? 'border-[var(--color-primary)] shadow-[0_0_0_1px_var(--color-primary)]' : 'border-[var(--color-base-300)]'}`}
                        >
                          {p.imageUrl ? (
                            <img src={p.imageUrl} alt={p.name} className="w-full aspect-square object-cover rounded-xl mb-2" />
                          ) : (
                            <div className="w-full aspect-square bg-[var(--color-base-200)] rounded-xl mb-2 flex items-center justify-center text-3xl">🛍️</div>
                          )}
                          <div className="text-sm font-medium leading-tight line-clamp-2 text-[var(--color-base-content)]">{p.name}</div>
                          <div className="text-[var(--color-primary)] font-bold text-sm mt-1">{formatCurrency(p.price)}</div>
                          <div className="flex justify-between items-center mt-2">
                            <span className={`text-xs text-[var(--color-neutral)] ${isLow ? 'text-[var(--color-error)]' : ''}`}>
                              {p.stock} left
                            </span>
                            {isLow && !isOut && <span className="badge badge-error badge-xs">LOW</span>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* ── Cart ──────────────────────────────────────────── */}
            <aside className="w-full lg:w-[360px] flex-shrink-0 bg-[var(--color-base-100)] flex flex-col border-t lg:border-t-0 lg:border-l border-[var(--color-base-300)]">
              <div className="px-5 py-4 border-b border-[var(--color-base-300)]">
                <h2 className="text-base font-semibold text-[var(--color-base-content)]">Cart ({cart.length})</h2>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2 lg:min-h-0 max-h-[40vh] lg:max-h-none">
                {cart.length === 0 ? (
                  <div className="text-center text-[var(--color-neutral)] py-10 text-sm">Add products to get started</div>
                ) : (
                  cart.map((item) => (
                    <div key={item.productId} className="rounded-2xl p-3 bg-[color-mix(in_srgb,var(--color-base-200)_50%,transparent)]">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-medium leading-tight flex-1 mr-2 text-[var(--color-base-content)]">{item.productName}</span>
                        <button className="text-[var(--color-error)] text-xs shrink-0" onClick={() => removeFromCart(item.productId)}>✕</button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button className="flex items-center justify-center w-7 h-7 rounded-full border border-[var(--color-base-300)] text-[var(--color-base-content)] [transition:background-color_0.15s_var(--m3-standard)] enabled:hover:bg-[var(--color-base-200)] disabled:opacity-40 disabled:cursor-not-allowed" onClick={() => updateQty(item.productId, -1)}>−</button>
                          <span className="text-sm font-bold w-6 text-center">{item.quantity}</span>
                          <button
                            className="flex items-center justify-center w-7 h-7 rounded-full border border-[var(--color-base-300)] text-[var(--color-base-content)] [transition:background-color_0.15s_var(--m3-standard)] enabled:hover:bg-[var(--color-base-200)] disabled:opacity-40 disabled:cursor-not-allowed"
                            onClick={() => updateQty(item.productId, 1)}
                            disabled={item.quantity >= item.maxStock}
                          >+</button>
                        </div>
                        <span className="text-sm font-semibold text-[var(--color-primary)]">{formatCurrency(item.unitPrice * item.quantity)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-4 border-t border-[var(--color-base-300)] space-y-3">
                <select className="select select-bordered w-full rounded-2xl text-sm" value={selectedCustomerId ?? ''} onChange={handleCustomerChange}>
                  <option value="">Guest (no account)</option>
                  {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>

                <div className="flex justify-between items-center py-1">
                  <span className="text-sm font-medium text-[var(--color-neutral)]">Grand Total</span>
                  <span className="text-2xl font-bold text-[var(--color-primary)]">{formatCurrency(cartTotal)}</span>
                </div>

                <button
                  className="btn btn-primary w-full rounded-full text-base font-semibold shadow-sm"
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
