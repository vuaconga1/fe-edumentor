// src/pages/admin/HashtagsPage.jsx
import React, { useEffect, useState } from "react";
import { HiPlus, HiTrash, HiX, HiRefresh, HiChevronDown, HiChevronUp } from "react-icons/hi";
import adminApi from "../../api/adminApi";

export default function HashtagsPage() {
    const [loading, setLoading] = useState(true);
    const [hashtags, setHashtags] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [pageNumber, setPageNumber] = useState(1);
    const [pageSize] = useState(20);
    const [keyword, setKeyword] = useState("");
    const [apiError, setApiError] = useState("");

    const [createOpen, setCreateOpen] = useState(false);
    const [newName, setNewName] = useState("");
    const [saving, setSaving] = useState(false);

    const fetchHashtags = async () => {
        setLoading(true);
        setApiError("");
        try {
            const res = await adminApi.getHashtags({ pageNumber, pageSize, keyword });
            const data = res?.data?.data ?? res?.data;
            setHashtags(data?.items ?? []);
            setTotalCount(data?.totalCount ?? 0);
        } catch (err) {
            setApiError(err?.response?.data?.message || "Failed to load hashtags");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHashtags();
    }, [pageNumber]);

    const handleSearch = () => {
        setPageNumber(1);
        fetchHashtags();
    };

    const onCreate = async () => {
        const name = newName.trim();
        if (!name) {
            setApiError("Hashtag name is required");
            return;
        }
        setSaving(true);
        setApiError("");
        try {
            await adminApi.createHashtag(name);
            setNewName("");
            setCreateOpen(false);
            await fetchHashtags();
        } catch (err) {
            setApiError(err?.response?.data?.message || "Failed to create hashtag");
        } finally {
            setSaving(false);
        }
    };

    const onDelete = async (id) => {
        const ok = window.confirm("Delete this hashtag?");
        if (!ok) return;
        setApiError("");
        try {
            await adminApi.deleteHashtag(id);
            await fetchHashtags();
        } catch (err) {
            setApiError(err?.response?.data?.message || "Failed to delete hashtag");
        }
    };

    const totalPages = Math.ceil(totalCount / pageSize);
    const [showFilters, setShowFilters] = useState(false);
    const hasActiveFilters = keyword;

    return (
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white">Hashtags</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 text-sm">
                        Manage mentor skill tags {totalCount > 0 && `(${totalCount} total)`}
                    </p>
                </div>
                <button
                    onClick={() => setCreateOpen(true)}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                    <HiPlus className="w-4 h-4" />
                    New Hashtag
                </button>
            </div>

            {/* Filters - Mobile Responsive */}
            <div className="p-3 sm:p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center gap-2 sm:gap-3">
                    <input
                        type="text"
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                        placeholder="Search hashtags..."
                        className="flex-1 min-w-0 px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                    {hasActiveFilters && (
                        <button
                            onClick={() => setKeyword("")}
                            className="flex items-center gap-1 text-sm text-blue-600 hover:underline whitespace-nowrap"
                        >
                            <HiX className="w-4 h-4" /> Clear
                        </button>
                    )}
                    <button onClick={fetchHashtags} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors" title="Refresh">
                        <HiRefresh className="w-5 h-5 text-neutral-500" />
                    </button>
                </div>
            </div>

            {apiError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl p-4">
                    {apiError}
                </div>
            )}

            {/* Grid */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                <div className="p-5">
                    {loading ? (
                        <div className="text-center text-neutral-500 py-10">Loading...</div>
                    ) : hashtags.length === 0 ? (
                        <div className="text-center text-neutral-500 py-10">No hashtags found</div>
                    ) : (
                        <div className="flex flex-wrap gap-3">
                            {hashtags.map((tag) => (
                                <div
                                    key={tag.id}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-neutral-800 rounded-full group"
                                >
                                    <span className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
                                        #{tag.name}
                                    </span>
                                    <span className="text-xs text-neutral-500">
                                        ({tag.mentorCount ?? 0}m, {tag.categoryCount ?? 0}c)
                                    </span>
                                    <button
                                        onClick={() => onDelete(tag.id)}
                                        className="p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <HiTrash className="w-4 h-4 text-red-500" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-4 sm:px-5 py-3 sm:py-4 border-t border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <span className="text-sm text-neutral-500 text-center sm:text-left">
                            Page {pageNumber} of {totalPages}
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                disabled={pageNumber === 1}
                                onClick={() => setPageNumber((p) => p - 1)}
                                className="px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 text-sm disabled:opacity-50"
                            >
                                Prev
                            </button>
                            <button
                                disabled={pageNumber === totalPages}
                                onClick={() => setPageNumber((p) => p + 1)}
                                className="px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 text-sm disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {createOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
                    <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl">
                        <div className="px-5 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                            <h3 className="font-bold text-neutral-900 dark:text-white">Create Hashtag</h3>
                            <button
                                onClick={() => setCreateOpen(false)}
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
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder="e.g. React, Python, Docker"
                                    className="mt-2 w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
                                />
                            </div>
                        </div>
                        <div className="px-5 py-4 border-t border-neutral-200 dark:border-neutral-800 flex justify-end gap-3">
                            <button
                                onClick={() => setCreateOpen(false)}
                                disabled={saving}
                                className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-60"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={onCreate}
                                disabled={saving}
                                className="px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold disabled:opacity-60"
                            >
                                {saving ? "Creating..." : "Create"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
