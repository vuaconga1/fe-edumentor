// src/pages/admin/ProposalsPage.jsx
import React, { useEffect, useState } from "react";
import { HiFilter, HiTrash, HiRefresh, HiEye } from "react-icons/hi";
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

    const fetchProposals = async () => {
        setLoading(true);
        setApiError("");
        try {
            const res = await adminApi.getProposals({ pageNumber, pageSize, status, keyword });
            const data = res?.data?.data ?? res?.data;
            setProposals(data?.items ?? []);
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

    const formatCurrency = (amount) => new Intl.NumberFormat("vi-VN").format(amount || 0) + "đ";
    const formatDate = (d) => d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";
    const totalPages = Math.ceil(totalCount / pageSize);

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Proposals</h1>
                <p className="text-neutral-500 dark:text-neutral-400 text-sm">
                    Manage mentor proposals {totalCount > 0 && `(${totalCount} total)`}
                </p>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
                <HiFilter className="w-5 h-5 text-neutral-400" />
                <input
                    type="text"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    placeholder="Search proposals..."
                    className="px-3 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-blue-500 flex-1"
                />
                <select
                    value={status}
                    onChange={(e) => { setStatus(e.target.value); setPageNumber(1); }}
                    className="px-3 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-blue-500"
                >
                    {STATUS_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
                {(keyword || status !== "all") && (
                    <button
                        onClick={() => { setKeyword(""); setStatus("all"); }}
                        className="text-sm text-blue-600 hover:underline whitespace-nowrap"
                    >
                        Clear filters
                    </button>
                )}
                <button onClick={fetchProposals} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors" title="Refresh">
                    <HiRefresh className="w-5 h-5 text-neutral-500" />
                </button>
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
                                                        onClick={() => {}}
                                                        variant="info"
                                                    />
                                                    <ActionButton
                                                        icon={<HiTrash className="w-4 h-4" />}
                                                        tooltip="Delete Proposal"
                                                        onClick={() => onDelete(p.id)}
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
                    <div className="px-5 py-4 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                        <button disabled={pageNumber === 1} onClick={() => setPageNumber((p) => p - 1)} className="px-4 py-2 rounded-xl border disabled:opacity-50">Previous</button>
                        <span className="text-sm text-neutral-500">Page {pageNumber} of {totalPages}</span>
                        <button disabled={pageNumber === totalPages} onClick={() => setPageNumber((p) => p + 1)} className="px-4 py-2 rounded-xl border disabled:opacity-50">Next</button>
                    </div>
                )}
            </div>
        </div>
    );
}
