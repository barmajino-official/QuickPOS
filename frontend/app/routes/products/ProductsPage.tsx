/**
 * @file ProductsPage.tsx
 * @description Products CRUD page with full-width table, modal form for
 *              creating/editing products, and stock-level indicators.
 *              Follows barmajino-react-guidelines with co-located CSS.
 */

// 1. React core
import { useEffect, useState } from 'react';

// 2. Third-party libraries
import { Link } from 'react-router';

// 3. Internal — API
import { productsApi } from '~/api/products';
import { categoriesApi } from '~/api/categories';
import { brandsApi } from '~/api/brands';
import { BASE_URL } from '~/api/client';

// 4. Internal — Store
import { useUiStore } from '~/store/uiStore';

// 5. Internal — Components
import { ProtectedRoute } from '~/components/ProtectedRoute/ProtectedRoute';
import { AppLayout } from '~/components/AppLayout/AppLayout';
import { TopBar } from '~/components/AppLayout/TopBar/TopBar';

// 6. Internal — Types
import type { Product, Category, Brand } from '~/types';

// 7. Styles (always last)
import './ProductsPage.css';

// --- Constants ---
const LOW_STOCK_THRESHOLD = 5;
const CURRENCY_LOCALE = 'en-US';
const CURRENCY_CODE = 'USD';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { showToast } = useUiStore();

  // Sorting and grouping state
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [viewMode, setViewMode] = useState<'all' | 'category' | 'brand'>('all');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    cost: '',
    stock: '',
    categoryId: '',
    brandId: '',
    barcode: '',
    expiryDate: '',
    imageUrl: '' as string | null,
  });

  // Image upload state (kept separate from the JSON form payload)
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [prodRes, catRes, brandRes] = await Promise.all([
        productsApi.list(),
        categoriesApi.list(),
        brandsApi.list(),
      ]);
      setProducts(prodRes as Product[]);
      setCategories(catRes as Category[]);
      setBrands(brandRes as Brand[]);
    } catch (err: any) {
      showToast(err.message || 'Failed to load products', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [showToast]);

  // --- Handlers ---

  const handleOpenModal = (product?: Product) => {
    setImageFile(null);
    if (product) {
      setEditingId(product.id);
      setFormData({
        name: product.name,
        price: product.price.toString(),
        cost: product.cost.toString(),
        stock: product.stock.toString(),
        categoryId: product.categoryId?.toString() || '',
        brandId: product.brandId?.toString() || '',
        barcode: product.barcode ?? '',
        expiryDate: product.expiryDate ?? '',
        imageUrl: product.imageUrl,
      });
      setImagePreview(product.imageUrl ? `${BASE_URL}${product.imageUrl}` : '');
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        price: '',
        cost: '',
        stock: '',
        categoryId: '',
        brandId: '',
        barcode: '',
        expiryDate: '',
        imageUrl: null,
      });
      setImagePreview('');
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
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
        price: parseFloat(formData.price),
        cost: formData.cost ? parseFloat(formData.cost) : 0,
        stock: parseInt(formData.stock, 10),
        categoryId: formData.categoryId ? parseInt(formData.categoryId, 10) : null,
        brandId: formData.brandId ? parseInt(formData.brandId, 10) : null,
        barcode: formData.barcode || null,
        expiryDate: formData.expiryDate || null,
        imageUrl: formData.imageUrl || null,
      };

      let productId = editingId;
      if (editingId) {
        await productsApi.update(editingId, payload);
      } else {
        const created = (await productsApi.create(payload)) as Product;
        productId = created.id;
      }

      // Upload the image (if one was picked) against the now-existing product id.
      if (imageFile && productId) {
        await productsApi.uploadImage(productId, imageFile);
      }

      showToast(editingId ? 'Product updated successfully' : 'Product added successfully', 'success');
      handleCloseModal();
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to save product', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await productsApi.remove(id);
      showToast('Product deleted', 'success');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete product', 'error');
    }
  };

  // --- Helpers ---

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat(CURRENCY_LOCALE, {
      style: 'currency',
      currency: CURRENCY_CODE,
    }).format(val);

  // Product image URLs are returned as "/uploads/x.jpg" and served by the backend
  // origin, so they must be made absolute for the <img> on the :9003 frontend.
  const toImageSrc = (url: string | null) =>
    url ? (url.startsWith('http') ? url : `${BASE_URL}${url}`) : '';

  // Client-side filter by product name or barcode (supports scanner input).
  const query = search.trim().toLowerCase();
  const filteredProducts = query
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          (p.barcode ?? '').toLowerCase().includes(query),
      )
    : products;

  // --- Sorting & Grouping ---
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedProducts = (() => {
    if (!sortConfig) return filteredProducts;
    return [...filteredProducts].sort((a, b) => {
      let aVal: any = (a as any)[sortConfig.key];
      let bVal: any = (b as any)[sortConfig.key];

      if (sortConfig.key === 'category') {
        aVal = a.category?.name || '';
        bVal = b.category?.name || '';
      } else if (sortConfig.key === 'brand') {
        aVal = a.brand?.name || '';
        bVal = b.brand?.name || '';
      }

      if (aVal === null || aVal === undefined) aVal = '';
      if (bVal === null || bVal === undefined) bVal = '';

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  })();

  type GroupData = {
    id: string;
    name: string;
    count: number;
    products: Product[];
    brand?: Brand;
    category?: Category;
  };

  const groupedProducts: GroupData[] = (() => {
    if (viewMode === 'all') return [{ id: 'all', name: 'All Products', count: sortedProducts.length, products: sortedProducts }];
    
    const groupsMap = new Map<string, GroupData>();
    
    sortedProducts.forEach(p => {
      let key = 'uncategorized';
      let name = 'Uncategorized';
      let brand: Brand | undefined;
      let category: Category | undefined;
      
      if (viewMode === 'category') {
        if (p.category) {
          key = `cat-${p.category.id}`;
          name = p.category.name;
          category = p.category;
        }
      } else if (viewMode === 'brand') {
        if (p.brand) {
          key = `brand-${p.brand.id}`;
          name = p.brand.name;
          brand = p.brand;
        } else {
          name = 'No Brand';
        }
      }
      
      if (!groupsMap.has(key)) {
        groupsMap.set(key, { id: key, name, count: 0, products: [], brand, category });
      }
      const group = groupsMap.get(key)!;
      group.products.push(p);
      group.count++;
    });
    
    return Array.from(groupsMap.values()).sort((a, b) => {
      if (a.id === 'uncategorized') return 1;
      if (b.id === 'uncategorized') return -1;
      return a.name.localeCompare(b.name);
    });
  })();

  const renderTable = (prods: Product[]) => (
    <div className="overflow-x-auto">
      <table className="table w-full products_table">
        <thead className="products_table_head">
          <tr>
            <th className="products_th">Image</th>
            <th className="products_th cursor-pointer hover:text-[var(--color-primary)]" onClick={() => handleSort('name')}>
              Name {sortConfig?.key === 'name' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
            </th>
            <th className="products_th cursor-pointer hover:text-[var(--color-primary)]" onClick={() => handleSort('barcode')}>
              Barcode {sortConfig?.key === 'barcode' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
            </th>
            <th className="products_th_right cursor-pointer hover:text-[var(--color-primary)]" onClick={() => handleSort('price')}>
              Price {sortConfig?.key === 'price' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
            </th>
            <th className="products_th_right cursor-pointer hover:text-[var(--color-primary)]" onClick={() => handleSort('stock')}>
              Stock {sortConfig?.key === 'stock' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
            </th>
            <th className="products_th cursor-pointer hover:text-[var(--color-primary)]" onClick={() => handleSort('category')}>
              Category {sortConfig?.key === 'category' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
            </th>
            <th className="products_th cursor-pointer hover:text-[var(--color-primary)]" onClick={() => handleSort('brand')}>
              Brand {sortConfig?.key === 'brand' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
            </th>
            <th className="products_th cursor-pointer hover:text-[var(--color-primary)]" onClick={() => handleSort('expiryDate')}>
              Expiry {sortConfig?.key === 'expiryDate' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
            </th>
            <th className="products_th_right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {prods.map((p) => (
            <tr key={p.id} className="products_row">
              <td className="products_td_image">
                {p.imageUrl ? (
                  <img
                    src={toImageSrc(p.imageUrl)}
                    alt={p.name}
                    className="products_thumb"
                  />
                ) : (
                  <span className="products_thumb_placeholder">🛍️</span>
                )}
              </td>
              <td className="products_td_name">{p.name}</td>
              <td className="products_td_barcode">{p.barcode || '-'}</td>
              <td className="products_td_price">
                {formatCurrency(p.price)}
              </td>
              <td className="products_td_stock">
                <span
                  className={
                    p.stock <= LOW_STOCK_THRESHOLD
                      ? 'badge badge-error font-medium products_stock_badge_low'
                      : 'badge badge-ghost bg-[var(--color-base-200)] font-medium products_stock_badge_normal'
                  }
                >
                  {p.stock}
                </span>
              </td>
              <td className="products_td_neutral">
                {p.category?.name || '-'}
              </td>
              <td className="products_td_neutral">
                {p.brand?.name || '-'}
              </td>
              <td className="products_td_expiry">
                {p.expiryDate
                  ? new Date(p.expiryDate).toLocaleDateString()
                  : '-'}
              </td>
              <td className="products_td_actions">
                <div className="products_actions_wrapper">
                  <button
                    className="btn btn-xs btn-ghost products_edit_btn"
                    onClick={() => handleOpenModal(p)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-xs btn-ghost products_delete_btn"
                    onClick={() => handleDelete(p.id)}
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <ProtectedRoute permission="products">
      <AppLayout>
        <TopBar
          title="Products"
          actions={
            <button
              className="btn btn-primary btn-sm rounded-full products_add_btn"
              onClick={() => handleOpenModal()}
            >
              + New Product
            </button>
          }
        />

        <div className="products_page">
          <div className="products_search_bar flex flex-wrap gap-4 items-center">
            <input
              type="text"
              placeholder="Search by name or barcode…"
              className="input input-bordered w-full max-w-md rounded-full bg-[var(--color-base-100)] products_search_input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="select select-bordered rounded-full bg-[var(--color-base-100)]"
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as any)}
            >
              <option value="all">View All Products</option>
              <option value="category">Group by Category</option>
              <option value="brand">Group by Brand</option>
            </select>
          </div>

          {loading ? (
            <div className="products_loading">
              <span className="loading loading-spinner loading-lg text-[var(--color-primary)]" />
            </div>
          ) : products.length === 0 ? (
            <div className="products_card">
              <div className="products_card_inner">
                <div className="products_empty">
                  <p className="products_empty_text">No products found.</p>
                  <button
                    className="btn btn-primary mt-4 rounded-full px-6 products_empty_btn"
                    onClick={() => handleOpenModal()}
                  >
                    Add your first product
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {groupedProducts.map((group) => (
                <div key={group.id} className="products_card">
                  <div className="products_card_inner">
                    {viewMode !== 'all' && (
                      <div className="flex items-center justify-between mb-4 px-4 py-3 bg-[var(--color-base-200)] m-2 rounded-2xl">
                        <div className="flex items-center gap-4">
                          {viewMode === 'brand' && group.brand?.imageUrl && (
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-white shadow-sm flex items-center justify-center">
                              <img src={toImageSrc(group.brand.imageUrl)} alt={group.name} className="w-full h-full object-cover" />
                            </div>
                          )}
                          {viewMode === 'brand' && !group.brand?.imageUrl && (
                            <div className="w-10 h-10 rounded-full bg-[var(--color-primary)] bg-opacity-10 flex items-center justify-center text-[var(--color-primary)]">
                              🏢
                            </div>
                          )}
                          {viewMode === 'category' && (
                            <div className="w-10 h-10 rounded-full bg-[var(--color-primary)] bg-opacity-10 flex items-center justify-center text-[var(--color-primary)]">
                              📁
                            </div>
                          )}
                          <h2 className="text-xl font-bold text-[var(--color-base-content)] m-0">
                            {group.name} <span className="text-sm font-normal opacity-60 ml-2">({group.count})</span>
                          </h2>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {viewMode === 'brand' && group.brand && (
                            <Link to={`/brands/${group.brand.id}`} className="btn btn-sm btn-outline rounded-full text-[var(--color-primary)] border-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white hover:border-[var(--color-primary)]">
                              View Brand
                            </Link>
                          )}
                          {viewMode === 'category' && group.category && (
                            <Link to={`/categories/${group.category.id}`} className="btn btn-sm btn-outline rounded-full text-[var(--color-primary)] border-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white hover:border-[var(--color-primary)]">
                              View Category
                            </Link>
                          )}
                        </div>
                      </div>
                    )}
                    {renderTable(group.products)}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </AppLayout>

      {/* Modal — rendered inside ProtectedRoute, outside AppLayout */}
      {isModalOpen && (
        <div className="modal modal-open products_modal_overlay">
          <div className="modal-box products_modal_box">
            <h3 className="products_modal_title">
              {editingId ? 'Edit Product' : 'Add New Product'}
            </h3>

            <form onSubmit={handleSubmit} className="products_form">
              <div className="products_image_field">
                <div className="products_image_preview">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="products_image_preview_img" />
                  ) : (
                    <span className="products_image_placeholder">🛍️</span>
                  )}
                </div>
                <label className="products_image_upload">
                  <input
                    type="file"
                    accept="image/*"
                    className="products_image_input"
                    onChange={handleImageChange}
                  />
                  <span className="products_image_upload_btn">
                    {imagePreview ? 'Change image' : 'Upload image'}
                  </span>
                </label>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text products_form_label">Name</span>
                </label>
                <input
                  type="text"
                  required
                  className="input input-bordered w-full rounded-2xl focus:border-[var(--color-primary)] products_form_input"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>

              <div className="products_form_grid">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text products_form_label">Price</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="input input-bordered w-full rounded-2xl focus:border-[var(--color-primary)] products_form_input"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text products_form_label">Cost</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="input input-bordered w-full rounded-2xl focus:border-[var(--color-primary)] products_form_input"
                    value={formData.cost}
                    onChange={(e) =>
                      setFormData({ ...formData, cost: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="products_form_grid">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text products_form_label">Stock</span>
                  </label>
                  <input
                    type="number"
                    required
                    className="input input-bordered w-full rounded-2xl focus:border-[var(--color-primary)] products_form_input"
                    value={formData.stock}
                    onChange={(e) =>
                      setFormData({ ...formData, stock: e.target.value })
                    }
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text products_form_label">Barcode</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered w-full rounded-2xl focus:border-[var(--color-primary)] products_form_input"
                    value={formData.barcode}
                    onChange={(e) =>
                      setFormData({ ...formData, barcode: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="products_form_grid">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text products_form_label">Category</span>
                  </label>
                  <select
                    className="select select-bordered w-full rounded-2xl focus:border-[var(--color-primary)] products_form_select"
                    value={formData.categoryId}
                    onChange={(e) =>
                      setFormData({ ...formData, categoryId: e.target.value })
                    }
                  >
                    <option value="">No Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text products_form_label">Brand</span>
                  </label>
                  <select
                    className="select select-bordered w-full rounded-2xl focus:border-[var(--color-primary)] products_form_select"
                    value={formData.brandId}
                    onChange={(e) =>
                      setFormData({ ...formData, brandId: e.target.value })
                    }
                  >
                    <option value="">No Brand</option>
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text products_form_label">
                    Expiry Date (Optional)
                  </span>
                </label>
                <input
                  type="date"
                  className="input input-bordered w-full rounded-2xl focus:border-[var(--color-primary)] products_form_input"
                  value={formData.expiryDate}
                  onChange={(e) =>
                    setFormData({ ...formData, expiryDate: e.target.value })
                  }
                />
              </div>

              <div className="modal-action products_modal_actions">
                <button
                  type="button"
                  className="btn btn-ghost rounded-full px-6 products_cancel_btn"
                  onClick={handleCloseModal}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary rounded-full px-8 shadow-sm products_save_btn">
                  Save Product
                </button>
              </div>
            </form>
          </div>
          <div
            className="modal-backdrop bg-black/20 products_modal_backdrop"
            onClick={handleCloseModal}
          />
        </div>
      )}
    </ProtectedRoute>
  );
}
