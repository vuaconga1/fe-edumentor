// src/pages/admin/RequestsPage.jsx
import React, { useEffect, useState } from "react";
import { HiTrash, HiEye, HiRefresh, HiChevronDown, HiChevronUp, HiX } from "react-icons/hi";
import adminApi from "../../api/adminApi";
import ActionButton from "../../components/admin/ActionButton";

const STATUS_OPTIONS = [
    { value: "all", label: "All Status" },
    { value: "Open", label: "Open" },
    { value: "Closed", label: "Closed" },
    { value: "Cancelled", label: "Cancelled" },
];

export default function RequestsPage() {
    const [loading, setLoading] = useState(true);
    const [requests, setRequests] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [pageNumber, setPageNumber] = useState(1);
    const [pageSize] = useState(10);
    const [status, setStatus] = useState("all");
    const [keyword, setKeyword] = useState("");
    const [apiError, setApiError] = useState("");
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [detailOpen, setDetailOpen] = useState(false);

    const fetchRequests = async () => {
        setLoading(true);
        setApiError("");
        try {
            const res = await adminApi.getRequests({ pageNumber, pageSize, status, keyword });
            const data = res?.data?.data ?? res?.data;
            const items = (data?.items ?? []).map(item => ({
                ...item,
                status: item.statusDisplay || item.status,
            }));
            setRequests(items);
            setTotalCount(data?.totalCount ?? 0);
        } catch (err) {
            setApiError(err?.response?.data?.message || "Failed to load requests");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchRequests(); }, [pageNumber, status]);

    const handleSearch = () => { setPageNumber(1); fetchRequests(); };

    const onDelete = async (id) => {
        const reason = window.prompt("Reason for deletion:", "Violated policies");
        if (!reason) return;
        setApiError("");
        try {
            await adminApi.deleteRequest(id, reason);
            await fetchRequests();
        } catch (err) {
            setApiError(err?.response?.data?.message || "Failed to delete request");
        }
    };

    const getStatusColor = (s) => {
        const colors = {
            Open: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20",
            Closed: "text-neutral-600 bg-neutral-100 dark:bg-neutral-800",
            Cancelled: "text-red-600 bg-red-50 dark:bg-red-900/20",
        };
        return colors[s] || colors.Open;
    };

    const formatCurrency = (amount) => new Intl.NumberFormat("vi-VN").format(amount || 0) + " VND";
    const formatDate = (d) => d ? new Date(d.endsWith?.('Z') ? d : d + 'Z').toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";
    const totalPages = Math.ceil(totalCount / pageSize);
    const [showFilters, setShowFilters] = useState(false);
    const hasActiveFilters = keyword || status !== "all";

    return (
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white">Requests</h1>
                <p className="text-neutral-500 dark:text-neutral-400 text-sm">
                    Manage student requests {totalCount > 0 && `(${totalCount} total)`}
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
                        placeholder="Search requests..."
                        className="flex-1 min-w-0 px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                    
                    {/* Desktop Filters */}
                    <div className="hidden lg:flex items-center gap-3">
                        <select
                            value={status}
                            onChange={(e) => { setStatus(e.target.value); setPageNumber(1); }}
                            className="px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-blue-500"
                        >
                            {STATUS_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                        {hasActiveFilters && (
                            <button onClick={() => { setKeyword(""); setStatus("all"); }} className="text-sm text-blue-600 hover:underline whitespace-nowrap">
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
                    
                    <button onClick={fetchRequests} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors" title="Refresh">
                        <HiRefresh className="w-5 h-5 text-neutral-500" />
                    </button>
                </div>
                
                {/* Mobile Filters Dropdown */}
                {showFilters && (
                    <div className="lg:hidden mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-700 space-y-3">
                        <div>
                            <label className="block text-xs font-medium text-neutral-500 mb-1">Status</label>
                            <select
                                value={status}
                                onChange={(e) => { setStatus(e.target.value); setPageNumber(1); }}
                                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-blue-500"
                            >
                                {STATUS_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                        </div>
                        {hasActiveFilters && (
                            <button onClick={() => { setKeyword(""); setStatus("all"); setShowFilters(false); }} className="flex items-center gap-1 text-sm text-blue-600">
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
                                <th className="px-6 py-4">Title</th>
                                <th className="px-6 py-4">Student</th>
                                <th className="px-6 py-4">Budget</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Created</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                            {loading ? <tr><td colSpan={7} className="px-6 py-10 text-center text-neutral-500">Loading...</td></tr>
                                : requests.length === 0 ? <tr><td colSpan={7} className="px-6 py-10 text-center text-neutral-500">No requests</td></tr>
                                    : requests.map((r) => (
                                        <tr key={r.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                                            <td className="px-6 py-4 text-sm font-mono">#{r.id}</td>
                                            <td className="px-6 py-4 text-sm font-medium text-neutral-900 dark:text-white max-w-[200px] truncate">{r.title || "—"}</td>
                                            <td className="px-6 py-4 text-sm">{r.studentName || "—"}</td>
                                            <td className="px-6 py-4 text-sm font-semibold">{formatCurrency(r.expectedBudget)}</td>
                                            <td className="px-6 py-4"><span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(r.status)}`}>{r.status}</span></td>
                                            <td className="px-6 py-4 text-sm text-neutral-500">{formatDate(r.createdAt)}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-end gap-1">
                                                    <ActionButton
                                                        icon={<HiEye className="w-4 h-4" />}
                                                        tooltip="View Detail"
                                                        onClick={() => { setSelectedRequest(r); setDetailOpen(true); }}
                                                        variant="info"
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

            {/* Detail Modal */}
            {detailOpen && selectedRequest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
                    <div className="w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="px-4 sm:px-5 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                            <h3 className="font-bold text-neutral-900 dark:text-white">Request #{selectedRequest.id}</h3>
                            <button onClick={() => setDetailOpen(false)} className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800">
                                <HiX className="w-5 h-5 text-neutral-500" />
                            </button>
                        </div>
                        <div className="p-4 sm:p-5 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="sm:col-span-2">
                                    <p className="text-xs text-neutral-500 uppercase tracking-wide mb-1">Title</p>
                                    <p className="font-medium text-neutral-900 dark:text-white">{selectedRequest.title || "—"}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-neutral-500 uppercase tracking-wide mb-1">Student</p>
                                    <p className="font-medium text-neutral-900 dark:text-white">{selectedRequest.studentName || "—"}</p>
                                    {selectedRequest.studentEmail && <p className="text-xs text-neutral-500">{selectedRequest.studentEmail}</p>}
                                </div>
                                <div>
                                    <p className="text-xs text-neutral-500 uppercase tracking-wide mb-1">Category</p>
                                    <p className="font-medium text-neutral-900 dark:text-white">{selectedRequest.categoryName || "—"}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-neutral-500 uppercase tracking-wide mb-1">Budget</p>
                                    <p className="font-semibold text-neutral-900 dark:text-white">{formatCurrency(selectedRequest.expectedBudget)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-neutral-500 uppercase tracking-wide mb-1">Status</p>
                                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedRequest.status)}`}>{selectedRequest.statusDisplay || selectedRequest.status}</span>
                                </div>
                                <div>
                                    <p className="text-xs text-neutral-500 uppercase tracking-wide mb-1">Proposals</p>
                                    <p className="font-medium text-neutral-900 dark:text-white">{selectedRequest.proposalCount ?? 0}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-neutral-500 uppercase tracking-wide mb-1">Orders</p>
                                    <p className="font-medium text-neutral-900 dark:text-white">{selectedRequest.orderCount ?? 0}</p>
                                </div>
                                <div className="sm:col-span-2">
                                    <p className="text-xs text-neutral-500 uppercase tracking-wide mb-1">Created At</p>
                                    <p className="font-medium text-neutral-900 dark:text-white">{formatDate(selectedRequest.createdAt)}</p>
                                </div>
                            </div>
                            {selectedRequest.description && (
                                <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl">
                                    <p className="text-xs text-neutral-500 uppercase tracking-wide mb-1">Description</p>
                                    <p className="text-neutral-900 dark:text-white whitespace-pre-wrap">{selectedRequest.description}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
