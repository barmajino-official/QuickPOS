/**
 * @file CustomersPage.tsx
 * @description CRM table for managing customer profiles. Full-width, responsive,
 *              with debounced search by name / email / phone and a create-edit modal.
 *
 * @notes Requires "customers" permission. CSS lives in ./CustomersPage.css.
 */
import { useEffect, useState } from 'react';

import { customersApi } from '~/api/customers';
import { useUiStore } from '~/store/uiStore';
import { ProtectedRoute } from '~/components/ProtectedRoute/ProtectedRoute';
import { AppLayout } from '~/components/AppLayout/AppLayout';
import { TopBar } from '~/components/AppLayout/TopBar/TopBar';
import type { Customer } from '~/types';

import './CustomersPage.css';

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
            <button className="btn btn-primary btn-sm rounded-full customers_new_btn" onClick={() => openModal()}>
              + New Customer
            </button>
          }
        />

        <div className="customers_page">
          <div className="customers_search_bar">
            <input
              type="text"
              placeholder="Search by name, email, or phone…"
              className="input input-bordered w-full max-w-md rounded-full bg-[var(--color-base-100)] customers_search_input"
              value={search}
              onChange={handleSearchChange}
            />
          </div>

          {loading ? (
            <div className="customers_loading">
              <span className="loading loading-spinner loading-lg customers_spinner" />
            </div>
          ) : (
            <div className="customers_card">
              {customers.length === 0 ? (
                <div className="customers_empty">
                  <p className="customers_empty_text">
                    {search ? 'No customers match your search.' : 'No customers yet.'}
                  </p>
                  {!search && (
                    <button className="btn btn-primary mt-4 rounded-full px-6 customers_empty_btn" onClick={() => openModal()}>
                      Add first customer
                    </button>
                  )}
                </div>
              ) : (
                <div className="customers_scroll">
                  <table className="table w-full customers_table">
                    <thead className="customers_thead">
                      <tr>
                        <th className="customers_th">Customer</th>
                        <th className="customers_th">Phone</th>
                        <th className="customers_th">Email</th>
                        <th className="customers_th">Address</th>
                        <th className="customers_th_actions">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customers.map((c) => (
                        <tr key={c.id} className="customers_row">
                          <td className="customers_td_name">
                            <div className="customers_name_cell">
                              <span className="customers_avatar">{getInitials(c.name)}</span>
                              <span className="customers_name_text">{c.name}</span>
                            </div>
                          </td>
                          <td className="customers_td">{c.phone ?? '—'}</td>
                          <td className="customers_td">{c.email ?? '—'}</td>
                          <td className="customers_td_address">{c.address ?? '—'}</td>
                          <td className="customers_td_actions">
                            <div className="customers_actions_group">
                              <button className="btn btn-xs btn-ghost customers_btn_edit" onClick={() => openModal(c)}>Edit</button>
                              <button className="btn btn-xs btn-ghost customers_btn_delete" onClick={() => handleDelete(c.id)}>Delete</button>
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
        <div className="modal modal-open customers_modal_overlay">
          <div className="modal-box customers_modal_box">
            <h3 className="customers_modal_title">{editingId ? 'Edit Customer' : 'New Customer'}</h3>
            <form onSubmit={handleSubmit} className="customers_form">
              <div className="customers_form_group">
                <label className="customers_form_label">Full name</label>
                <input
                  type="text"
                  required
                  className="input input-bordered w-full rounded-2xl customers_form_input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="customers_form_row">
                <div className="customers_form_group">
                  <label className="customers_form_label">Phone</label>
                  <input
                    type="tel"
                    className="input input-bordered w-full rounded-2xl customers_form_input"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="customers_form_group">
                  <label className="customers_form_label">Email</label>
                  <input
                    type="email"
                    className="input input-bordered w-full rounded-2xl customers_form_input"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>
              <div className="customers_form_group">
                <label className="customers_form_label">Address</label>
                <input
                  type="text"
                  className="input input-bordered w-full rounded-2xl customers_form_input"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div className="modal-action customers_modal_actions">
                <button type="button" className="btn btn-ghost rounded-full px-6 customers_modal_cancel" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary rounded-full px-8 customers_modal_save">Save</button>
              </div>
            </form>
          </div>
          <div className="modal-backdrop bg-black/20 customers_modal_backdrop" onClick={closeModal} />
        </div>
      )}
    </ProtectedRoute>
  );
}
