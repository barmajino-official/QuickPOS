// Products — Logic (CRUD + image upload + category filter)
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { uploadProductImage, deleteProductImage } from "../../lib/storage";
import { productSchema } from "../../lib/schemas";
import type { Product, Category } from "../../lib/types";
import ProductsView from "./view";

export function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
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
      setLoading(true);
      setError(null);
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

  return (
    <ProductsView
      products={filtered}
      categories={categories}
      loading={loading}
      saving={saving}
      search={search}
      setSearch={setSearch}
      filterCat={filterCat}
      setFilterCat={setFilterCat}
      showModal={showModal}
      setShowModal={setShowModal}
      editing={editing}
      form={form}
      setForm={setForm}
      errors={errors}
      imageFile={imageFile}
      setImageFile={setImageFile}
      openAdd={openAdd}
      openEdit={openEdit}
      onSave={handleSave}
      onDelete={handleDelete}
    />
  );
}

export default Products;
