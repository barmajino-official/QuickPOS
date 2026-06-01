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

import './CategoriesPage.css';

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
              className="btn btn-primary btn-sm rounded-full categories_new_btn"
              onClick={() => openModal()}
            >
              + New Category
            </button>
          }
        />

        <div className="categories_page">
          {loading ? (
            <div className="categories_loading">
              <span className="loading loading-spinner loading-lg categories_spinner" />
            </div>
          ) : (
            <div className="categories_card">
              {categories.length === 0 ? (
                <div className="categories_empty">
                  <p className="categories_empty_text">No categories yet.</p>
                  <button
                    className="btn btn-primary mt-4 rounded-full px-6 categories_empty_btn"
                    onClick={() => openModal()}
                  >
                    Add first category
                  </button>
                </div>
              ) : (
                <table className="table w-full categories_table">
                  <thead className="categories_thead">
                    <tr>
                      <th className="categories_th">Name</th>
                      <th className="categories_th">Description</th>
                      <th className="categories_th_actions">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((category) => (
                      <tr key={category.id} className="categories_row">
                        <td className="categories_td_name">
                          {category.name}
                        </td>
                        <td className="categories_td_desc">
                          {category.description ?? '—'}
                        </td>
                        <td className="categories_td_actions">
                          <div className="categories_actions_group">
                            <button
                              className="btn btn-xs btn-ghost categories_btn_edit"
                              onClick={() => openModal(category)}
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn-xs btn-ghost categories_btn_delete"
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
        <div className="modal modal-open categories_modal_overlay">
          <div className="modal-box categories_modal_box">
            <h3 className="categories_modal_title">
              {editingId ? 'Edit Category' : 'New Category'}
            </h3>

            <form onSubmit={handleSubmit} className="categories_form">
              <div className="form-control categories_form_group">
                <label className="label categories_form_label">
                  <span className="label-text categories_form_label_text">Name</span>
                </label>
                <input
                  type="text"
                  required
                  className="input input-bordered w-full rounded-2xl categories_form_input"
                  value={formData.name}
                  onChange={handleNameChange}
                />
              </div>

              <div className="form-control categories_form_group">
                <label className="label categories_form_label">
                  <span className="label-text categories_form_label_text">
                    Description
                  </span>
                </label>
                <textarea
                  className="textarea textarea-bordered w-full rounded-2xl categories_form_textarea"
                  rows={DESCRIPTION_ROWS}
                  value={formData.description}
                  onChange={handleDescriptionChange}
                />
              </div>

              <div className="modal-action categories_modal_actions">
                <button
                  type="button"
                  className="btn btn-ghost rounded-full px-6 categories_modal_cancel"
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary rounded-full px-8 categories_modal_save">
                  Save
                </button>
              </div>
            </form>
          </div>
          <div
            className="modal-backdrop bg-black/20 categories_modal_backdrop"
            onClick={closeModal}
          />
        </div>
      )}
    </ProtectedRoute>
  );
}
