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

import './StaffPage.css';

const ALL_PERMISSIONS = ['dashboard', 'pos', 'orders', 'products', 'categories', 'customers', 'staff'] as const;

const DEFAULT_PERMISSIONS: Record<string, boolean> = {
  dashboard: false, pos: true, orders: false,
  products: false, categories: false, customers: false, staff: false,
};

const roleClass = (role: string) => {
  if (role === 'Admin') return 'badge badge-primary staff_role_badge staff_role_admin';
  if (role === 'Manager') return 'badge badge-secondary staff_role_badge staff_role_manager';
  return 'badge badge-ghost staff_role_badge staff_role_cashier';
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
            <button className="btn btn-primary btn-sm rounded-full staff_new_btn" onClick={() => openModal()}>
              + New Staff
            </button>
          }
        />

        <div className="staff_page">
          {loading ? (
            <div className="staff_loading">
              <span className="loading loading-spinner loading-lg text-[var(--color-primary)] staff_spinner" />
            </div>
          ) : (
            <div className="staff_card">
              <div className="staff_scroll">
                <table className="table w-full staff_table">
                  <thead className="staff_thead">
                    <tr>
                      <th className="staff_th">Name</th>
                      <th className="staff_th">Email</th>
                      <th className="staff_th">Role</th>
                      <th className="staff_th">Permissions</th>
                      <th className="staff_th_actions">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffList.map((s) => (
                      <tr key={s.id} className="staff_row">
                        <td className="staff_td_name">
                          <div className="staff_name_cell">
                            <span className="staff_avatar">{s.name.charAt(0).toUpperCase()}</span>
                            <div className="staff_name_info">
                              <span className="staff_name_text">{s.name}</span>
                              {s.id === me?.id && <span className="staff_you">(you)</span>}
                            </div>
                          </div>
                        </td>
                        <td className="staff_td">{s.email}</td>
                        <td className="staff_td">
                          <span className={roleClass(s.role)}>{s.role}</span>
                        </td>
                        <td className="staff_td">
                          <div className="staff_perms">
                            {Object.entries(s.permissions).filter(([, v]) => v).map(([k]) => (
                              <span key={k} className="badge badge-ghost badge-sm bg-[var(--color-base-200)] text-[var(--color-neutral)] staff_perm_chip">{k}</span>
                            ))}
                          </div>
                        </td>
                        <td className="staff_td_actions">
                          <div className="staff_actions_group">
                            <button className="btn btn-xs btn-ghost staff_btn_edit" onClick={() => openModal(s)}>Edit</button>
                            {s.id !== me?.id && (
                              <button className="btn btn-xs btn-ghost staff_btn_delete" onClick={() => handleDelete(s.id)}>Delete</button>
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
        <div className="modal modal-open staff_modal_overlay">
          <div className="modal-box staff_modal_box">
            <h3 className="staff_modal_title">{editingId ? 'Edit Staff Member' : 'New Staff Member'}</h3>
            <form onSubmit={handleSubmit} className="staff_form">
              <div className="staff_form_row">
                <div className="staff_form_group">
                  <label className="staff_form_label">Full name</label>
                  <input type="text" required className="input input-bordered w-full rounded-2xl staff_form_input"
                    value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div className="staff_form_group">
                  <label className="staff_form_label">Phone</label>
                  <input type="tel" className="input input-bordered w-full rounded-2xl staff_form_input"
                    value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                </div>
              </div>

              {!editingId && (
                <div className="staff_form_row">
                  <div className="staff_form_group">
                    <label className="staff_form_label">Email</label>
                    <input type="email" required className="input input-bordered w-full rounded-2xl staff_form_input"
                      value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                  </div>
                  <div className="staff_form_group">
                    <label className="staff_form_label">Password</label>
                    <input type="password" required className="input input-bordered w-full rounded-2xl staff_form_input"
                      value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                  </div>
                </div>
              )}

              <div className="staff_form_group">
                <label className="staff_form_label">Role</label>
                <select className="select select-bordered w-full rounded-2xl staff_form_select"
                  value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
                  <option>Cashier</option>
                  <option>Manager</option>
                  <option>Admin</option>
                </select>
              </div>

              <div className="staff_form_group">
                <label className="staff_form_label">Permissions</label>
                <div className="staff_perm_grid">
                  {ALL_PERMISSIONS.map((key) => (
                    <label key={key} className="staff_perm_option">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-sm checkbox-primary"
                        checked={!!formData.permissions[key]}
                        onChange={() => togglePermission(key)}
                      />
                      <span className="staff_perm_label">{key}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="modal-action staff_modal_actions">
                <button type="button" className="btn btn-ghost rounded-full px-6 staff_modal_cancel" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary rounded-full px-8 staff_modal_save">Save</button>
              </div>
            </form>
          </div>
          <div className="modal-backdrop bg-black/20 staff_modal_backdrop" onClick={closeModal} />
        </div>
      )}
    </ProtectedRoute>
  );
}
