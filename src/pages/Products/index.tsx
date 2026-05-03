import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { uploadProductImage, deleteProductImage } from "../../lib/storage";
import { productSchema } from "../../lib/schemas";
import type { Product, Category } from "../../lib/types";
import { Field, inputCls, FormModal } from "../../components/FormField";

export function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadStep, setLoadStep] = useState("Initializing Inventory...");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState({
    name: "",
    price: 0,
    stock: 0,
    category_id: "",
    expiry_date: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      console.log("Products: Starting data load...");
      setLoading(true);
      setError(null);
      setLoadStep("Fetching products and categories...");
      const [prod, cat] = await Promise.all([
        supabase.from("products").select("*, categories(name)").order("name"),
        supabase.from("categories").select("*").order("name"),
      ]);

      if (prod.error || cat.error)
        throw new Error("Database error loading products.");

      setProducts(prod.data || []);
      setCategories(cat.data || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ name: "", price: 0, stock: 0, category_id: "", expiry_date: "" });
    setErrors({});
    setImageFile(null);
    setShowModal(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name,
      price: p.price,
      stock: p.stock,
      category_id: p.category_id?.toString() || "",
      expiry_date: p.expiry_date || "",
    });
    setErrors({});
    setImageFile(null);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = productSchema.safeParse(form);
    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.issues.forEach(
        (i) => (newErrors[String(i.path[0])] = i.message),
      );
      setErrors(newErrors);
      return;
    }
    setErrors({});

    setSaving(true);
    try {
      const data = result.data;

      let image_url: string | null = editing?.image_url || null;
      if (imageFile) {
        if (editing?.image_url) await deleteProductImage(editing.image_url);
        image_url = await uploadProductImage(imageFile);
      }

      const payload = {
        name: data.name,
        price: data.price,
        stock: data.stock,
        category_id: data.category_id ? parseInt(data.category_id) : null,
        expiry_date: data.expiry_date || null,
        image_url,
      };

      if (editing) {
        const { error } = await supabase
          .from("products")
          .update(payload)
          .eq("id", editing.id);
        if (error) {
          alert(error.message);
          return;
        }
      } else {
        const { error } = await supabase.from("products").insert([payload]);
        if (error) {
          alert(error.message);
          return;
        }
      }
      setShowModal(false);
      load();
    } catch (err) {
      console.error(err);
      alert("An unexpected error occurred while saving.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (p: Product) => {
    if (!confirm("Delete this product?")) return;
    if (p.image_url) await deleteProductImage(p.image_url);
    await supabase.from("products").delete().eq("id", p.id);
    setProducts(products.filter((x) => x.id !== p.id));
  };

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = !filterCat || p.category_id?.toString() === filterCat;
    return matchSearch && matchCat;
  });

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

  if (loading) {
    return (
      <div className="flex flex-col h-full items-center justify-center space-y-4">
        <span className="loading loading-spinner loading-lg text-primary"></span>
        <p className="text-sm font-mono opacity-50 animate-pulse">{loadStep}</p>
      </div>
    );
  }

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
        {filtered.length === 0 ? (
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
                {filtered.map((p) => {
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
                            onClick={() => handleDelete(p)}
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
          onSubmit={handleSave}
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

export default Products;
