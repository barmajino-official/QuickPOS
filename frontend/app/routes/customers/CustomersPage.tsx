/**
 * @file CustomersPage.tsx
 * @description CRM table for managing customer profiles. Full-width, responsive,
 *              with debounced search by name / email / phone and a create-edit modal.
 *
 * @notes Requires "customers" permission. Uses ProtectedRoute guard.
 */
import { useEffect, useState } from 'react';

import { customersApi } from '~/api/customers';
import { useUiStore } from '~/store/uiStore';
import { ProtectedRoute } from '~/components/ProtectedRoute/ProtectedRoute';
import { AppLayout } from '~/components/AppLayout/AppLayout';
import { TopBar } from '~/components/AppLayout/TopBar/TopBar';
import type { Customer } from '~/types';

const SEARCH_DEBOUNCE_MS = 300;

const getInitials = (name: string) =>
  name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const showToast = useUiStore((s) => s.showToast);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', address: '' });

  const loadData = async (query?: string) => {
    try {
      setLoading(true);
      const filters = query ? { search: query } : undefined;
      setCustomers((await customersApi.list(filters)) as Customer[]);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to load customers', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => loadData(search || undefined), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  const openModal = (c?: Customer) => {
    if (c) {
      setEditingId(c.id);
      setFormData({ name: c.name, phone: c.phone ?? '', email: c.email ?? '', address: c.address ?? '' });
    } else {
      setEditingId(null);
      setFormData({ name: '', phone: '', email: '', address: '' });
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
      const payload = {
        name: formData.name,
        phone: formData.phone || null,
        email: formData.email || null,
        address: formData.address || null,
      };
      if (editingId) {
        await customersApi.update(editingId, payload);
        showToast('Customer updated', 'success');
      } else {
        await customersApi.create(payload);
        showToast('Customer added', 'success');
      }
      closeModal();
      loadData(search || undefined);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to save customer', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this customer?')) return;
    try {
      await customersApi.remove(id);
      showToast('Customer deleted', 'success');
      loadData(search || undefined);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to delete customer', 'error');
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value);

  return (
    <ProtectedRoute permission="customers">
      <AppLayout>
        <TopBar
          title="Customers"
          actions={
            <button className="btn btn-primary btn-sm rounded-full px-6 font-medium shadow-sm" onClick={() => openModal()}>
              + New Customer
            </button>
          }
        />

        <div className="p-4 sm:p-6 lg:p-8 w-full" style={{ animation: 'fadeUp 0.5s var(--m3-emphasized) both' }}>
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search by name, email, or phone…"
              className="input input-bordered w-full max-w-md rounded-full bg-[var(--color-base-100)] focus:outline-none focus:border-[var(--color-primary)]"
              value={search}
              onChange={handleSearchChange}
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <span className="loading loading-spinner loading-lg text-[var(--color-primary)]" />
            </div>
          ) : (
            <div className="bg-[var(--color-base-100)] rounded-[24px] shadow-sm w-full overflow-hidden">
              {customers.length === 0 ? (
                <div className="p-10 text-center text-[var(--color-neutral)]">
                  <p className="text-lg">
                    {search ? 'No customers match your search.' : 'No customers yet.'}
                  </p>
                  {!search && (
                    <button className="btn btn-primary mt-4 rounded-full px-6" onClick={() => openModal()}>
                      Add first customer
                    </button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table w-full">
                    <thead className="bg-[var(--color-base-200)]/50 text-[var(--color-neutral)]">
                      <tr>
                        <th className="px-6 py-4 font-medium tracking-wide uppercase text-xs">Customer</th>
                        <th className="px-6 py-4 font-medium tracking-wide uppercase text-xs">Phone</th>
                        <th className="px-6 py-4 font-medium tracking-wide uppercase text-xs">Email</th>
                        <th className="px-6 py-4 font-medium tracking-wide uppercase text-xs">Address</th>
                        <th className="px-6 py-4 font-medium tracking-wide uppercase text-xs text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customers.map((c) => (
                        <tr key={c.id} className="border-b border-[var(--color-base-300)] last:border-0 hover:bg-[color-mix(in_srgb,var(--color-base-200)_30%,transparent)]" style={{ transition: 'background-color 0.15s var(--m3-standard)' }}>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <span className="w-9 h-9 rounded-full bg-[var(--color-secondary)] text-[var(--color-secondary-content)] flex items-center justify-center text-xs font-bold flex-shrink-0">{getInitials(c.name)}</span>
                              <span className="font-medium text-[var(--color-base-content)]">{c.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-[var(--color-neutral)]">{c.phone ?? '—'}</td>
                          <td className="px-6 py-4 text-sm text-[var(--color-neutral)]">{c.email ?? '—'}</td>
                          <td className="px-6 py-4 text-sm text-[var(--color-neutral)] max-w-[200px] truncate">{c.address ?? '—'}</td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button className="btn btn-xs btn-ghost text-[var(--color-info)]" onClick={() => openModal(c)}>Edit</button>
                              <button className="btn btn-xs btn-ghost text-[var(--color-error)]" onClick={() => handleDelete(c.id)}>Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </AppLayout>

      {isModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box bg-[var(--color-base-100)] rounded-[28px] max-w-md shadow-lg border border-[var(--color-base-300)] p-8">
            <h3 className="font-bold text-2xl mb-6 text-[var(--color-base-content)]">{editingId ? 'Edit Customer' : 'New Customer'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[var(--color-base-content)] px-1">Full name</label>
                <input
                  type="text"
                  required
                  className="input input-bordered w-full rounded-2xl focus:outline-none focus:border-[var(--color-primary)]"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-[var(--color-base-content)] px-1">Phone</label>
                  <input
                    type="tel"
                    className="input input-bordered w-full rounded-2xl focus:outline-none focus:border-[var(--color-primary)]"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-[var(--color-base-content)] px-1">Email</label>
                  <input
                    type="email"
                    className="input input-bordered w-full rounded-2xl focus:outline-none focus:border-[var(--color-primary)]"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[var(--color-base-content)] px-1">Address</label>
                <input
                  type="text"
                  className="input input-bordered w-full rounded-2xl focus:outline-none focus:border-[var(--color-primary)]"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
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
