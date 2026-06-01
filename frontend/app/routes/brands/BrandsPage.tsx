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

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const showToast = useUiStore((s) => s.showToast);

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
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to load brands', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
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
            <button className="btn btn-primary btn-sm rounded-full px-6 font-medium shadow-sm" onClick={() => openModal()}>
              + New Brand
            </button>
          }
        />

        <div className="p-4 sm:p-6 lg:p-8 w-full" style={{ animation: 'fadeUp 0.5s var(--m3-emphasized) both' }}>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <span className="loading loading-spinner loading-lg text-[var(--color-primary)]" />
            </div>
          ) : (
            <div className="bg-[var(--color-base-100)] rounded-[24px] shadow-sm border border-[var(--color-base-300)] w-full overflow-hidden">
              {brands.length === 0 ? (
                <div className="p-10 text-center text-[var(--color-neutral)]">
                  <p className="text-lg">No brands yet.</p>
                  <button className="btn btn-primary mt-4 rounded-full px-6" onClick={() => openModal()}>
                    Add first brand
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table w-full">
                    <thead className="bg-[var(--color-base-200)]/50 text-[var(--color-neutral)]">
                      <tr>
                        <th className="px-6 py-4 font-medium tracking-wide uppercase text-xs">Image</th>
                        <th className="px-6 py-4 font-medium tracking-wide uppercase text-xs">Name</th>
                        <th className="px-6 py-4 font-medium tracking-wide uppercase text-xs">Phone</th>
                        <th className="px-6 py-4 font-medium tracking-wide uppercase text-xs">Email</th>
                        <th className="px-6 py-4 font-medium tracking-wide uppercase text-xs">Link</th>
                        <th className="px-6 py-4 font-medium tracking-wide uppercase text-xs text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {brands.map((b) => (
                        <tr key={b.id} className="border-b border-[var(--color-base-300)] last:border-0 hover:bg-[color-mix(in_srgb,var(--color-base-200)_30%,transparent)]" style={{ transition: 'background-color 0.15s var(--m3-standard)' }}>
                          <td className="px-6 py-3 w-16">
                            {b.imageUrl ? (
                              <img src={toImageSrc(b.imageUrl)} alt={b.name} className="w-11 h-11 rounded-xl object-cover border border-[var(--color-base-300)]" />
                            ) : (
                              <span className="w-11 h-11 rounded-xl bg-[var(--color-base-200)] flex items-center justify-center text-lg">🏢</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <Link to={`/brands/${b.id}`} className="font-medium text-[var(--color-base-content)] hover:text-[var(--color-primary)] hover:underline">{b.name}</Link>
                          </td>
                          <td className="px-6 py-4 text-sm text-[var(--color-neutral)]">{b.phone ?? '—'}</td>
                          <td className="px-6 py-4 text-sm text-[var(--color-neutral)]">{b.email ?? '—'}</td>
                          <td className="px-6 py-4 text-sm text-[var(--color-neutral)]">
                            {b.link ? (
                              <a href={b.link} target="_blank" rel="noreferrer" className="text-[var(--color-primary)] hover:underline">
                                {b.link.replace(/^https?:\/\//, '')}
                              </a>
                            ) : '—'}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-1">
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
        <div className="modal modal-open">
          <div className="modal-box bg-[var(--color-base-100)] rounded-[28px] max-w-md shadow-lg border border-[var(--color-base-300)] p-8">
            <h3 className="font-bold text-2xl mb-6 text-[var(--color-base-content)]">{editingId ? 'Edit Brand' : 'New Brand'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-20 h-20 rounded-2xl bg-[var(--color-base-200)] border border-[var(--color-base-300)] flex items-center justify-center overflow-hidden flex-shrink-0">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl">🏢</span>
                  )}
                </div>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                  <span className="inline-flex items-center px-5 py-2 rounded-full border border-[var(--color-base-300)] text-sm font-medium text-[var(--color-base-content)] hover:bg-[color-mix(in_srgb,var(--color-base-300)_35%,transparent)]" style={{ transition: 'background-color 0.2s var(--m3-standard)' }}>
                    {imagePreview ? 'Change image' : 'Upload image'}
                  </span>
                </label>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[var(--color-base-content)] px-1">Name</label>
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
                <label className="text-sm font-medium text-[var(--color-base-content)] px-1">Website / Link</label>
                <input
                  type="url"
                  placeholder="https://…"
                  className="input input-bordered w-full rounded-2xl focus:outline-none focus:border-[var(--color-primary)]"
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
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
