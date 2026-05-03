import type { Product, Category } from "../../lib/types";
import { Field, inputCls, FormModal } from "../../components/FormField";

interface Props {
  products: Product[];
  categories: Category[];
  loading: boolean;
  saving: boolean;
  search: string;
  setSearch: (v: string) => void;
  filterCat: string;
  setFilterCat: (v: string) => void;
  showModal: boolean;
  setShowModal: (v: boolean) => void;
  editing: Product | null;
  form: {
    name: string;
    price: number;
    stock: number;
    category_id: string;
    expiry_date: string;
  };
  setForm: (v: any) => void;
  errors: Record<string, string>;
  imageFile: File | null;
  setImageFile: (f: File | null) => void;
  openAdd: () => void;
  openEdit: (p: Product) => void;
  onSave: (e: React.FormEvent) => void;
  onDelete: (p: Product) => void;
}

export default function ProductsView({
  products,
  categories,
  loading,
  saving,
  search,
  setSearch,
  filterCat,
  setFilterCat,
  showModal,
  setShowModal,
  editing,
  form,
  setForm,
  errors,
  imageFile,
  setImageFile,
  openAdd,
  openEdit,
  onSave,
  onDelete,
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
            Inventory Management
          </h1>
          <p className="text-sm opacity-60">
            Manage products, pricing, and stock levels.
          </p>
        </div>
        <button
          className="btn btn-primary btn-sm rounded-md shadow-sm"
          onClick={openAdd}
        >
          + New Product
        </button>
      </div>

      <div className="bg-base-100 border border-base-300 shadow-sm rounded-md overflow-hidden">
        {/* Toolbar */}
        <div className="p-3 border-b border-base-300 bg-base-200/30 flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Search by name or SKU..."
            className="input input-sm input-bordered flex-1 rounded-sm bg-base-100"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="select select-sm select-bordered w-full sm:w-48 rounded-sm bg-base-100 text-xs"
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

        {/* Table */}
        {products.length === 0 ? (
          <div className="text-center py-16 opacity-50 text-sm">
            No products found matching the criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-zebra table-sm w-full">
              <thead className="bg-base-200/50 text-base-content/70">
                <tr>
                  <th className="font-semibold uppercase tracking-wider text-[10px] w-12">
                    Img
                  </th>
                  <th className="font-semibold uppercase tracking-wider text-[10px]">
                    Product Info
                  </th>
                  <th className="font-semibold uppercase tracking-wider text-[10px]">
                    Category
                  </th>
                  <th className="font-semibold uppercase tracking-wider text-[10px] text-right">
                    Price
                  </th>
                  <th className="font-semibold uppercase tracking-wider text-[10px] text-right">
                    Stock
                  </th>
                  <th className="font-semibold uppercase tracking-wider text-[10px]">
                    Expiry
                  </th>
                  <th className="font-semibold uppercase tracking-wider text-[10px] text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const isExpiring =
                    p.expiry_date &&
                    new Date(p.expiry_date) <=
                      new Date(Date.now() + 7 * 86400000);
                  const isExpired =
                    p.expiry_date && new Date(p.expiry_date) < new Date();
                  return (
                    <tr key={p.id} className="hover:bg-base-200/30">
                      <td className="py-2">
                        {p.image_url ? (
                          <div className="w-8 h-8 rounded-sm border border-base-300 overflow-hidden">
                            <img
                              src={p.image_url}
                              alt={p.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-sm bg-base-300 flex items-center justify-center text-[10px] text-base-content/50 border border-base-300">
                            Img
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="font-semibold text-sm leading-tight text-base-content">
                          {p.name}
                        </div>
                        <div className="text-[10px] font-mono text-base-content/50 mt-0.5">
                          ID: {p.id.toString().padStart(5, "0")}
                        </div>
                      </td>
                      <td>
                        <span className="text-xs text-base-content/70 bg-base-200 px-2 py-0.5 rounded-sm border border-base-300">
                          {p.categories?.name || "Uncategorized"}
                        </span>
                      </td>
                      <td className="font-bold text-sm text-right text-base-content">
                        ${Number(p.price).toFixed(2)}
                      </td>
                      <td className="text-right">
                        <div className="flex flex-col items-end">
                          <span
                            className={`text-sm font-bold ${p.stock <= 5 ? "text-error" : "text-base-content"}`}
                          >
                            {p.stock}
                          </span>
                          {p.stock === 0 && (
                            <span className="text-[9px] font-bold text-error bg-error/10 px-1 rounded-sm mt-0.5 uppercase tracking-wide">
                              Out
                            </span>
                          )}
                          {p.stock > 0 && p.stock <= 5 && (
                            <span className="text-[9px] font-bold text-warning-content bg-warning/20 px-1 rounded-sm mt-0.5 uppercase tracking-wide">
                              Low
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="text-xs">
                        {p.expiry_date ? (
                          <span
                            className={`px-1.5 py-0.5 rounded-sm border ${isExpired ? "bg-error/10 border-error/20 text-error font-bold" : isExpiring ? "bg-warning/10 border-warning/20 text-warning-content font-bold" : "bg-base-100 border-base-300 text-base-content/60"}`}
                          >
                            {p.expiry_date}
                          </span>
                        ) : (
                          <span className="text-base-content/30">—</span>
                        )}
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            className="btn btn-xs btn-ghost text-blue-600 rounded-sm px-2"
                            onClick={() => openEdit(p)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-xs btn-ghost text-error rounded-sm px-2"
                            onClick={() => onDelete(p)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <FormModal
          title={editing ? "Edit Product Record" : "New Product Record"}
          onClose={() => setShowModal(false)}
          onSubmit={onSave}
          formId="product-form"
          saving={saving}
          submitLabel={editing ? "Save Changes" : "Create Record"}
          size="lg"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              <Field label="Product Name" required error={errors.name}>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={inputCls(!!errors.name)}
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Retail Price ($)" required error={errors.price}>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.price}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        price: parseFloat(e.target.value) || 0,
                      })
                    }
                    className={inputCls(!!errors.price)}
                  />
                </Field>
                <Field label="Initial Stock Qty" required error={errors.stock}>
                  <input
                    type="number"
                    min="0"
                    value={form.stock}
                    onChange={(e) =>
                      setForm({ ...form, stock: parseInt(e.target.value) || 0 })
                    }
                    className={inputCls(!!errors.stock)}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Category Assignment" error={errors.category_id}>
                  <select
                    value={form.category_id}
                    onChange={(e) =>
                      setForm({ ...form, category_id: e.target.value })
                    }
                    className={inputCls(!!errors.category_id)}
                  >
                    <option value="">Uncategorized</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Expiration Date" error={errors.expiry_date}>
                  <input
                    type="date"
                    value={form.expiry_date}
                    onChange={(e) =>
                      setForm({ ...form, expiry_date: e.target.value })
                    }
                    className={inputCls(!!errors.expiry_date)}
                  />
                </Field>
              </div>
            </div>

            <div className="space-y-4 border-t md:border-t-0 md:border-l border-base-300 pt-4 md:pt-0 md:pl-6">
              <Field label="Product Image">
                <div className="border-2 border-dashed border-base-300 rounded-sm p-4 text-center bg-base-200/20">
                  {editing?.image_url && !imageFile ? (
                    <div className="mb-3">
                      <img
                        src={editing.image_url}
                        alt="current"
                        className="w-24 h-24 object-cover mx-auto rounded-sm border border-base-300 shadow-sm"
                      />
                      <p className="text-[10px] text-base-content/50 mt-1">
                        Current Image
                      </p>
                    </div>
                  ) : (
                    <div className="w-16 h-16 mx-auto bg-base-200 rounded-sm flex items-center justify-center text-base-content/40 mb-3 border border-base-300">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect
                          width="18"
                          height="18"
                          x="3"
                          y="3"
                          rx="2"
                          ry="2"
                        />
                        <circle cx="9" cy="9" r="2" />
                        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                      </svg>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="file-input file-input-bordered file-input-sm w-full text-xs rounded-sm"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  />
                </div>
              </Field>
            </div>
          </div>
        </FormModal>
      )}
    </div>
  );
}
