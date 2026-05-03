import type { Category } from "../../lib/types";
import { Field, inputCls, FormModal } from "../../components/FormField";

interface Props {
  categories: Category[];
  loading: boolean;
  showModal: boolean;
  setShowModal: (v: boolean) => void;
  editing: Category | null;
  form: { name: string; description: string };
  setForm: (v: any) => void;
  errors: Record<string, string>;
  openAdd: () => void;
  openEdit: (c: Category) => void;
  onSave: (e: React.FormEvent) => void;
  onDelete: (c: Category) => void;
}

export default function CategoriesView({
  categories,
  loading,
  showModal,
  setShowModal,
  editing,
  form,
  setForm,
  errors,
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
    <div className="max-w-7xl mx-auto animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-base-content">
            Product Categories
          </h1>
          <p className="text-sm opacity-60">
            Manage groupings and classifications.
          </p>
        </div>
        <button
          className="btn btn-primary btn-sm rounded-md shadow-sm"
          onClick={openAdd}
        >
          + New Category
        </button>
      </div>

      <div className="bg-base-100 border border-base-300 shadow-sm rounded-md overflow-hidden">
        {categories.length === 0 ? (
          <div className="text-center py-16 opacity-50 text-sm">
            No categories defined yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-zebra table-sm w-full">
              <thead className="bg-base-200/50 text-base-content/70">
                <tr>
                  <th className="font-semibold uppercase tracking-wider text-[10px] w-12">
                    ID
                  </th>
                  <th className="font-semibold uppercase tracking-wider text-[10px]">
                    Category Name
                  </th>
                  <th className="font-semibold uppercase tracking-wider text-[10px]">
                    Description
                  </th>
                  <th className="text-right font-semibold uppercase tracking-wider text-[10px]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c.id} className="hover:bg-base-200/30">
                    <td className="font-mono text-xs text-base-content/50">
                      {c.id}
                    </td>
                    <td className="font-semibold text-sm">{c.name}</td>
                    <td className="text-sm opacity-80 max-w-md truncate">
                      {c.description || (
                        <span className="italic opacity-50">—</span>
                      )}
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          className="btn btn-xs btn-ghost text-blue-600 rounded-sm px-2"
                          onClick={() => openEdit(c)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-xs btn-ghost text-error rounded-sm px-2"
                          onClick={() => onDelete(c)}
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
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <FormModal
          title={editing ? "Edit Category" : "New Category"}
          onClose={() => setShowModal(false)}
          onSubmit={onSave}
          formId="category-form"
          submitLabel={editing ? "Update" : "Save"}
        >
          <div className="space-y-4">
            <Field label="Name" required error={errors.name}>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={inputCls(!!errors.name)}
                placeholder="e.g. Beverages"
              />
            </Field>
            <Field label="Description" error={errors.description}>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className={`${inputCls(!!errors.description)} h-24 resize-none`}
                placeholder="Short description"
              />
            </Field>
          </div>
        </FormModal>
      )}
    </div>
  );
}
