/**
 * @file StaffPage.tsx
 * @description Staff directory with account creation, role assignment, and granular
 *              permission management. Full-width responsive table + modal.
 *
 * @notes Requires "staff" permission. Creating a member calls the backend which
 *        provisions both auth.users and public.staff. A user cannot delete their
 *        own account. CSS lives in ./StaffPage.css.
 */
import { useEffect, useState } from 'react';

import { staffApi } from '~/api/staff';
import { useSessionStore } from '~/store/sessionStore';
import { useUiStore } from '~/store/uiStore';
import { ProtectedRoute } from '~/components/ProtectedRoute/ProtectedRoute';
import { AppLayout } from '~/components/AppLayout/AppLayout';
import { TopBar } from '~/components/AppLayout/TopBar/TopBar';
import type { Staff } from '~/types';

const ALL_PERMISSIONS = ['dashboard', 'pos', 'orders', 'products', 'categories', 'customers', 'staff'] as const;

const DEFAULT_PERMISSIONS: Record<string, boolean> = {
  dashboard: false, pos: true, orders: false,
  products: false, categories: false, customers: false, staff: false,
};

const roleClass = (role: string) => {
  if (role === 'Admin') return 'badge badge-primary font-medium';
  if (role === 'Manager') return 'badge badge-secondary font-medium';
  return 'badge badge-ghost font-medium';
};

export default function StaffPage() {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const me = useSessionStore((s) => s.staff);
  const showToast = useUiStore((s) => s.showToast);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', phone: '', role: 'Cashier',
    permissions: { ...DEFAULT_PERMISSIONS },
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setStaffList((await staffApi.list()) as Staff[]);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to load staff', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const openModal = (s?: Staff) => {
    if (s) {
      setEditingId(s.id);
      setFormData({ name: s.name, email: s.email, password: '', phone: s.phone ?? '', role: s.role, permissions: { ...s.permissions } });
    } else {
      setEditingId(null);
      setFormData({ name: '', email: '', password: '', phone: '', role: 'Cashier', permissions: { ...DEFAULT_PERMISSIONS } });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await staffApi.update(editingId, {
          name: formData.name, phone: formData.phone || null,
          role: formData.role, permissions: formData.permissions,
        });
        showToast('Staff member updated', 'success');
      } else {
        await staffApi.create({
          name: formData.name, email: formData.email, password: formData.password,
          phone: formData.phone || null, role: formData.role, permissions: formData.permissions,
        });
        showToast('Staff member created', 'success');
      }
      closeModal();
      loadData();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to save staff member', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (id === me?.id) {
      showToast('You cannot delete your own account', 'error');
      return;
    }
    if (!window.confirm('Delete this staff member?')) return;
    try {
      await staffApi.remove(id);
      showToast('Staff member deleted', 'success');
      loadData();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to delete staff member', 'error');
    }
  };

  const togglePermission = (key: string) => {
    setFormData((prev) => ({
      ...prev,
      permissions: { ...prev.permissions, [key]: !prev.permissions[key] },
    }));
  };

  return (
    <ProtectedRoute permission="staff">
      <AppLayout>
        <TopBar
          title="Staff"
          actions={
            <button className="btn btn-primary btn-sm rounded-full px-6 font-medium shadow-sm" onClick={() => openModal()}>
              + New Staff
            </button>
          }
        />

        <div className="p-4 sm:p-6 lg:p-8 w-full animate-[fadeUp_0.5s_var(--m3-emphasized)_both]">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <span className="loading loading-spinner loading-lg text-[var(--color-primary)]" />
            </div>
          ) : (
            <div className="bg-[var(--color-base-100)] rounded-[24px] shadow-sm w-full overflow-hidden">
              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead className="bg-[var(--color-base-200)]/50 text-[var(--color-neutral)]">
                    <tr>
                      <th className="px-6 py-4 font-medium tracking-wide uppercase text-xs">Name</th>
                      <th className="px-6 py-4 font-medium tracking-wide uppercase text-xs">Email</th>
                      <th className="px-6 py-4 font-medium tracking-wide uppercase text-xs">Role</th>
                      <th className="px-6 py-4 font-medium tracking-wide uppercase text-xs">Permissions</th>
                      <th className="px-6 py-4 font-medium tracking-wide uppercase text-xs text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffList.map((s) => (
                      <tr key={s.id} className="border-b border-[var(--color-base-300)] last:border-0 transition-[background-color] duration-150 ease-[var(--m3-standard)] hover:bg-[color-mix(in_srgb,var(--color-base-200)_30%,transparent)]">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span className="w-9 h-9 rounded-full bg-[var(--color-primary)] text-[var(--color-primary-content)] flex items-center justify-center text-sm font-bold flex-shrink-0">{s.name.charAt(0).toUpperCase()}</span>
                            <div className="flex flex-col">
                              <span className="font-medium text-[var(--color-base-content)]">{s.name}</span>
                              {s.id === me?.id && <span className="text-xs text-[var(--color-neutral)]">(you)</span>}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-[var(--color-neutral)]">{s.email}</td>
                        <td className="px-6 py-4 text-sm text-[var(--color-neutral)]">
                          <span className={roleClass(s.role)}>{s.role}</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-[var(--color-neutral)]">
                          <div className="flex flex-wrap gap-1 max-w-[280px]">
                            {Object.entries(s.permissions).filter(([, v]) => v).map(([k]) => (
                              <span key={k} className="badge badge-ghost badge-sm bg-[var(--color-base-200)] text-[var(--color-neutral)]">{k}</span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button className="btn btn-xs btn-ghost text-[var(--color-info)]" onClick={() => openModal(s)}>Edit</button>
                            {s.id !== me?.id && (
                              <button className="btn btn-xs btn-ghost text-[var(--color-error)]" onClick={() => handleDelete(s.id)}>Delete</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </AppLayout>

      {isModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box bg-[var(--color-base-100)] rounded-[28px] max-w-lg shadow-lg border border-[var(--color-base-300)] p-8">
            <h3 className="font-bold text-2xl mb-6 text-[var(--color-base-content)]">{editingId ? 'Edit Staff Member' : 'New Staff Member'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-[var(--color-base-content)] px-1">Full name</label>
                  <input type="text" required className="input input-bordered w-full rounded-2xl focus:outline-none focus:border-[var(--color-primary)]"
                    value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-[var(--color-base-content)] px-1">Phone</label>
                  <input type="tel" className="input input-bordered w-full rounded-2xl focus:outline-none focus:border-[var(--color-primary)]"
                    value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                </div>
              </div>

              {!editingId && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-[var(--color-base-content)] px-1">Email</label>
                    <input type="email" required className="input input-bordered w-full rounded-2xl focus:outline-none focus:border-[var(--color-primary)]"
                      value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-[var(--color-base-content)] px-1">Password</label>
                    <input type="password" required className="input input-bordered w-full rounded-2xl focus:outline-none focus:border-[var(--color-primary)]"
                      value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[var(--color-base-content)] px-1">Role</label>
                <select className="select select-bordered w-full rounded-2xl"
                  value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
                  <option>Cashier</option>
                  <option>Manager</option>
                  <option>Admin</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[var(--color-base-content)] px-1">Permissions</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1">
                  {ALL_PERMISSIONS.map((key) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-sm checkbox-primary"
                        checked={!!formData.permissions[key]}
                        onChange={() => togglePermission(key)}
                      />
                      <span className="text-sm capitalize">{key}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="modal-action mt-8 pt-4 border-t border-[var(--color-base-300)]">
                <button type="button" className="btn btn-ghost rounded-full px-6" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary rounded-full px-8">Save</button>
              </div>
            </form>
          </div>
          <div className="modal-backdrop bg-black/20" onClick={closeModal} />
        </div>
      )}
    </ProtectedRoute>
  );
}
