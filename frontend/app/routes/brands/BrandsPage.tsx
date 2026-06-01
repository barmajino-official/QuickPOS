/**
 * @file BrandsPage.tsx
 * @description CRUD page for product brands/suppliers (name, phone, email, link).
 *              Full-width table + create/edit modal. Each row links to the brand's
 *              analytics detail page.
 *
 * @notes Requires "products" permission. CSS lives in ./BrandsPage.css.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router';

import { brandsApi } from '~/api/brands';
import { BASE_URL } from '~/api/client';
import { useUiStore } from '~/store/uiStore';
import { ProtectedRoute } from '~/components/ProtectedRoute/ProtectedRoute';
import { AppLayout } from '~/components/AppLayout/AppLayout';
import { TopBar } from '~/components/AppLayout/TopBar/TopBar';
import type { Brand } from '~/types';

import './BrandsPage.css';

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const showToast = useUiStore((s:unknown) => s.showToast);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', link: '', imageUrl: null as string | null });

  // Brand image upload state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setBrands((await brandsApi.list()) as Brand[]);
      // print the data to the console for debugging
      console.log('Loaded brands:', brands);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to load brands', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData();
    console.log('Brands state after loadData call:', brands); // Debug log to check state update
   }, []);

  const openModal = (b?: Brand) => {
    setImageFile(null);
    if (b) {
      setEditingId(b.id);
      setFormData({
        name: b.name,
        phone: b.phone ?? '',
        email: b.email ?? '',
        link: b.link ?? '',
        imageUrl: b.imageUrl,
      });
      setImagePreview(b.imageUrl ? `${BASE_URL}${b.imageUrl}` : '');
    } else {
      setEditingId(null);
      setFormData({ name: '', phone: '', email: '', link: '', imageUrl: null });
      setImagePreview('');
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setImageFile(null);
    setImagePreview('');
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        phone: formData.phone || null,
        email: formData.email || null,
        link: formData.link || null,
        imageUrl: formData.imageUrl || null,
      };

      let brandId = editingId;
      if (editingId) {
        await brandsApi.update(editingId, payload);
      } else {
        const created = (await brandsApi.create(payload)) as Brand;
        brandId = created.id;
      }

      // If an image file was selected, upload it to the backend
      if (imageFile && brandId) {
        await brandsApi.uploadImage(brandId, imageFile);
      }

      showToast(editingId ? 'Brand updated' : 'Brand added', 'success');
      closeModal();
      loadData();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to save brand', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this brand? Its products will be unlinked.')) return;
    try {
      await brandsApi.remove(id);
      showToast('Brand deleted', 'success');
      loadData();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to delete brand', 'error');
    }
  };

  const toImageSrc = (url: string | null) =>
    url ? (url.startsWith('http') ? url : `${BASE_URL}${url}`) : '';

  return (
    <ProtectedRoute permission="brands">
      <AppLayout>
        <TopBar
          title="Brands"
          actions={
            <button className="btn btn-primary btn-sm rounded-full brands_new_btn" onClick={() => openModal()}>
              + New Brand
            </button>
          }
        />

        <div className="brands_page">
          {loading ? (
            <div className="brands_loading">
              <span className="loading loading-spinner loading-lg text-[var(--color-primary)]" />
            </div>
          ) : (
            <div className="brands_card">
              {brands.length === 0 ? (
                <div className="brands_empty">
                  <p className="brands_empty_text">No brands yet.</p>
                  <button className="btn btn-primary mt-4 rounded-full px-6" onClick={() => openModal()}>
                    Add first brand
                  </button>
                </div>
              ) : (
                <div className="brands_scroll">
                  <table className="table w-full brands_table">
                    <thead className="brands_thead">
                      <tr>
                        <th className="brands_th">Image</th>
                        <th className="brands_th">Name</th>
                        <th className="brands_th">Phone</th>
                        <th className="brands_th">Email</th>
                        <th className="brands_th">Link</th>
                        <th className="brands_th_actions">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {brands.map((b) => (
                        <tr key={b.id} className="brands_row">
                          <td className="brands_td_image">
                            {b.imageUrl ? (
                              <img src={toImageSrc(b.imageUrl)} alt={b.name} className="brands_thumb" />
                            ) : (
                              <span className="brands_thumb_placeholder">🏢</span>
                            )}
                          </td>
                          <td className="brands_td_name">
                            <Link to={`/brands/${b.id}`} className="brands_name_link">{b.name}</Link>
                          </td>
                          <td className="brands_td">{b.phone ?? '—'}</td>
                          <td className="brands_td">{b.email ?? '—'}</td>
                          <td className="brands_td">
                            {b.link ? (
                              <a href={b.link} target="_blank" rel="noreferrer" className="brands_ext_link">
                                {b.link.replace(/^https?:\/\//, '')}
                              </a>
                            ) : '—'}
                          </td>
                          <td className="brands_td_actions">
                            <div className="brands_actions_group">
                              <Link to={`/brands/${b.id}`} className="btn btn-xs btn-ghost text-[var(--color-primary)]">View</Link>
                              <button className="btn btn-xs btn-ghost text-[var(--color-info)]" onClick={() => openModal(b)}>Edit</button>
                              <button className="btn btn-xs btn-ghost text-[var(--color-error)]" onClick={() => handleDelete(b.id)}>Delete</button>
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
        <div className="modal modal-open brands_modal_overlay">
          <div className="modal-box brands_modal_box">
            <h3 className="brands_modal_title">{editingId ? 'Edit Brand' : 'New Brand'}</h3>
            <form onSubmit={handleSubmit} className="brands_form">
              <div className="brands_image_field">
                <div className="brands_image_preview">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="brands_image_preview_img" />
                  ) : (
                    <span className="brands_image_placeholder">🏢</span>
                  )}
                </div>
                <label className="brands_image_upload">
                  <input
                    type="file"
                    accept="image/*"
                    className="brands_image_input"
                    onChange={handleImageChange}
                  />
                  <span className="brands_image_upload_btn">
                    {imagePreview ? 'Change image' : 'Upload image'}
                  </span>
                </label>
              </div>
              <div className="brands_form_group">
                <label className="brands_form_label">Name</label>
                <input
                  type="text"
                  required
                  className="input input-bordered w-full rounded-2xl brands_form_input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="brands_form_row">
                <div className="brands_form_group">
                  <label className="brands_form_label">Phone</label>
                  <input
                    type="tel"
                    className="input input-bordered w-full rounded-2xl brands_form_input"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="brands_form_group">
                  <label className="brands_form_label">Email</label>
                  <input
                    type="email"
                    className="input input-bordered w-full rounded-2xl brands_form_input"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>
              <div className="brands_form_group">
                <label className="brands_form_label">Website / Link</label>
                <input
                  type="url"
                  placeholder="https://…"
                  className="input input-bordered w-full rounded-2xl brands_form_input"
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                />
              </div>
              <div className="modal-action brands_modal_actions">
                <button type="button" className="btn btn-ghost rounded-full px-6" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary rounded-full px-8">Save</button>
              </div>
            </form>
          </div>
          <div className="modal-backdrop bg-black/20 brands_modal_backdrop" onClick={closeModal} />
        </div>
      )}
    </ProtectedRoute>
  );
}
