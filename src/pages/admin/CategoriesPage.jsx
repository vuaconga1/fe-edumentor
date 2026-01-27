// src/pages/admin/CategoriesPage.jsx


import React, { useEffect, useMemo, useState } from "react";
import {
  HiPlus,
  HiPencil,
  HiTrash,
  HiX,
  HiChevronDown,
  HiChevronUp,
  HiEye,
  HiRefresh,
} from "react-icons/hi";
import adminApi from "../../api/adminApi";
import ActionButton from "../../components/admin/ActionButton";

const EMPTY_FORM = { name: "", description: "", parentId: "" };

function flattenTree(nodes = [], level = 0, out = []) {
  for (const n of nodes) {
    out.push({ ...n, __level: level });
    if (n.children?.length) flattenTree(n.children, level + 1, out);
  }
  return out;
}

// for edit: exclude itself and only allow root categories as parents (prevent 3+ levels)
function buildParentOptions(flat, editingId) {
  return flat.filter((c) => 
    c.id !== editingId && c.parentId === null // only root categories can be parents
  );
}

export default function CategoriesPage() {
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");

  const [categoriesTree, setCategoriesTree] = useState([]);
  const [query, setQuery] = useState("");
  const [filterParent, setFilterParent] = useState("all");
  const [filterChild, setFilterChild] = useState("all");

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
    return flatAll.filter((c) => {
      // Search filter
      if (q) {
        const name = (c.name ?? "").toLowerCase();
        const desc = (c.description ?? "").toLowerCase();
        if (!name.includes(q) && !desc.includes(q)) return false;
      }
      
      // Cascading parent-child filter
      if (filterParent !== "all") {
        // If parent selected, show parent itself and its children
        const parentId = Number(filterParent);
        const isParent = c.id === parentId;
        const isChildOfParent = c.parentId === parentId;
        
        if (!isParent && !isChildOfParent) return false;
        
        // If specific child is selected
        if (filterChild !== "all") {
          const childId = Number(filterChild);
          if (c.id !== childId && c.id !== parentId) return false;
        }
      }
      
      return true;
    });
  }, [flatAll, query, filterParent, filterChild]);

  const parentOptions = useMemo(
    () => buildParentOptions(flatAll, mode === "edit" ? editingId : null),
    [flatAll, mode, editingId]
  );

  // Root categories for filter dropdown
  const rootCategories = useMemo(
    () => flatAll.filter((c) => c.parentId === null),
    [flatAll]
  );

  // Children of selected parent for child filter dropdown
  const childrenOfSelectedParent = useMemo(() => {
    if (filterParent === "all") return [];
    const parentId = Number(filterParent);
    return flatAll.filter((c) => c.parentId === parentId);
  }, [flatAll, filterParent]);

  // Reset child filter when parent changes
  useEffect(() => {
    setFilterChild("all");
  }, [filterParent]);

  // Category Filters Component (inline)
  const CategoryFilters = ({ query, setQuery, filterParent, setFilterParent, filterChild, setFilterChild, rootCategories, childrenOfSelectedParent, fetchCategories }) => {
    const [showFilters, setShowFilters] = useState(false);
    const hasActiveFilters = query || filterParent !== "all" || filterChild !== "all";

    return (
      <div className="p-3 sm:p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
        {/* Search + Toggle */}
        <div className="flex items-center gap-2 sm:gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search categories..."
            className="flex-1 min-w-0 px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-blue-500"
          />
          
          {/* Desktop Filters */}
          <div className="hidden lg:flex items-center gap-3">
            <select
              value={filterParent}
              onChange={(e) => setFilterParent(e.target.value)}
              className="px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Categories</option>
              {rootCategories.map((cat) => (
                <option key={cat.id} value={String(cat.id)}>{cat.name}</option>
              ))}
            </select>
            {filterParent !== "all" && childrenOfSelectedParent.length > 0 && (
              <select
                value={filterChild}
                onChange={(e) => setFilterChild(e.target.value)}
                className="px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Children</option>
                {childrenOfSelectedParent.map((child) => (
                  <option key={child.id} value={String(child.id)}>{child.name}</option>
                ))}
              </select>
            )}
            {hasActiveFilters && (
              <button
                onClick={() => { setQuery(""); setFilterParent("all"); setFilterChild("all"); }}
                className="text-sm text-blue-600 hover:underline whitespace-nowrap"
              >
                Clear
              </button>
            )}
          </div>
          
          {/* Mobile Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden flex items-center gap-1 px-3 py-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-sm font-medium text-neutral-700 dark:text-neutral-300"
          >
            {showFilters ? <HiChevronUp className="w-4 h-4" /> : <HiChevronDown className="w-4 h-4" />}
            <span className="hidden sm:inline">Filters</span>
            {hasActiveFilters && <span className="w-2 h-2 bg-blue-500 rounded-full" />}
          </button>
          
          <button
            onClick={fetchCategories}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
            title="Refresh"
          >
            <HiRefresh className="w-5 h-5 text-neutral-500" />
          </button>
        </div>
        
        {/* Mobile Filters Dropdown */}
        {showFilters && (
          <div className="lg:hidden mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-700 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">Parent Category</label>
              <select
                value={filterParent}
                onChange={(e) => setFilterParent(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Categories</option>
                {rootCategories.map((cat) => (
                  <option key={cat.id} value={String(cat.id)}>{cat.name}</option>
                ))}
              </select>
            </div>
            {filterParent !== "all" && childrenOfSelectedParent.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1">Child Category</label>
                <select
                  value={filterChild}
                  onChange={(e) => setFilterChild(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="all">All Children</option>
                  {childrenOfSelectedParent.map((child) => (
                    <option key={child.id} value={String(child.id)}>{child.name}</option>
                  ))}
                </select>
              </div>
            )}
            {hasActiveFilters && (
              <button
                onClick={() => { setQuery(""); setFilterParent("all"); setFilterChild("all"); setShowFilters(false); }}
                className="sm:col-span-2 flex items-center justify-center gap-1 text-sm text-blue-600"
              >
                <HiX className="w-4 h-4" /> Clear all filters
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

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
      const res = await adminApi.getCategoryDetail(id);
      const c = res?.data?.data;
      // CategoryResponseDto has id,name,description,parentId,parentName,children
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

    // prepare payload
    const payload = {
      name,
      description: form.description?.trim() || null,
      parentId: form.parentId === "" ? null : Number(form.parentId),
    };

    // Validate: parent must be root category (cannot nest beyond 2 levels)
    if (payload.parentId !== null) {
      const selectedParent = flatAll.find((c) => c.id === payload.parentId);
      if (selectedParent && selectedParent.parentId !== null) {
        setApiError("Cannot nest beyond 2 levels. Selected parent is already a child category.");
        return;
      }
    }

    // Duplicate check (case-insensitive, same parent)
    const normalized = name.toLowerCase();
    const parentKey = payload.parentId === null ? "" : String(payload.parentId);
    const exists = flatAll.some((c) => {
      const cName = String(c.name || "").trim().toLowerCase();
      const cParent = c.parentId === null || c.parentId === undefined ? "" : String(c.parentId);
      // when editing, ignore the current item
      if (mode === "edit" && c.id === editingId) return false;
      return cName === normalized && cParent === parentKey;
    });

    if (exists) {
      setApiError("A category with the same name already exists under the selected parent.");
      return;
    }

    setSaving(true);
    setApiError("");
    try {
      if (mode === "create") {
        await adminApi.createCategory(payload);
      } else {
        await adminApi.updateCategory(editingId, payload);
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
      await adminApi.deleteCategory(id); // DELETE /api/admin/categories/{categoryId}
      await fetchCategories();
    } catch (err) {
      setApiError(err?.response?.data?.message || "Delete failed");
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white">Categories</h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm">
            Manage mentor expertise categories {flatAll.length > 0 && `(${flatAll.length} total)`}
          </p>
        </div>

        <button
          onClick={openCreate}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <HiPlus className="w-4 h-4" />
          New Category
        </button>
      </div>

      {/* Filters - Mobile Responsive */}
      <CategoryFilters
        query={query}
        setQuery={setQuery}
        filterParent={filterParent}
        setFilterParent={setFilterParent}
        filterChild={filterChild}
        setFilterChild={setFilterChild}
        rootCategories={rootCategories}
        childrenOfSelectedParent={childrenOfSelectedParent}
        fetchCategories={fetchCategories}
      />

      {apiError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl p-4">
          {apiError}
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-neutral-50 dark:bg-neutral-800/60">
              <tr className="text-left text-sm font-semibold text-neutral-600 dark:text-neutral-300 uppercase tracking-wide">
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">Parent</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {!loading && filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-neutral-500 dark:text-neutral-400">
                    No categories found.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                    <td className="px-6 py-4">
                      <span className="text-xs font-mono text-neutral-500">#{c.id}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {/* indent for tree */}
                        <div style={{ width: c.__level * 14 }} />
                        <span className="font-medium text-neutral-900 dark:text-white">
                          {c.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-600 dark:text-neutral-300">
                      {c.description || <span className="text-neutral-400">—</span>}
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-600 dark:text-neutral-300">
                      {c.parentName || <span className="text-neutral-400">—</span>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <ActionButton
                          icon={<HiPencil className="w-4 h-4" />}
                          tooltip="Edit Category"
                          onClick={() => openEdit(c.id)}
                          variant="info"
                        />
                        <ActionButton
                          icon={<HiTrash className="w-4 h-4" />}
                          tooltip="Delete Category"
                          onClick={() => onDelete(c.id)}
                          variant="danger"
                        />
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
                    className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-700 dark:text-neutral-200 outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">No parent (root)</option>
                    {parentOptions.map((c) => (
                      <option key={c.id} value={c.id}>
                        {"— ".repeat(c.__level)}
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="text-xs text-neutral-400 mt-2">
                  Leave empty for root category
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
