// src/pages/admin/CategoriesPage.jsx


import React, { useEffect, useMemo, useState } from "react";
import {
  HiPlus,
  HiPencil,
  HiTrash,
  HiSearch,
  HiX,
  HiChevronDown,
} from "react-icons/hi";
import adminApi from "../../api/adminApi";

const EMPTY_FORM = { name: "", description: "", parentId: "" };

function flattenTree(nodes = [], level = 0, out = []) {
  for (const n of nodes) {
    out.push({ ...n, __level: level });
    if (n.children?.length) flattenTree(n.children, level + 1, out);
  }
  return out;
}

// for edit: exclude itself (basic)
function buildParentOptions(flat, editingId) {
  return flat.filter((c) => c.id !== editingId);
}

export default function CategoriesPage() {
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");

  const [categoriesTree, setCategoriesTree] = useState([]);
  const [query, setQuery] = useState("");

  const [openModal, setOpenModal] = useState(false);
  const [mode, setMode] = useState("create"); // create | edit
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchCategories = async () => {
  console.log("FETCH CATEGORIES CALLED");
  setLoading(true);
  setApiError("");

  try {
    console.log("Calling API...");
    const res = await adminApi.getCategories();
    console.log("API RESPONSE:", res);

    const raw = res?.data?.data ?? res?.data ?? [];
    setCategoriesTree(Array.isArray(raw) ? raw : []);
  } catch (err) {
    console.log("API ERROR:", err);
    console.log("API ERROR RESPONSE:", err?.response);
    setApiError(
      err?.response?.data?.message ||
      "Failed to load categories"
    );
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    fetchCategories();
  }, []);

  const flatAll = useMemo(() => flattenTree(categoriesTree), [categoriesTree]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return flatAll;
    return flatAll.filter((c) => {
      const name = (c.name ?? "").toLowerCase();
      const desc = (c.description ?? "").toLowerCase();
      return name.includes(q) || desc.includes(q);
    });
  }, [flatAll, query]);

  const parentOptions = useMemo(
    () => buildParentOptions(flatAll, mode === "edit" ? editingId : null),
    [flatAll, mode, editingId]
  );

  const openCreate = () => {
    setMode("create");
    setEditingId(null);
    setForm(EMPTY_FORM);
    setOpenModal(true);
  };

  const openEdit = async (id) => {
    setMode("edit");
    setEditingId(id);
    setSaving(true);
    setApiError("");
    try {
      const res = await adminApi.getCategoryDetail(id).getById(id);
      const c = res?.data?.data;
      // CategoryResponseDto has id,name,description,parentId,parentName,children :contentReference[oaicite:11]{index=11}
      setForm({
        name: c?.name ?? "",
        description: c?.description ?? "",
        parentId: c?.parentId ?? "",
      });
      setOpenModal(true);
    } catch (err) {
      setApiError(err?.response?.data?.message || "Failed to load category detail");
    } finally {
      setSaving(false);
    }
  };

  const closeModal = () => {
    if (saving) return;
    setOpenModal(false);
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const onSave = async () => {
    const name = form.name.trim();
    if (!name) {
      setApiError("Name is required");
      return;
    }

    setSaving(true);
    setApiError("");
    try {
      const payload = {
        // CreateCategoryRequest/UpdateCategoryRequest: name required, description, parentId :contentReference[oaicite:12]{index=12} :contentReference[oaicite:13]{index=13}
        name,
        description: form.description?.trim() || null,
        parentId: form.parentId === "" ? null : Number(form.parentId),
      };

      if (mode === "create") {
        await adminApi.createCategory(payload).create(payload);
      } else {
        await adminApi.updateCategory(id, payload).update(editingId, payload);
      }

      await fetchCategories();
      closeModal();
    } catch (err) {
      setApiError(err?.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id) => {
    const ok = window.confirm("Delete this category? (This may affect related mentors)");
    if (!ok) return;

    setApiError("");
    try {
      await adminApi.deleteCategory(id); // DELETE /api/Admin/categories/{categoryId} :contentReference[oaicite:14]{index=14}
      await fetchCategories();
    } catch (err) {
      setApiError(err?.response?.data?.message || "Delete failed");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-white">
            Categories
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            Manage mentor expertise categories (CRUD)
          </p>
        </div>

        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold shadow-lg shadow-primary-600/20"
        >
          <HiPlus className="w-5 h-5" />
          New Category
        </button>
      </div>

      {/* Search bar */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4">
        <div className="relative">
          <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or description..."
            className="w-full pl-12 pr-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white placeholder-neutral-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none"
          />
        </div>
      </div>

      {apiError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl p-4">
          {apiError}
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div className="text-sm text-neutral-500 dark:text-neutral-400">
            Total: <span className="font-semibold">{flatAll.length}</span>
          </div>
          {loading && <div className="text-sm text-neutral-400">Loading...</div>}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-neutral-50 dark:bg-neutral-800/60">
              <tr className="text-left text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Description</th>
                <th className="px-5 py-3">Parent</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {!loading && filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-neutral-500 dark:text-neutral-400">
                    No categories found.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        {/* indent for tree */}
                        <div style={{ width: c.__level * 14 }} />
                        <span className="font-semibold text-neutral-900 dark:text-white">
                          {c.name}
                        </span>
                      </div>
                      <div className="text-xs text-neutral-400 mt-0.5">
                        ID: {c.id}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-neutral-600 dark:text-neutral-300">
                      {c.description || <span className="text-neutral-400">—</span>}
                    </td>
                    <td className="px-5 py-4 text-sm text-neutral-600 dark:text-neutral-300">
                      {c.parentName || <span className="text-neutral-400">—</span>}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(c.id)}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                        >
                          <HiPencil className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => onDelete(c.id)}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                        >
                          <HiTrash className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-xl bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 dark:border-neutral-800">
              <div className="font-bold text-neutral-900 dark:text-white">
                {mode === "create" ? "Create Category" : `Edit Category #${editingId}`}
              </div>
              <button
                onClick={closeModal}
                className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <HiX className="w-5 h-5 text-neutral-500" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  className="mt-2 w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g. Web Development"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  className="mt-2 w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
                  rows={3}
                  placeholder="Optional"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">
                  Parent Category
                </label>
                <div className="relative mt-2">
                  <select
                    value={form.parentId}
                    onChange={(e) => setForm((p) => ({ ...p, parentId: e.target.value }))}
                    className="w-full appearance-none px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-700 dark:text-neutral-200 outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">No parent (root)</option>
                    {parentOptions.map((c) => (
                      <option key={c.id} value={c.id}>
                        {"— ".repeat(c.__level)}
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <HiChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
                </div>
                <div className="text-xs text-neutral-400 mt-2">
                  (parentId nullable theo API) :contentReference[oaicite:15]{index=15}
                </div>
              </div>

              {apiError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl p-3">
                  {apiError}
                </div>
              )}
            </div>

            <div className="px-5 py-4 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-end gap-3">
              <button
                onClick={closeModal}
                disabled={saving}
                className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={onSave}
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
