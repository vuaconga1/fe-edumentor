// src/pages/admin/CategoryHashtagsPage.jsx

import React, { useEffect, useState, useMemo } from "react";
import {
  HiPlus,
  HiTrash,
  HiX,
  HiChevronDown,
  HiChevronUp,
  HiRefresh,
  HiHashtag,
  HiEye,
  HiPencil,
} from "react-icons/hi";
import adminApi from "../../api/adminApi";
import ActionButton from "../../components/admin/ActionButton";

export default function CategoryHashtagsPage() {
  // Data states
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [mappings, setMappings] = useState([]); // Category with hashtags list
  const [categories, setCategories] = useState([]);
  const [hashtags, setHashtags] = useState([]);

  // Filter states
  const [query, setQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  // Modal states
  const [openModal, setOpenModal] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedHashtagId, setSelectedHashtagId] = useState("");
  const [saving, setSaving] = useState(false);
  
  // Detail/Edit/Delete modals
  const [detailModal, setDetailModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch all data
  const fetchData = async () => {
    setLoading(true);
    setApiError("");

    try {
      const [mappingsRes, categoriesRes, hashtagsRes] = await Promise.all([
        adminApi.getCategoryHashtagMappings(),
        adminApi.getCategories(),
        adminApi.getHashtags(),
      ]);

      // Process mappings - API returns grouped by category
      const mappingsData = mappingsRes?.data?.data ?? mappingsRes?.data ?? [];
      setMappings(Array.isArray(mappingsData) ? mappingsData : []);

      // Process categories - flatten tree structure
      const categoriesData = categoriesRes?.data?.data ?? categoriesRes?.data ?? [];
      const flatCategories = flattenCategories(Array.isArray(categoriesData) ? categoriesData : []);
      setCategories(flatCategories);

      // Process hashtags
      const hashtagsData = hashtagsRes?.data?.data?.items ?? hashtagsRes?.data?.items ?? hashtagsRes?.data?.data ?? [];
      setHashtags(Array.isArray(hashtagsData) ? hashtagsData : []);
    } catch (err) {
      setApiError(err?.response?.data?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  // Flatten category tree
  const flattenCategories = (nodes, level = 0, out = []) => {
    for (const n of nodes) {
      out.push({ ...n, __level: level });
      if (n.children?.length) flattenCategories(n.children, level + 1, out);
    }
    return out;
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Create flat list of all mappings for table display
  const flatMappings = useMemo(() => {
    const result = [];
    mappings.forEach(cat => {
      if (cat.hashtags && cat.hashtags.length > 0) {
        cat.hashtags.forEach(hashtag => {
          result.push({
            categoryId: cat.categoryId,
            categoryName: cat.categoryName,
            hashtagId: hashtag.id,
            hashtagName: hashtag.name,
          });
        });
      }
    });
    return result;
  }, [mappings]);

  // Filter by category (show mappings grouped by category)
  const filteredCategoryMappings = useMemo(() => {
    const q = query.trim().toLowerCase();
    return mappings.filter(m => {
      // Search filter
      if (q) {
        const catName = (m.categoryName ?? "").toLowerCase();
        const hasMatchingHashtag = m.hashtags?.some(h => 
          (h.name ?? "").toLowerCase().includes(q)
        );
        if (!catName.includes(q) && !hasMatchingHashtag) return false;
      }
      // Category filter
      if (filterCategory !== "all" && m.categoryId !== Number(filterCategory)) {
        return false;
      }
      return true;
    });
  }, [mappings, query, filterCategory]);

  // Get hashtags not yet mapped to selected category
  const availableHashtags = useMemo(() => {
    if (!selectedCategoryId) return hashtags;
    
    const existingMapping = mappings.find(m => m.categoryId === Number(selectedCategoryId));
    const mappedHashtagIds = existingMapping?.hashtags?.map(h => h.id) || [];
    
    return hashtags.filter(h => !mappedHashtagIds.includes(h.id));
  }, [selectedCategoryId, mappings, hashtags]);

  // Handle add mapping
  const handleAddMapping = async () => {
    if (!selectedCategoryId || !selectedHashtagId) {
      setApiError("Please select both category and hashtag");
      return;
    }

    setSaving(true);
    setApiError("");

    try {
      await adminApi.addCategoryHashtagMapping(
        Number(selectedCategoryId), 
        Number(selectedHashtagId)
      );
      
      setOpenModal(false);
      setSelectedCategoryId("");
      setSelectedHashtagId("");
      await fetchData();
    } catch (err) {
      setApiError(err?.response?.data?.message || "Failed to add mapping");
    } finally {
      setSaving(false);
    }
  };

  // Handle view detail
  const handleViewDetail = (category) => {
    setSelectedCategory(category);
    setDetailModal(true);
  };

  // Handle edit
  const handleEdit = (category) => {
    setSelectedCategory(category);
    setEditModal(true);
  };

  // Handle delete all mappings for a category
  const handleDelete = (category) => {
    setSelectedCategory(category);
    setDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedCategory) return;
    
    try {
      // Delete all hashtag mappings for this category
      const deletePromises = selectedCategory.hashtags.map(h =>
        adminApi.removeCategoryHashtagMapping(selectedCategory.categoryId, h.id)
      );
      await Promise.all(deletePromises);
      
      setApiError("");
      setDeleteModal(false);
      setSelectedCategory(null);
      await fetchData();
    } catch (err) {
      setApiError(err?.response?.data?.message || "Failed to delete mappings");
    }
  };

  // Handle remove single hashtag in edit modal
  const handleRemoveHashtag = async (hashtagId) => {
    if (!selectedCategory) return;
    
    try {
      await adminApi.removeCategoryHashtagMapping(selectedCategory.categoryId, hashtagId);
      // Refresh selected category data
      const updatedCategory = {
        ...selectedCategory,
        hashtags: selectedCategory.hashtags.filter(h => h.id !== hashtagId)
      };
      setSelectedCategory(updatedCategory);
      await fetchData();
    } catch (err) {
      setApiError(err?.response?.data?.message || "Failed to remove hashtag");
    }
  };

  // Handle add hashtag in edit modal
  const handleAddHashtagToCategory = async (hashtagId) => {
    if (!selectedCategory) return;
    
    try {
      await adminApi.addCategoryHashtagMapping(selectedCategory.categoryId, hashtagId);
      await fetchData();
      // Refresh the selected category
      const res = await adminApi.getCategoryHashtagMappings();
      const mappingsData = res?.data?.data ?? res?.data ?? [];
      const updated = mappingsData.find(m => m.categoryId === selectedCategory.categoryId);
      if (updated) setSelectedCategory(updated);
    } catch (err) {
      setApiError(err?.response?.data?.message || "Failed to add hashtag");
    }
  };

  // Clear filters
  const clearFilters = () => {
    setQuery("");
    setFilterCategory("all");
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* API Error */}
      {apiError && (
        <div className="fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg bg-red-500 text-white">
          {apiError}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white">Category-Hashtag Mapping</h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm">
            Map hashtags to categories {flatMappings.length > 0 && `(${flatMappings.length} mappings)`}
          </p>
        </div>
        <button
          onClick={() => setOpenModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium w-full sm:w-auto"
        >
          <HiPlus className="w-4 h-4" />
          Add Mapping
        </button>
      </div>

      {/* Filters */}
      <div className="p-3 sm:p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-2 sm:gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search category or hashtag..."
            className="flex-1 min-w-0 px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-blue-500"
          />
          
          {/* Desktop filters */}
          <div className="hidden lg:flex items-center gap-3">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {"─".repeat(c.__level || 0)} {c.name}
                </option>
              ))}
            </select>
            {(query || filterCategory !== "all") && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-sm text-blue-600 hover:underline whitespace-nowrap"
              >
                <HiX className="w-4 h-4" />
                Clear
              </button>
            )}
          </div>

          {/* Mobile filter toggle */}
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden flex items-center gap-1 px-3 py-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-sm text-neutral-700 dark:text-neutral-300"
          >
            {showFilters ? <HiChevronUp className="w-4 h-4" /> : <HiChevronDown className="w-4 h-4" />}
            <span className="hidden sm:inline">Filters</span>
          </button>

          <button onClick={fetchData} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors" title="Refresh">
            <HiRefresh className="w-5 h-5 text-neutral-500" />
          </button>
        </div>

        {/* Mobile filters dropdown */}
        {showFilters && (
          <div className="lg:hidden mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-700 space-y-3">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {"─".repeat(c.__level || 0)} {c.name}
                </option>
              ))}
            </select>
            {(query || filterCategory !== "all") && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
              >
                <HiX className="w-4 h-4" />
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-neutral-900 rounded-xl p-3 sm:p-4 border border-neutral-200 dark:border-neutral-800">
          <div className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">Total Categories</div>
          <div className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white mt-1">{categories.length}</div>
        </div>
        <div className="bg-white dark:bg-neutral-900 rounded-xl p-3 sm:p-4 border border-neutral-200 dark:border-neutral-800">
          <div className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">Total Hashtags</div>
          <div className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white mt-1">{hashtags.length}</div>
        </div>
        <div className="bg-white dark:bg-neutral-900 rounded-xl p-3 sm:p-4 border border-neutral-200 dark:border-neutral-800">
          <div className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">Total Mappings</div>
          <div className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white mt-1">{flatMappings.length}</div>
        </div>
      </div>

      {/* Main Table */}
      {!loading && (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-800">
              <thead className="bg-neutral-50 dark:bg-neutral-900">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                    Hashtags
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-neutral-900 divide-y divide-neutral-100 dark:divide-neutral-800">
                {filteredCategoryMappings.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-neutral-400 dark:text-neutral-500">
                      No mappings found
                    </td>
                  </tr>
                ) : (
                  filteredCategoryMappings.map((m, idx) => (
                    <tr
                      key={m.categoryId}
                      className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                    >
                      <td className="px-4 py-3 text-sm text-neutral-600 dark:text-neutral-400 font-mono">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-neutral-900 dark:text-white">
                        {m.categoryName}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {m.hashtags && m.hashtags.length > 0 ? (
                            <>
                              {m.hashtags.slice(0, 3).map((hashtag) => (
                                <span 
                                  key={hashtag.id}
                                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full"
                                >
                                  <HiHashtag className="w-3 h-3" />
                                  {hashtag.name}
                                </span>
                              ))}
                              {m.hashtags.length > 3 && (
                                <span className="inline-flex items-center px-2 py-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-xs rounded-full">
                                  +{m.hashtags.length - 3} more
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-xs text-neutral-400 dark:text-neutral-500">No hashtags</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <ActionButton
                            icon={HiEye}
                            tooltip="View Detail"
                            onClick={() => handleViewDetail(m)}
                            variant="info"
                          />
                          <ActionButton
                            icon={HiPencil}
                            tooltip="Edit Hashtags"
                            onClick={() => handleEdit(m)}
                            variant="info"
                          />
                          <ActionButton
                            icon={HiTrash}
                            tooltip="Delete All Mappings"
                            onClick={() => handleDelete(m)}
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

          {/* Footer Info */}
          <div className="px-4 py-3 border-t border-neutral-100 dark:border-neutral-800 text-sm text-neutral-500 dark:text-neutral-400">
            Showing {filteredCategoryMappings.length} categor{filteredCategoryMappings.length === 1 ? 'y' : 'ies'}
          </div>
        </div>
      )}

      {/* Add Mapping Modal */}
      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Add Category-Hashtag Mapping
              </h2>
              <button
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                onClick={() => {
                  setOpenModal(false);
                  setSelectedCategoryId("");
                  setSelectedHashtagId("");
                }}
              >
                <HiX className="w-5 h-5" />
              </button>
            </div>

            {/* Category Select */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  className="appearance-none w-full px-3 py-2 pr-8 border border-gray-300 dark:border-gray-600 rounded-lg
                    bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                    focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={selectedCategoryId}
                  onChange={(e) => {
                    setSelectedCategoryId(e.target.value);
                    setSelectedHashtagId(""); // Reset hashtag when category changes
                  }}
                >
                  <option value="">Select category...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {"─".repeat(c.__level || 0)} {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Hashtag Select */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Hashtag <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  className="appearance-none w-full px-3 py-2 pr-8 border border-gray-300 dark:border-gray-600 rounded-lg
                    bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                    focus:ring-2 focus:ring-blue-500 focus:outline-none
                    disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
                  value={selectedHashtagId}
                  onChange={(e) => setSelectedHashtagId(e.target.value)}
                  disabled={!selectedCategoryId}
                >
                  <option value="">
                    {selectedCategoryId ? "Select hashtag..." : "Select category first"}
                  </option>
                  {availableHashtags.map((h) => (
                    <option key={h.id} value={h.id}>
                      #{h.name}
                    </option>
                  ))}
                </select>
              </div>
              {selectedCategoryId && availableHashtags.length === 0 && (
                <p className="mt-1 text-sm text-yellow-600 dark:text-yellow-400">
                  All hashtags are already mapped to this category
                </p>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 
                  rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                onClick={() => {
                  setOpenModal(false);
                  setSelectedCategoryId("");
                  setSelectedHashtagId("");
                }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium
                  disabled:bg-blue-400 disabled:cursor-not-allowed"
                onClick={handleAddMapping}
                disabled={saving || !selectedCategoryId || !selectedHashtagId}
              >
                {saving ? "Adding..." : "Add Mapping"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailModal && selectedCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-xl w-full max-w-2xl p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                Category Hashtags Detail
              </h2>
              <button
                className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                onClick={() => { setDetailModal(false); setSelectedCategory(null); }}
              >
                <HiX className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4">
              <h3 className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">Category Name</h3>
              <p className="text-neutral-900 dark:text-white font-medium">{selectedCategory.categoryName}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                Hashtags ({selectedCategory.hashtags?.length || 0})
              </h3>
              <div className="flex flex-wrap gap-2">
                {selectedCategory.hashtags && selectedCategory.hashtags.length > 0 ? (
                  selectedCategory.hashtags.map((hashtag) => (
                    <span 
                      key={hashtag.id}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm rounded-full"
                    >
                      <HiHashtag className="w-3 h-3" />
                      {hashtag.name}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-neutral-400 dark:text-neutral-500">No hashtags mapped to this category</p>
                )}
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                className="px-4 py-2 border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 
                  rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700"
                onClick={() => { setDetailModal(false); setSelectedCategory(null); }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal && selectedCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-xl w-full max-w-2xl p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                Edit Category Hashtags
              </h2>
              <button
                className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                onClick={() => { setEditModal(false); setSelectedCategory(null); }}
              >
                <HiX className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4">
              <h3 className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">Category Name</h3>
              <p className="text-neutral-900 dark:text-white font-medium">{selectedCategory.categoryName}</p>
            </div>

            <div className="mb-4">
              <h3 className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                Current Hashtags ({selectedCategory.hashtags?.length || 0})
              </h3>
              <div className="flex flex-wrap gap-2">
                {selectedCategory.hashtags && selectedCategory.hashtags.length > 0 ? (
                  selectedCategory.hashtags.map((hashtag) => (
                    <span 
                      key={hashtag.id}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm rounded-full"
                    >
                      <HiHashtag className="w-3 h-3" />
                      {hashtag.name}
                      <button
                        onClick={() => handleRemoveHashtag(hashtag.id)}
                        className="hover:text-red-600 dark:hover:text-red-400"
                      >
                        <HiX className="w-4 h-4" />
                      </button>
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-neutral-400 dark:text-neutral-500">No hashtags mapped</p>
                )}
              </div>
            </div>

            <div className="mb-4">
              <h3 className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                Add Hashtag
              </h3>
              <select
                className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg
                  bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white
                  focus:ring-2 focus:ring-blue-500 focus:outline-none"
                onChange={(e) => {
                  if (e.target.value) {
                    handleAddHashtagToCategory(Number(e.target.value));
                    e.target.value = "";
                  }
                }}
              >
                <option value="">Select hashtag to add...</option>
                {hashtags
                  .filter(h => !selectedCategory.hashtags?.some(ch => ch.id === h.id))
                  .map((h) => (
                    <option key={h.id} value={h.id}>
                      #{h.name}
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 
                  rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700"
                onClick={() => { setEditModal(false); setSelectedCategory(null); }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal && selectedCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                Confirm Delete
              </h2>
              <button
                className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                onClick={() => { setDeleteModal(false); setSelectedCategory(null); }}
              >
                <HiX className="w-5 h-5" />
              </button>
            </div>

            <p className="text-neutral-600 dark:text-neutral-300 mb-4">
              Are you sure you want to remove all hashtag mappings for category <strong>{selectedCategory.categoryName}</strong>? 
              This will delete {selectedCategory.hashtags?.length || 0} mapping(s).
            </p>

            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 
                  rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700"
                onClick={() => { setDeleteModal(false); setSelectedCategory(null); }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium"
                onClick={confirmDelete}
              >
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
