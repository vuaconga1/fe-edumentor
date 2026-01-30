// src/pages/admin/ReviewsPage.jsx
import React, { useEffect, useState } from "react";
import { HiTrash, HiRefresh, HiStar, HiEye, HiChevronDown, HiChevronUp, HiX } from "react-icons/hi";
import adminApi from "../../api/adminApi";
import ActionButton from "../../components/admin/ActionButton";

export default function ReviewsPage() {
    const [loading, setLoading] = useState(true);
    const [reviews, setReviews] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [pageNumber, setPageNumber] = useState(1);
    const [pageSize] = useState(10);
    const [keyword, setKeyword] = useState("");
    const [filterRating, setFilterRating] = useState("all");
    const [apiError, setApiError] = useState("");

    const fetchReviews = async () => {
        setLoading(true);
        setApiError("");
        try {
            const res = await adminApi.getReviews({ pageNumber, pageSize, keyword });
            const data = res?.data?.data ?? res?.data;
            setReviews(data?.items ?? []);
            setTotalCount(data?.totalCount ?? 0);
        } catch (err) {
            setApiError(err?.response?.data?.message || "Failed to load reviews");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchReviews(); }, [pageNumber]);

    const handleSearch = () => { setPageNumber(1); fetchReviews(); };

    const onDelete = async (id) => {
        const reason = window.prompt("Reason for deletion:", "Inappropriate content");
        if (!reason) return;
        setApiError("");
        try {
            await adminApi.deleteReview(id, reason);
            await fetchReviews();
        } catch (err) {
            setApiError(err?.response?.data?.message || "Failed to delete review");
        }
    };

    const formatDate = (d) => d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";
    const totalPages = Math.ceil(totalCount / pageSize);
    const [showFilters, setShowFilters] = useState(false);
    const hasActiveFilters = keyword || filterRating !== "all";

    const renderStars = (rating) => {
        return (
            <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                    <HiStar key={i} className={`w-4 h-4 ${i <= rating ? "text-amber-400" : "text-neutral-300"}`} />
                ))}
            </div>
        );
    };

    return (
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white">Reviews</h1>
                <p className="text-neutral-500 dark:text-neutral-400 text-sm">
                    Monitor and moderate reviews {totalCount > 0 && `(${totalCount} total)`}
                </p>
            </div>

            {/* Filters - Mobile Responsive */}
            <div className="p-3 sm:p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center gap-2 sm:gap-3">
                    <input
                        type="text"
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                        placeholder="Search reviews..."
                        className="flex-1 min-w-0 px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                    
                    {/* Desktop Filters */}
                    <div className="hidden lg:flex items-center gap-3">
                        <select
                            value={filterRating}
                            onChange={(e) => { setFilterRating(e.target.value); setPageNumber(1); }}
                            className="px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-blue-500"
                        >
                            <option value="all">All Ratings</option>
                            <option value="5">5 Stars</option>
                            <option value="4">4 Stars</option>
                            <option value="3">3 Stars</option>
                            <option value="2">2 Stars</option>
                            <option value="1">1 Star</option>
                        </select>
                        {hasActiveFilters && (
                            <button onClick={() => { setKeyword(""); setFilterRating("all"); }} className="text-sm text-blue-600 hover:underline whitespace-nowrap">
                                Clear
                            </button>
                        )}
                    </div>
                    
                    {/* Mobile Filter Toggle */}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="lg:hidden flex items-center gap-1 px-3 py-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-sm font-medium text-neutral-700 dark:text-neutral-300"
                    >
                        {showFilters ? <HiChevronUp className="w-5 h-5" /> : <HiChevronDown className="w-5 h-5" />}
                        <span className="hidden sm:inline">Filters</span>
                        {hasActiveFilters && <span className="w-2 h-2 bg-blue-500 rounded-full" />}
                    </button>
                    
                    <button onClick={fetchReviews} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors" title="Refresh">
                        <HiRefresh className="w-5 h-5 text-neutral-500" />
                    </button>
                </div>
                
                {/* Mobile Filters Dropdown */}
                {showFilters && (
                    <div className="lg:hidden mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-700 space-y-3">
                        <div>
                            <label className="block text-xs font-medium text-neutral-500 mb-1">Rating</label>
                            <select
                                value={filterRating}
                                onChange={(e) => { setFilterRating(e.target.value); setPageNumber(1); }}
                                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-blue-500"
                            >
                                <option value="all">All Ratings</option>
                                <option value="5">5 Stars</option>
                                <option value="4">4 Stars</option>
                                <option value="3">3 Stars</option>
                                <option value="2">2 Stars</option>
                                <option value="1">1 Star</option>
                            </select>
                        </div>
                        {hasActiveFilters && (
                            <button onClick={() => { setKeyword(""); setFilterRating("all"); setShowFilters(false); }} className="flex items-center gap-1 text-sm text-blue-600">
                                <HiX className="w-4 h-4" /> Clear all filters
                            </button>
                        )}
                    </div>
                )}
            </div>

            {apiError && <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl p-4">{apiError}</div>}

            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-neutral-50 dark:bg-neutral-800/60">
                            <tr className="text-left text-sm font-semibold text-neutral-600 dark:text-neutral-300 uppercase tracking-wide">
                                <th className="px-6 py-4">ID</th>
                                <th className="px-6 py-4">From</th>
                                <th className="px-6 py-4">To</th>
                                <th className="px-6 py-4">Rating</th>
                                <th className="px-6 py-4">Comment</th>
                                <th className="px-6 py-4">Created</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                            {loading ? <tr><td colSpan={7} className="px-5 py-10 text-center text-neutral-500">Loading...</td></tr>
                                : reviews.length === 0 ? <tr><td colSpan={7} className="px-5 py-10 text-center text-neutral-500">No reviews</td></tr>
                                    : reviews.map((r) => (
                                        <tr key={r.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                                            <td className="px-6 py-4 text-sm font-mono">#{r.id}</td>
                                            <td className="px-6 py-4 text-sm">{r.fromUserName || "—"}</td>
                                            <td className="px-6 py-4 text-sm">{r.toUserName || "—"}</td>
                                            <td className="px-6 py-4">{renderStars(r.rating)}</td>
                                            <td className="px-6 py-4 text-sm max-w-[200px] truncate">{r.comment || "—"}</td>
                                            <td className="px-6 py-4 text-sm text-neutral-500">{formatDate(r.createdAt)}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-end gap-1">
                                                    <ActionButton
                                                        icon={<HiEye className="w-4 h-4" />}
                                                        tooltip="View Detail"
                                                        onClick={() => {}}
                                                        variant="info"
                                                    />
                                                    <ActionButton
                                                        icon={<HiTrash className="w-4 h-4" />}
                                                        tooltip="Delete Review"
                                                        onClick={() => onDelete(r.id)}
                                                        variant="danger"
                                                    />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="px-4 sm:px-5 py-3 sm:py-4 border-t border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <span className="text-sm text-neutral-500 text-center sm:text-left">Page {pageNumber} of {totalPages}</span>
                        <div className="flex items-center gap-2">
                            <button disabled={pageNumber === 1} onClick={() => setPageNumber((p) => p - 1)} className="px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-sm disabled:opacity-50">Prev</button>
                            <button disabled={pageNumber === totalPages} onClick={() => setPageNumber((p) => p + 1)} className="px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-sm disabled:opacity-50">Next</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
