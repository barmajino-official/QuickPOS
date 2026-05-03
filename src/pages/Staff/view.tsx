import type { Staff, Permissions } from "../../lib/types";
import {
  Field,
  inputCls,
  FormModal,
  FormSection,
} from "../../components/FormField";

interface Props {
  staff: Staff[];
  loading: boolean;
  showModal: boolean;
  setShowModal: (v: boolean) => void;
  editing: Staff | null;
  form: {
    name: string;
    email: string;
    password: string;
    phone: string;
    role: string;
  };
  setForm: (v: any) => void;
  errors: Record<string, string>;
  perms: Permissions;
  togglePerm: (k: keyof Permissions) => void;
  handleRoleChange: (r: string) => void;
  openAdd: () => void;
  openEdit: (s: Staff) => void;
  onSave: (e: React.FormEvent) => void;
  onDelete: (s: Staff) => void;
}

const permissionLabels: Record<keyof Permissions, string> = {
  dashboard: "View Dashboard Stats",
  pos: "Use Point of Sale (Sell)",
  orders: "View & Manage Orders",
  products: "Manage Products",
  categories: "Manage Categories",
  customers: "Manage Customers",
  staff: "Manage Staff Accounts",
};

export default function StaffView({
  staff,
  loading,
  showModal,
  setShowModal,
  editing,
  form,
  setForm,
  errors,
  perms,
  togglePerm,
  handleRoleChange,
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
    <div className="animate-fade-in max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-base-content">
            Staff Directory
          </h1>
          <p className="text-sm opacity-60">
            Manage employee accounts and access permissions.
          </p>
        </div>
        <button
          className="btn btn-primary btn-sm rounded-md shadow-sm"
          onClick={openAdd}
        >
          + Create Staff Account
        </button>
      </div>

      <div className="bg-base-100 border border-base-300 shadow-sm rounded-md overflow-hidden">
        {staff.length === 0 ? (
          <div className="text-center py-16 opacity-50 text-sm">
            No staff found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-zebra table-sm w-full">
              <thead className="bg-base-200/50 text-base-content/70">
                <tr>
                  <th className="font-semibold uppercase tracking-wider text-[10px]">
                    Name
                  </th>
                  <th className="font-semibold uppercase tracking-wider text-[10px]">
                    Email
                  </th>
                  <th className="font-semibold uppercase tracking-wider text-[10px]">
                    Role
                  </th>
                  <th className="font-semibold uppercase tracking-wider text-[10px]">
                    Date Added
                  </th>
                  <th className="text-right font-semibold uppercase tracking-wider text-[10px]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {staff.map((s) => (
                  <tr key={s.id} className="hover:bg-base-200/30">
                    <td className="font-medium text-sm py-3 flex items-center gap-2">
                      {s.name}
                      {s.isSuperAdmin && (
                        <span className="badge badge-primary badge-sm text-[9px] uppercase font-bold tracking-widest px-1.5 h-4 border-none opacity-80">
                          Owner
                        </span>
                      )}
                    </td>
                    <td className="text-sm opacity-80">{s.email}</td>
                    <td>
                      <span
                        className={`badge badge-sm rounded-sm text-[10px] font-bold tracking-wide uppercase border-none ${s.role === "Admin" ? "bg-error/10 text-error" : s.role === "Manager" ? "bg-info/10 text-info" : "bg-base-300 text-base-content/70"}`}
                      >
                        {s.role}
                      </span>
                    </td>
                    <td className="text-xs opacity-60">
                      {new Date(s.created_at).toLocaleDateString()}
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          className="btn btn-xs btn-ghost text-blue-600 rounded-sm"
                          onClick={() => openEdit(s)}
                        >
                          Edit
                        </button>
                        {s.isSuperAdmin ? (
                          <span className="text-[10px] uppercase font-bold tracking-widest opacity-30 px-3 py-1">
                            Locked
                          </span>
                        ) : (
                          <button
                            className="btn btn-xs btn-ghost text-error rounded-sm"
                            onClick={() => onDelete(s)}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <FormModal
          title={editing ? "Edit Staff Profile" : "New Staff Account"}
          onClose={() => setShowModal(false)}
          onSubmit={onSave}
          formId="staff-form"
          submitLabel={editing ? "Save Changes" : "Create Staff"}
          size="lg"
        >
          <div className="space-y-6">
            {/* Basic Info */}
            <div>
              <FormSection title="Basic Information" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Full Name" required error={errors.name}>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className={inputCls(!!errors.name)}
                  />
                </Field>
                <Field label="Phone Number" error={errors.phone}>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                    className={inputCls(!!errors.phone)}
                  />
                </Field>
              </div>

              {!editing && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <Field label="Email Address" required error={errors.email}>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) =>
                        setForm({ ...form, email: e.target.value })
                      }
                      className={inputCls(!!errors.email)}
                    />
                  </Field>
                  <Field
                    label="Initial Password"
                    required
                    error={errors.password}
                  >
                    <input
                      type="password"
                      value={form.password}
                      onChange={(e) =>
                        setForm({ ...form, password: e.target.value })
                      }
                      className={inputCls(!!errors.password)}
                    />
                  </Field>
                </div>
              )}
            </div>

            {/* Role & Permissions */}
            <div>
              <FormSection title="Access Control" />

              {editing?.isSuperAdmin ? (
                <div className="bg-warning/10 border border-warning/20 rounded-sm p-4 mt-2">
                  <div className="flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-warning"
                    >
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                    <p className="text-sm text-warning-content font-bold">
                      System Owner Account
                    </p>
                  </div>
                  <p className="text-xs text-warning-content/80 mt-1">
                    This is the original master account. The role and
                    permissions for this account are permanently locked to full
                    access and cannot be downgraded.
                  </p>
                </div>
              ) : (
                <>
                  <div className="mb-4 mt-2">
                    <Field label="Assign Role">
                      <select
                        value={form.role}
                        onChange={(e) => handleRoleChange(e.target.value)}
                        className={inputCls()}
                      >
                        <option>Admin</option>
                        <option>Manager</option>
                        <option>Cashier</option>
                      </select>
                    </Field>
                  </div>

                  <div className="bg-base-200/50 border border-base-300 rounded-sm p-4">
                    <p className="text-xs font-semibold mb-3">
                      Granular Permissions
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6">
                      {(
                        Object.keys(permissionLabels) as Array<
                          keyof Permissions
                        >
                      ).map((key) => (
                        <label
                          key={key}
                          className="cursor-pointer label justify-start gap-3 py-1 hover:bg-base-200 rounded px-2 -mx-2 transition-colors"
                        >
                          <input
                            type="checkbox"
                            className="checkbox checkbox-sm checkbox-primary rounded-sm"
                            checked={perms[key]}
                            onChange={() => togglePerm(key)}
                          />
                          <span className="label-text text-sm select-none">
                            {permissionLabels[key]}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </FormModal>
      )}
    </div>
  );
}
