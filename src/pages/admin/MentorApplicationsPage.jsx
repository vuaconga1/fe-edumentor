// src/pages/admin/MentorApplicationsPage.jsx
import React, { useEffect, useState, useMemo } from "react";
import { HiX, HiEye, HiRefresh, HiClipboardList, HiChevronDown, HiChevronUp } from "react-icons/hi";
import adminApi from "../../api/adminApi";
import ActionButton from "../../components/admin/ActionButton";

const STATUS_OPTIONS = [
    { value: "all", label: "All Status" },
    { value: "Pending", label: "Pending" },
    { value: "Approved", label: "Approved" },
    { value: "Rejected", label: "Rejected" },
];

export default function MentorApplicationsPage() {
    const [loading, setLoading] = useState(true);
    const [applications, setApplications] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [pageNumber, setPageNumber] = useState(1);
    const [pageSize] = useState(10);
    const [status, setStatus] = useState("all");
    const [searchKeyword, setSearchKeyword] = useState("");
    const [debouncedKeyword, setDebouncedKeyword] = useState("");
    const [apiError, setApiError] = useState("");

    const [selectedApp, setSelectedApp] = useState(null);
    const [detailOpen, setDetailOpen] = useState(false);
    const [rejectOpen, setRejectOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [processing, setProcessing] = useState(false);

    // History/Log states
    const [historyOpen, setHistoryOpen] = useState(false);
    const [historyData, setHistoryData] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyPageNumber, setHistoryPageNumber] = useState(1);
    const [historyTotalCount, setHistoryTotalCount] = useState(0);
    const [historyPageSize] = useState(10);
    const [historyActionFilter, setHistoryActionFilter] = useState("all");

    const fetchApplications = async () => {
        setLoading(true);
        setApiError("");
        try {
            const queryStatus = status === "all" ? undefined : status;
            const res = await adminApi.getMentorApplications({ pageNumber, pageSize, status: queryStatus });
            const data = res?.data?.data ?? res?.data;
            setApplications(data?.items ?? []);
            setTotalCount(data?.totalCount ?? 0);
        } catch (err) {
            setApiError(err?.response?.data?.message || "Failed to load applications");
        } finally {
            setLoading(false);
        }
    };

    // Debounce searchKeyword
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedKeyword(searchKeyword), 400);
        return () => clearTimeout(handler);
    }, [searchKeyword]);

    useEffect(() => {
        fetchApplications();
    }, [pageNumber, status]);

    const openDetail = (app) => {
        setSelectedApp(app);
        setDetailOpen(true);
    };

    const handleApprove = async (userId) => {
        const ok = window.confirm("Approve this mentor application?");
        if (!ok) return;

        setProcessing(true);
        setApiError("");
        try {
            await adminApi.approveMentorApplication(userId);
            await fetchApplications();
            setDetailOpen(false);
        } catch (err) {
            setApiError(err?.response?.data?.message || "Failed to approve application");
        } finally {
            setProcessing(false);
        }
    };

    const openReject = (app) => {
        setSelectedApp(app);
        setRejectReason("");
        setRejectOpen(true);
    };

    // History functions
    const fetchHistory = async () => {
        setHistoryLoading(true);
        try {
            const res = await adminApi.getApplicationHistory({
                pageNumber: historyPageNumber,
                pageSize: historyPageSize,
                action: historyActionFilter === "all" ? null : historyActionFilter
            });
            const data = res?.data?.data ?? res?.data;
            setHistoryData(data?.items ?? []);
            setHistoryTotalCount(data?.totalCount ?? 0);
        } catch (err) {
            console.error("Failed to load history:", err);
        } finally {
            setHistoryLoading(false);
        }
    };

    const openHistory = () => {
        setHistoryOpen(true);
        setHistoryPageNumber(1);
        setHistoryActionFilter("all");
    };

    useEffect(() => {
        if (historyOpen) {
            fetchHistory();
        }
    }, [historyOpen, historyPageNumber, historyActionFilter]);

    const getActionLabel = (action) => {
        const labels = {
            0: "Submitted",
            1: "Approved",
            2: "Rejected",
            3: "Auto Approved",
            4: "Auto Rejected"
        };
        return labels[action] ?? action;
    };

    const getActionColor = (action) => {
        const colors = {
            0: "text-blue-600 bg-blue-50 dark:bg-blue-900/20",
            1: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20",
            2: "text-red-600 bg-red-50 dark:bg-red-900/20",
            3: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20",
            4: "text-red-600 bg-red-50 dark:bg-red-900/20"
        };
        return colors[action] ?? colors[0];
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return "—";
        return new Date(dateString).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    const handleReject = async () => {
        if (!rejectReason.trim()) {
            setApiError("Rejection reason is required");
            return;
        }

        setProcessing(true);
        setApiError("");
        try {
            await adminApi.rejectMentorApplication(selectedApp.userId, rejectReason);
            await fetchApplications();
            setRejectOpen(false);
            setDetailOpen(false);
        } catch (err) {
            setApiError(err?.response?.data?.message || "Failed to reject application");
        } finally {
            setProcessing(false);
        }
    };

    const getStatusLabel = (s) => {
        if (s === 0 || s === "Pending") return "Pending";
        if (s === 1 || s === "Approved") return "Approved";
        if (s === 2 || s === "Rejected") return "Rejected";
        return s;
    };

    const getStatusColor = (s) => {
        let key = "Pending";
        if (s === 1 || s === "Approved") key = "Approved";
        if (s === 2 || s === "Rejected") key = "Rejected";

        const colors = {
            Pending: "text-amber-600 bg-amber-50 dark:bg-amber-900/20",
            Approved: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20",
            Rejected: "text-red-600 bg-red-50 dark:bg-red-900/20",
        };
        return colors[key] || colors.Pending;
    };

    const formatDate = (dateString) => {
        if (!dateString) return "—";
        return new Date(dateString).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    const totalPages = Math.ceil(totalCount / pageSize);
    const [showFilters, setShowFilters] = useState(false);
    const hasActiveFilters = searchKeyword || status !== "all";

    // API base URL for file links
    const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://localhost:7082";

    // Helper to convert relative URL to absolute
    const toAbsoluteUrl = (url) => {
        if (!url) return "";
        if (url.startsWith("http")) return url;
        return `${API_BASE}${url.startsWith("/") ? url : "/" + url}`;
    };

    // Filter applications by search keyword
    const filteredApplications = useMemo(() => {
        if (!debouncedKeyword) return applications;
        const keyword = debouncedKeyword.toLowerCase();
        return applications.filter((app) => {
            const fullName = String(app.fullName || "").toLowerCase();
            const email = String(app.email || "").toLowerCase();
            return fullName.includes(keyword) || email.includes(keyword);
        });
    }, [applications, debouncedKeyword]);

    return (
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white">Mentor Applications</h1>
                <p className="text-neutral-500 dark:text-neutral-400 text-sm">
                    Review mentor registration requests {totalCount > 0 && `(${totalCount} total)`}
                </p>
            </div>

            {/* Filters - Mobile Responsive */}
            <div className="p-3 sm:p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center gap-2 sm:gap-3">
                    <input
                        type="text"
                        value={searchKeyword}
                        onChange={(e) => setSearchKeyword(e.target.value)}
                        placeholder="Search applications..."
                        className="flex-1 min-w-0 px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                    
                    {/* Desktop Filters */}
                    <div className="hidden lg:flex items-center gap-3">
                        <select
                            value={status}
                            onChange={(e) => { setStatus(e.target.value); setPageNumber(1); }}
                            className="px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-blue-500"
                        >
                            {STATUS_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                        {hasActiveFilters && (
                            <button
                                onClick={() => { setStatus("all"); setSearchKeyword(""); setPageNumber(1); }}
                                className="text-sm text-blue-600 hover:underline whitespace-nowrap"
                            >
                                Clear
                            </button>
                        )}
                        <button
                            onClick={openHistory}
                            className="flex items-center gap-2 px-3 py-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors text-sm text-neutral-700 dark:text-neutral-300"
                            title="View History Log"
                        >
                            <HiClipboardList className="w-4 h-4" />
                            <span>View Log</span>
                        </button>
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
                        onClick={fetchApplications}
                        className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                        title="Refresh"
                    >
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
                                {STATUS_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={openHistory}
                                className="flex items-center gap-2 px-3 py-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors text-sm text-neutral-700 dark:text-neutral-300"
                            >
                                <HiClipboardList className="w-4 h-4" />
                                <span>View Log</span>
                            </button>
                            {hasActiveFilters && (
                                <button onClick={() => { setStatus("all"); setSearchKeyword(""); setPageNumber(1); setShowFilters(false); }} className="flex items-center gap-1 text-sm text-blue-600">
                                    <HiX className="w-4 h-4" /> Clear all filters
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-neutral-50 dark:bg-neutral-800/60">
                            <tr className="text-left text-sm font-semibold text-neutral-600 dark:text-neutral-300 uppercase tracking-wide">
                                <th className="px-6 py-4">ID</th>
                                <th className="px-6 py-4">Applicant</th>
                                <th className="px-6 py-4">Title</th>
                                <th className="px-6 py-4">Experience</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Applied</th>
                                <th className="px-6 py-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-10 text-center text-neutral-500">Loading...</td>
                                </tr>
                            ) : filteredApplications.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-10 text-center text-neutral-500">No applications found</td>
                                </tr>
                            ) : (
                                filteredApplications.map((app) => (
                                    <tr key={app.userId} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-mono text-neutral-500">#{app.userId}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={app.avatarUrl || "/avatar-default.jpg"}
                                                    alt=""
                                                    className="w-10 h-10 rounded-full object-cover"
                                                />
                                                <div>
                                                    <p className="text-sm font-medium text-neutral-900 dark:text-white">
                                                        {app.fullName || "—"}
                                                    </p>
                                                    <p className="text-xs text-neutral-500">{app.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-neutral-700 dark:text-neutral-300">
                                            {app.title || "—"}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-neutral-700 dark:text-neutral-300">
                                            {app.experienceYears ? `${app.experienceYears} years` : "—"}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(app.approvalStatus)}`}>
                                                {getStatusLabel(app.approvalStatus)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-neutral-500">
                                            {formatDate(app.createdAt)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1">
                                                <ActionButton
                                                    icon={<HiEye className="w-4 h-4" />}
                                                    tooltip="View Details"
                                                    onClick={() => openDetail(app)}
                                                    variant="info"
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
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
                                className="px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-sm disabled:opacity-50"
                            >
                                Prev
                            </button>
                            <button
                                disabled={pageNumber === totalPages}
                                onClick={() => setPageNumber((p) => p + 1)}
                                className="px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-sm disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {detailOpen && selectedApp && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
                    <div className="w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="px-5 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                            <h3 className="font-bold text-neutral-900 dark:text-white">Application Details</h3>
                            <button onClick={() => setDetailOpen(false)} className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800">
                                <HiX className="w-5 h-5 text-neutral-500" />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div className="flex items-center gap-4">
                                <img src={selectedApp.avatarUrl || "/avatar-default.jpg"} alt="" className="w-16 h-16 rounded-full object-cover" />
                                <div>
                                    <h4 className="text-lg font-bold text-neutral-900 dark:text-white">{selectedApp.fullName}</h4>
                                    <p className="text-neutral-500">{selectedApp.email}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                                <div>
                                    <p className="text-xs text-neutral-500">Title</p>
                                    <p className="font-medium text-neutral-900 dark:text-white">{selectedApp.title || "—"}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-neutral-500">Experience</p>
                                    <p className="font-medium text-neutral-900 dark:text-white">{selectedApp.experienceYears ? `${selectedApp.experienceYears} years` : "—"}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-neutral-500">Specialization</p>
                                    <p className="font-medium text-neutral-900 dark:text-white">{selectedApp.specialization || "—"}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-neutral-500">Status</p>
                                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedApp.approvalStatus)}`}>
                                        {getStatusLabel(selectedApp.approvalStatus)}
                                    </span>
                                </div>
                            </div>

                            {selectedApp.introduction && (
                                <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
                                    <p className="text-xs text-neutral-500 mb-1">Introduction</p>
                                    <p className="text-sm text-neutral-700 dark:text-neutral-300">{selectedApp.introduction}</p>
                                </div>
                            )}

                            {selectedApp.portfolioUrl && (
                                <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
                                    <p className="text-xs text-neutral-500 mb-1">Portfolio</p>
                                    <a href={selectedApp.portfolioUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                                        {selectedApp.portfolioUrl}
                                    </a>
                                </div>
                            )}

                            {selectedApp.certificationUrls && (
                                <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
                                    <p className="text-xs text-neutral-500 mb-2">Qualifications / CV</p>
                                    <div className="flex flex-col gap-2">
                                        {selectedApp.certificationUrls.split(',').map((url, idx) => (
                                            <a
                                                key={idx}
                                                href={toAbsoluteUrl(url.trim())}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sm text-blue-600 hover:underline"
                                            >
                                                View Document {idx + 1}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {selectedApp.rejectionReason && (
                                <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
                                    <p className="text-xs text-neutral-500 mb-1">Rejection Reason</p>
                                    <p className="text-sm text-red-600">{selectedApp.rejectionReason}</p>
                                </div>
                            )}
                        </div>

                        {(selectedApp.approvalStatus === "Pending" || selectedApp.approvalStatus === 0) && (
                            <div className="px-5 py-4 border-t border-neutral-200 dark:border-neutral-800 flex justify-end gap-3">
                                <button
                                    onClick={() => openReject(selectedApp)}
                                    className="px-4 py-2 rounded-xl border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 hover:bg-red-50"
                                >
                                    Reject
                                </button>
                                <button
                                    onClick={() => handleApprove(selectedApp.userId)}
                                    disabled={processing}
                                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold disabled:opacity-50"
                                >
                                    {processing ? "Processing..." : "Approve"}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Reject Modal */}
            {rejectOpen && selectedApp && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
                    <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl">
                        <div className="px-5 py-4 border-b border-neutral-200 dark:border-neutral-800">
                            <h3 className="font-bold text-neutral-900 dark:text-white">Reject Application</h3>
                        </div>
                        <div className="p-5 space-y-4">
                            <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                Please provide a reason for rejecting {selectedApp.fullName}'s application:
                            </p>
                            {apiError && (
                                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg p-3 text-sm">
                                    {apiError}
                                </div>
                            )}
                            <textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                rows={3}
                                placeholder="Enter rejection reason..."
                                className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                        <div className="px-5 py-4 border-t border-neutral-200 dark:border-neutral-800 flex justify-end gap-3">
                            <button
                                onClick={() => setRejectOpen(false)}
                                disabled={processing}
                                className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReject}
                                disabled={processing}
                                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold disabled:opacity-50"
                            >
                                {processing ? "Rejecting..." : "Reject"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* History/Log Modal */}
            {historyOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
                    <div className="w-full max-w-4xl bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl max-h-[90vh] flex flex-col">
                        <div className="px-5 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-neutral-900 dark:text-white">Application History Log</h3>
                                <p className="text-xs text-neutral-500 mt-0.5">
                                    Audit trail of all mentor application actions
                                </p>
                            </div>
                            <button onClick={() => setHistoryOpen(false)} className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800">
                                <HiX className="w-5 h-5 text-neutral-500" />
                            </button>
                        </div>

                        {/* Filters */}
                        <div className="px-5 py-3 border-b border-neutral-200 dark:border-neutral-800 flex items-center gap-3">
                            <span className="text-sm text-neutral-500">Filter by action:</span>
                            <select
                                value={historyActionFilter}
                                onChange={(e) => { setHistoryActionFilter(e.target.value); setHistoryPageNumber(1); }}
                                className="px-3 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-white focus:outline-none"
                            >
                                <option value="all">All Actions</option>
                                <option value="0">Submitted</option>
                                <option value="1">Approved</option>
                                <option value="2">Rejected</option>
                            </select>
                            {historyTotalCount > 0 && (
                                <span className="text-xs text-neutral-400 ml-auto">{historyTotalCount} records</span>
                            )}
                        </div>

                        {/* Table */}
                        <div className="flex-1 overflow-auto">
                            <table className="min-w-full">
                                <thead className="bg-neutral-50 dark:bg-neutral-800/60 sticky top-0">
                                    <tr className="text-left text-xs font-semibold text-neutral-600 dark:text-neutral-300 uppercase tracking-wide">
                                        <th className="px-5 py-3">User</th>
                                        <th className="px-5 py-3">Action</th>
                                        <th className="px-5 py-3">Reason</th>
                                        <th className="px-5 py-3">By</th>
                                        <th className="px-5 py-3">Time</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                    {historyLoading ? (
                                        <tr>
                                            <td colSpan={5} className="px-5 py-10 text-center text-neutral-500">Loading...</td>
                                        </tr>
                                    ) : historyData.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-5 py-10 text-center text-neutral-500">No history records found</td>
                                        </tr>
                                    ) : (
                                        historyData.map((item) => (
                                            <tr key={item.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                                                <td className="px-5 py-3">
                                                    <div>
                                                        <p className="text-sm font-medium text-neutral-900 dark:text-white">
                                                            {item.userFullName || "—"}
                                                        </p>
                                                        <p className="text-xs text-neutral-500">{item.userEmail}</p>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3">
                                                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getActionColor(item.action)}`}>
                                                        {getActionLabel(item.action)}
                                                    </span>
                                                    {item.submissionCount > 1 && (
                                                        <span className="ml-2 text-xs text-neutral-400">
                                                            (#{item.submissionCount})
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-5 py-3">
                                                    <p className="text-sm text-neutral-600 dark:text-neutral-400 max-w-xs truncate">
                                                        {item.reason || "—"}
                                                    </p>
                                                </td>
                                                <td className="px-5 py-3">
                                                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                                        {item.createdByEmail || (item.action === 0 ? "User" : "System")}
                                                    </p>
                                                </td>
                                                <td className="px-5 py-3">
                                                    <p className="text-sm text-neutral-500 whitespace-nowrap">
                                                        {formatDateTime(item.createdAt)}
                                                    </p>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {Math.ceil(historyTotalCount / historyPageSize) > 1 && (
                            <div className="px-5 py-3 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                                <button
                                    disabled={historyPageNumber === 1}
                                    onClick={() => setHistoryPageNumber((p) => p - 1)}
                                    className="px-3 py-1.5 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 disabled:opacity-50"
                                >
                                    Previous
                                </button>
                                <span className="text-xs text-neutral-500">
                                    Page {historyPageNumber} of {Math.ceil(historyTotalCount / historyPageSize)}
                                </span>
                                <button
                                    disabled={historyPageNumber >= Math.ceil(historyTotalCount / historyPageSize)}
                                    onClick={() => setHistoryPageNumber((p) => p + 1)}
                                    className="px-3 py-1.5 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
