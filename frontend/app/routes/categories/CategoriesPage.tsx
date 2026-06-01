/**
 * @file CategoriesPage.tsx
 * @description CRUD page for managing product categories.
 *              Lists all categories in a full-width table with create/edit modal.
 * @notes Requires "categories" permission. Uses ProtectedRoute guard.
 */
import { useEffect, useState } from 'react';

import { categoriesApi } from '~/api/categories';

import { useUiStore } from '~/store/uiStore';

import { ProtectedRoute } from '~/components/ProtectedRoute/ProtectedRoute';
import { AppLayout } from '~/components/AppLayout/AppLayout';
import { TopBar } from '~/components/AppLayout/TopBar/TopBar';

import type { Category } from '~/types';

/** Rows count for the description textarea. */
const DESCRIPTION_ROWS = 3;

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useUiStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });

  /* ── Data fetching ──────────────────────────────── */

  const loadData = async () => {
    try {
      setLoading(true);
      setCategories((await categoriesApi.list()) as Category[]);
    } catch (err: unknown) {
      showToast(
        err instanceof Error ? err.message : 'Failed to load categories',
        'error',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  /* ── Modal helpers ──────────────────────────────── */

  const openModal = (category?: Category) => {
    if (category) {
      setEditingId(category.id);
      setFormData({
        name: category.name,
        description: category.description ?? '',
      });
    } else {
      setEditingId(null);
      setFormData({ name: '', description: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  /* ── Handlers ───────────────────────────────────── */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        description: formData.description || null,
      };

      if (editingId) {
        await categoriesApi.update(editingId, payload);
        showToast('Category updated', 'success');
      } else {
        await categoriesApi.create(payload);
        showToast('Category created', 'success');
      }

      closeModal();
      loadData();
    } catch (err: unknown) {
      showToast(
        err instanceof Error ? err.message : 'Failed to save category',
        'error',
      );
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      await categoriesApi.remove(id);
      showToast('Category deleted', 'success');
      loadData();
    } catch (err: unknown) {
      showToast(
        err instanceof Error ? err.message : 'Failed to delete category',
        'error',
      );
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, name: e.target.value });
  };

  const handleDescriptionChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    setFormData({ ...formData, description: e.target.value });
  };

  /* ── Render ─────────────────────────────────────── */

  return (
    <ProtectedRoute permission="categories">
      <AppLayout>
        <TopBar
          title="Categories"
          actions={
            <button
              className="btn btn-primary btn-sm rounded-full px-6 font-medium shadow-sm"
              onClick={() => openModal()}
            >
              + New Category
            </button>
          }
        />

        <div className="p-6 md:p-8 w-full [animation:fadeUp_0.5s_var(--m3-emphasized)_both]">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <span className="loading loading-spinner loading-lg text-[var(--color-primary)]" />
            </div>
          ) : (
            <div className="bg-[var(--color-base-100)] rounded-[24px] shadow-sm w-full overflow-hidden">
              {categories.length === 0 ? (
                <div className="p-10 text-center text-[var(--color-neutral)]">
                  <p className="text-lg">No categories yet.</p>
                  <button
                    className="btn btn-primary mt-4 rounded-full px-6"
                    onClick={() => openModal()}
                  >
                    Add first category
                  </button>
                </div>
              ) : (
                <table className="table w-full">
                  <thead className="bg-[var(--color-base-200)]/50 text-[var(--color-neutral)]">
                    <tr>
                      <th className="px-6 py-4 font-medium tracking-wide uppercase text-xs">Name</th>
                      <th className="px-6 py-4 font-medium tracking-wide uppercase text-xs">Description</th>
                      <th className="px-6 py-4 font-medium tracking-wide uppercase text-xs text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((category) => (
                      <tr key={category.id} className="border-b border-[var(--color-base-300)] last:border-0 [transition:background-color_0.15s_var(--m3-standard)] hover:bg-[color-mix(in_srgb,var(--color-base-200)_30%,transparent)]">
                        <td className="px-6 py-4 font-medium text-[var(--color-base-content)]">
                          {category.name}
                        </td>
                        <td className="px-6 py-4 text-sm text-[var(--color-neutral)]">
                          {category.description ?? '—'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              className="btn btn-xs btn-ghost text-[var(--color-info)]"
                              onClick={() => openModal(category)}
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn-xs btn-ghost text-[var(--color-error)]"
                              onClick={() => handleDelete(category.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </AppLayout>

      {isModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box bg-[var(--color-base-100)] rounded-[28px] max-w-md shadow-lg border border-[var(--color-base-300)] p-8">
            <h3 className="font-bold text-2xl mb-6 text-[var(--color-base-content)]">
              {editingId ? 'Edit Category' : 'New Category'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Name</span>
                </label>
                <input
                  type="text"
                  required
                  className="input input-bordered w-full rounded-2xl"
                  value={formData.name}
                  onChange={handleNameChange}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">
                    Description
                  </span>
                </label>
                <textarea
                  className="textarea textarea-bordered w-full rounded-2xl"
                  rows={DESCRIPTION_ROWS}
                  value={formData.description}
                  onChange={handleDescriptionChange}
                />
              </div>

              <div className="modal-action mt-8 pt-4 border-t border-[var(--color-base-300)]">
                <button
                  type="button"
                  className="btn btn-ghost rounded-full px-6"
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary rounded-full px-8">
                  Save
                </button>
              </div>
            </form>
          </div>
          <div
            className="modal-backdrop bg-black/20"
            onClick={closeModal}
          />
        </div>
      )}
    </ProtectedRoute>
  );
}
