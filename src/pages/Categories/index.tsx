// Categories — Logic
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { categorySchema } from "../../lib/schemas";
import type { Category } from "../../lib/types";
import CategoriesView from "./view";

export function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: "", description: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: apiError } = await supabase
        .from("categories")
        .select("*")
        .order("name");
      if (apiError) throw apiError;
      setCategories(data || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ name: "", description: "" });
    setErrors({});
    setShowModal(true);
  };

  const openEdit = (c: Category) => {
    setEditing(c);
    setForm({ name: c.name, description: c.description || "" });
    setErrors({});
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = categorySchema.safeParse(form);
    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.issues.forEach(
        (i) => (newErrors[String(i.path[0])] = i.message),
      );
      setErrors(newErrors);
      return;
    }
    setErrors({});
    const data = result.data;

    if (editing) {
      await supabase.from("categories").update(data).eq("id", editing.id);
    } else {
      await supabase.from("categories").insert([data]);
    }
    setShowModal(false);
    load();
  };

  const handleDelete = async (c: Category) => {
    if (!confirm("Delete category?")) return;
    await supabase.from("categories").delete().eq("id", c.id);
    setCategories(categories.filter((x) => x.id !== c.id));
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
    <CategoriesView
      categories={categories}
      loading={loading}
      showModal={showModal}
      setShowModal={setShowModal}
      editing={editing}
      form={form}
      setForm={setForm}
      errors={errors}
      openAdd={openAdd}
      openEdit={openEdit}
      onSave={handleSave}
      onDelete={handleDelete}
    />
  );
}

export default Categories;
