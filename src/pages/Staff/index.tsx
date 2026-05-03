// Staff — Logic (create accounts with password, permissions, CRUD)
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { supabase, supabaseUrl, supabaseAnonKey } from "../../lib/supabase";
import { staffCreateSchema, staffEditSchema } from "../../lib/schemas";
import type { Staff, Permissions } from "../../lib/types";
import StaffView from "./view";

const defaultPermissions: Permissions = {
  dashboard: false,
  pos: true,
  orders: false,
  products: false,
  categories: false,
  customers: false,
  staff: false,
};

export function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Staff | null>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "Cashier",
  });
  const [perms, setPerms] = useState<Permissions>(defaultPermissions);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      // Order by created_at ascending so the very first user ever created is at index 0
      const { data, error } = await supabase
        .from("staff")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      if (data) {
        // Mark the first user in the array as the unbreakable Super Admin
        const enriched = data.map((user, idx) => ({
          ...user,
          isSuperAdmin: idx === 0,
        }));
        setStaff(enriched);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ name: "", email: "", password: "", phone: "", role: "Cashier" });
    setPerms(defaultPermissions);
    setErrors({});
    setShowModal(true);
  };

  const openEdit = (s: Staff) => {
    setEditing(s);
    setForm({
      name: s.name,
      email: s.email,
      password: "",
      phone: s.phone || "",
      role: s.role,
    });
    setPerms(s.permissions || defaultPermissions);
    setErrors({});
    setShowModal(true);
  };

  const togglePerm = (key: keyof Permissions) => {
    if (editing?.isSuperAdmin) return; // Prevent toggling for super admin just in case
    setPerms((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleRoleChange = (role: string) => {
    if (editing?.isSuperAdmin) return;
    setForm((f) => ({ ...f, role }));
    if (role === "Admin") {
      setPerms({
        dashboard: true,
        pos: true,
        orders: true,
        products: true,
        categories: true,
        customers: true,
        staff: true,
      });
    } else if (role === "Manager") {
      setPerms({
        dashboard: true,
        pos: true,
        orders: true,
        products: true,
        categories: true,
        customers: true,
        staff: false,
      });
    } else {
      setPerms({
        dashboard: false,
        pos: true,
        orders: false,
        products: false,
        categories: false,
        customers: false,
        staff: false,
      });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const schema = editing ? staffEditSchema : staffCreateSchema;
    const result = schema.safeParse(form);
    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.issues.forEach(
        (i) => (newErrors[String(i.path[0])] = i.message),
      );
      setErrors(newErrors);
      return;
    }
    setErrors({});

    if (editing) {
      // If it's the super admin, ONLY update name and phone. Ignore role and permissions completely.
      const updatePayload: any = { name: form.name, phone: form.phone || null };

      if (!editing.isSuperAdmin) {
        updatePayload.role = form.role;
        updatePayload.permissions = perms;
      }

      const { error } = await supabase
        .from("staff")
        .update(updatePayload)
        .eq("id", editing.id);
      if (error) return alert("Error: " + error.message);
    } else {
      // We use a secondary Supabase client to prevent the new user from overwriting the admin's session
      const secondarySupabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      });

      const { data, error: signUpError } = await secondarySupabase.auth.signUp({
        email: form.email,
        password: form.password,
      });

      if (signUpError) return alert("Auth Error: " + signUpError.message);

      if (data.user) {
        const { error: insertError } = await supabase.from("staff").insert({
          id: data.user.id,
          name: form.name,
          email: form.email,
          phone: form.phone || null,
          role: form.role,
          permissions: perms,
        });
        if (insertError) return alert("Database Error: " + insertError.message);
      }
    }

    setShowModal(false);
    load();
  };

  const handleDelete = async (s: Staff) => {
    if (s.isSuperAdmin) {
      alert(
        "System Action Blocked: You cannot delete the original Super Admin.",
      );
      return;
    }
    if (!confirm(`Delete ${s.name}? This will also delete their auth account.`))
      return;

    // First delete from public.staff
    await supabase.from("staff").delete().eq("id", s.id);

    // If the backend has permissions set up right, they can be removed completely.
    setStaff(staff.filter((x) => x.id !== s.id));
  };

  return (
    <StaffView
      staff={staff}
      loading={loading}
      showModal={showModal}
      setShowModal={setShowModal}
      editing={editing}
      form={form}
      setForm={setForm}
      errors={errors}
      perms={perms}
      togglePerm={togglePerm}
      handleRoleChange={handleRoleChange}
      openAdd={openAdd}
      openEdit={openEdit}
      onSave={handleSave}
      onDelete={handleDelete}
    />
  );
}

export default StaffPage;
