// src/pages/admin/ProposalsPage.jsx
import React, { useEffect, useState } from "react";
import { HiTrash, HiRefresh, HiEye, HiX, HiChevronDown, HiChevronUp } from "react-icons/hi";
import adminApi from "../../api/adminApi";
import ActionButton from "../../components/admin/ActionButton";

const STATUS_OPTIONS = [
    { value: "all", label: "All Status" },
    { value: "Pending", label: "Pending" },
    { value: "Accepted", label: "Accepted" },
    { value: "Rejected", label: "Rejected" },
    { value: "Withdrawn", label: "Withdrawn" },
];

export default function ProposalsPage() {
    const [loading, setLoading] = useState(true);
    const [proposals, setProposals] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [pageNumber, setPageNumber] = useState(1);
    const [pageSize] = useState(10);
    const [status, setStatus] = useState("all");
    const [keyword, setKeyword] = useState("");
    const [apiError, setApiError] = useState("");
    const [showFilters, setShowFilters] = useState(false);
    const [selectedProposal, setSelectedProposal] = useState(null);
    const [detailOpen, setDetailOpen] = useState(false);

    const fetchProposals = async () => {
        setLoading(true);
        setApiError("");
        try {
            const res = await adminApi.getProposals({ pageNumber, pageSize, status, keyword });
            const data = res?.data?.data ?? res?.data;
            const items = (data?.items ?? []).map(item => ({
                ...item,
                status: item.statusDisplay || item.status,
            }));
            setProposals(items);
            setTotalCount(data?.totalCount ?? 0);
        } catch (err) {
            setApiError(err?.response?.data?.message || "Failed to load proposals");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchProposals(); }, [pageNumber, status]);

    const handleSearch = () => { setPageNumber(1); fetchProposals(); };

    const onDelete = async (id) => {
        const reason = window.prompt("Reason for deletion:", "Violated policies");
        if (!reason) return;
        setApiError("");
        try {
            await adminApi.deleteProposal(id, reason);
            await fetchProposals();
        } catch (err) {
            setApiError(err?.response?.data?.message || "Failed to delete proposal");
        }
    };

    const getStatusColor = (s) => {
        const colors = {
            Pending: "text-amber-600 bg-amber-50 dark:bg-amber-900/20",
            Accepted: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20",
            Rejected: "text-red-600 bg-red-50 dark:bg-red-900/20",
            Withdrawn: "text-neutral-600 bg-neutral-100 dark:bg-neutral-800",
        };
        return colors[s] || colors.Pending;
    };

    const formatCurrency = (amount) => new Intl.NumberFormat("vi-VN").format(amount || 0) + " VND";
    const formatDate = (d) => d ? new Date(d.endsWith?.('Z') ? d : d + 'Z').toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";
    const totalPages = Math.ceil(totalCount / pageSize);

    return (
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white">Proposals</h1>
                <p className="text-neutral-500 dark:text-neutral-400 text-sm">
                    Manage mentor proposals {totalCount > 0 && `(${totalCount} total)`}
                </p>
            </div>

            {/* Filters */}
            <div className="p-3 sm:p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center gap-2 sm:gap-3">
                    <input
                        type="text"
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                        placeholder="Search proposals..."
                        className="flex-1 min-w-0 px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                    
                    {/* Desktop filters */}
                    <div className="hidden lg:flex items-center gap-3">
                        <select
                            value={status}
                            onChange={(e) => { setStatus(e.target.value); setPageNumber(1); }}
                            className="px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-blue-500"
                        >
                            {STATUS_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                        {(keyword || status !== "all") && (
                            <button
                                onClick={() => { setKeyword(""); setStatus("all"); }}
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
                        {showFilters ? <HiChevronUp className="w-5 h-5" /> : <HiChevronDown className="w-5 h-5" />}
                        <span className="hidden sm:inline">Filters</span>
                    </button>

                    <button onClick={fetchProposals} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors" title="Refresh">
                        <HiRefresh className="w-5 h-5 text-neutral-500" />
                    </button>
                </div>

                {/* Mobile filters dropdown */}
                {showFilters && (
                    <div className="lg:hidden mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-700 space-y-3">
                        <select
                            value={status}
                            onChange={(e) => { setStatus(e.target.value); setPageNumber(1); }}
                            className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-blue-500"
                        >
                            {STATUS_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                        {(keyword || status !== "all") && (
                            <button
                                onClick={() => { setKeyword(""); setStatus("all"); }}
                                className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
                            >
                                <HiX className="w-4 h-4" />
                                Clear all filters
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
                                <th className="px-6 py-4">Mentor</th>
                                <th className="px-6 py-4">Request</th>
                                <th className="px-6 py-4">Price</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Created</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                            {loading ? <tr><td colSpan={7} className="px-5 py-10 text-center text-neutral-500">Loading...</td></tr>
                                : proposals.length === 0 ? <tr><td colSpan={7} className="px-5 py-10 text-center text-neutral-500">No proposals</td></tr>
                                    : proposals.map((p) => (
                                        <tr key={p.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                                            <td className="px-6 py-4 text-sm font-mono">#{p.id}</td>
                                            <td className="px-6 py-4 text-sm font-medium text-neutral-900 dark:text-white">{p.mentorName || "—"}</td>
                                            <td className="px-6 py-4 text-sm max-w-[150px] truncate">{p.requestTitle || `Request #${p.requestId}`}</td>
                                            <td className="px-6 py-4 text-sm font-semibold">{formatCurrency(p.price)}</td>
                                            <td className="px-6 py-4"><span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(p.status)}`}>{p.status}</span></td>
                                            <td className="px-6 py-4 text-sm text-neutral-500">{formatDate(p.createdAt)}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-end gap-1">
                                                    <ActionButton
                                                        icon={<HiEye className="w-4 h-4" />}
                                                        tooltip="View Detail"
                                                        onClick={() => { setSelectedProposal(p); setDetailOpen(true); }}
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
            {detailOpen && selectedProposal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
                    <div className="w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="px-4 sm:px-5 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                            <h3 className="font-bold text-neutral-900 dark:text-white">Proposal #{selectedProposal.id}</h3>
                            <button onClick={() => setDetailOpen(false)} className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800">
                                <HiX className="w-5 h-5 text-neutral-500" />
                            </button>
                        </div>
                        <div className="p-4 sm:p-5 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-neutral-500 uppercase tracking-wide mb-1">Mentor</p>
                                    <p className="font-medium text-neutral-900 dark:text-white">{selectedProposal.mentorName || "—"}</p>
                                    {selectedProposal.mentorEmail && <p className="text-xs text-neutral-500">{selectedProposal.mentorEmail}</p>}
                                </div>
                                <div>
                                    <p className="text-xs text-neutral-500 uppercase tracking-wide mb-1">Student</p>
                                    <p className="font-medium text-neutral-900 dark:text-white">{selectedProposal.studentName || "—"}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-neutral-500 uppercase tracking-wide mb-1">Request</p>
                                    <p className="font-medium text-neutral-900 dark:text-white">{selectedProposal.requestTitle || `Request #${selectedProposal.requestId}`}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-neutral-500 uppercase tracking-wide mb-1">Price</p>
                                    <p className="font-semibold text-neutral-900 dark:text-white">{formatCurrency(selectedProposal.price)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-neutral-500 uppercase tracking-wide mb-1">Status</p>
                                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedProposal.status)}`}>{selectedProposal.statusDisplay || selectedProposal.status}</span>
                                </div>
                                <div>
                                    <p className="text-xs text-neutral-500 uppercase tracking-wide mb-1">Created At</p>
                                    <p className="font-medium text-neutral-900 dark:text-white">{formatDate(selectedProposal.createdAt)}</p>
                                </div>
                            </div>
                            {selectedProposal.message && (
                                <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl">
                                    <p className="text-xs text-neutral-500 uppercase tracking-wide mb-1">Message</p>
                                    <p className="text-neutral-900 dark:text-white whitespace-pre-wrap">{selectedProposal.message}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
