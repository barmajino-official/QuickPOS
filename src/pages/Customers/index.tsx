// Customers — Logic
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { customerSchema } from "../../lib/schemas";
import type { Customer } from "../../lib/types";
import CustomersView from "./view";

export function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: apiError } = await supabase
        .from("customers")
        .select("*")
        .order("name");
      if (apiError) throw apiError;
      setCustomers(data || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ name: "", phone: "", email: "", address: "" });
    setErrors({});
    setShowModal(true);
  };

  const openEdit = (c: Customer) => {
    setEditing(c);
    setForm({
      name: c.name,
      phone: c.phone || "",
      email: c.email || "",
      address: c.address || "",
    });
    setErrors({});
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = customerSchema.safeParse(form);
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
      await supabase.from("customers").update(data).eq("id", editing.id);
    } else {
      await supabase.from("customers").insert([data]);
    }
    setShowModal(false);
    load();
  };

  const handleDelete = async (c: Customer) => {
    if (!confirm("Delete customer?")) return;
    await supabase.from("customers").delete().eq("id", c.id);
    setCustomers(customers.filter((x) => x.id !== c.id));
  };

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.email && c.email.toLowerCase().includes(search.toLowerCase())) ||
      (c.phone && c.phone.includes(search)),
  );

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
    <CustomersView
      customers={filtered}
      loading={loading}
      search={search}
      setSearch={setSearch}
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

export default Customers;
