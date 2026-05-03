import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { customerSchema } from "../../lib/schemas";
import type { Customer } from "../../lib/types";
import { Field, inputCls, FormModal } from "../../components/FormField";

export function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadStep, setLoadStep] = useState("Initializing Customers...");
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
      console.log("Customers: Starting data load...");
      setLoading(true);
      setError(null);
      setLoadStep("Fetching customer records...");
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
            Customer Database
          </h1>
          <p className="text-sm opacity-60">
            Manage client profiles and contact information.
          </p>
        </div>
        <button
          className="btn btn-primary btn-sm rounded-md shadow-sm"
          onClick={openAdd}
        >
          + New Customer
        </button>
      </div>

      <div className="bg-base-100 border border-base-300 shadow-sm rounded-md overflow-hidden">
        {/* Toolbar */}
        <div className="p-3 border-b border-base-300 bg-base-200/30">
          <input
            type="text"
            placeholder="Search customer records..."
            className="input input-sm input-bordered w-full sm:max-w-md rounded-sm bg-base-100"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 opacity-50 text-sm">
            No customers found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-zebra table-sm w-full">
              <thead className="bg-base-200/50 text-base-content/70">
                <tr>
                  <th className="font-semibold uppercase tracking-wider text-[10px]">
                    Customer Name
                  </th>
                  <th className="font-semibold uppercase tracking-wider text-[10px]">
                    Contact Info
                  </th>
                  <th className="font-semibold uppercase tracking-wider text-[10px]">
                    Address Details
                  </th>
                  <th className="font-semibold uppercase tracking-wider text-[10px]">
                    Client Since
                  </th>
                  <th className="text-right font-semibold uppercase tracking-wider text-[10px]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-base-200/30">
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-sm bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs border border-blue-200">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-sm text-base-content">
                          {c.name}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="text-xs">
                        {c.email && (
                          <div className="text-base-content/80">{c.email}</div>
                        )}
                        {c.phone && (
                          <div className="font-mono text-base-content/60 mt-0.5">
                            {c.phone}
                          </div>
                        )}
                        {!c.email && !c.phone && (
                          <span className="opacity-40">—</span>
                        )}
                      </div>
                    </td>
                    <td className="max-w-xs truncate text-xs text-base-content/70">
                      {c.address || "—"}
                    </td>
                    <td className="text-xs opacity-60 font-mono">
                      {new Date(c.created_at).toLocaleDateString()}
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          className="btn btn-xs btn-ghost text-blue-600 rounded-sm px-2"
                          onClick={() => openEdit(c)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-xs btn-ghost text-error rounded-sm px-2"
                          onClick={() => handleDelete(c)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <FormModal
          title={editing ? "Edit Customer Profile" : "New Customer Profile"}
          onClose={() => setShowModal(false)}
          onSubmit={handleSave}
          formId="customer-form"
          submitLabel={editing ? "Save Changes" : "Create Record"}
          size="lg"
        >
          <div className="space-y-4">
            <Field label="Full Name" required error={errors.name}>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={inputCls(!!errors.name)}
              />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Phone Number" error={errors.phone}>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className={inputCls(!!errors.phone)}
                />
              </Field>
              <Field label="Email Address" error={errors.email}>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={inputCls(!!errors.email)}
                />
              </Field>
            </div>
            <Field label="Physical Address" error={errors.address}>
              <textarea
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className={`${inputCls(!!errors.address)} h-20 resize-none`}
              />
            </Field>
          </div>
        </FormModal>
      )}
    </div>
  );
}

export default Customers;
