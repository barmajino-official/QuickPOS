import type { Product, CartItem, Customer } from "../../lib/types";

interface Props {
  products: Product[];
  customers: Customer[];
  categories: { id: number; name: string }[];
  cart: CartItem[];
  total: number;
  loading: boolean;
  search: string;
  setSearch: (v: string) => void;
  filterCat: string;
  setFilterCat: (v: string) => void;
  customerId: string;
  setCustomerId: (v: string) => void;
  addToCart: (p: Product) => void;
  updateQty: (id: number, qty: number) => void;
  removeFromCart: (id: number) => void;
  checkout: () => void;
}

export default function POSView({
  products,
  customers,
  categories,
  cart,
  total,
  loading,
  search,
  setSearch,
  filterCat,
  setFilterCat,
  customerId,
  setCustomerId,
  addToCart,
  updateQty,
  removeFromCart,
  checkout,
}: Props) {
  if (loading)
    return (
      <div className="flex justify-center h-full items-center">
        <span className="loading loading-spinner text-primary"></span>
      </div>
    );

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

        {products.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="opacity-50 text-sm">
              No items match the current filter.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 p-4 overflow-y-auto flex-1 content-start custom-scrollbar bg-base-200/10">
            {products.map((p) => (
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
