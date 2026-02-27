// src/pages/admin/MentorApplicationsPage.jsx
import React, { useEffect, useState, useMemo } from "react";
import { HiX, HiEye, HiRefresh, HiClipboardList, HiChevronDown, HiChevronUp, HiSearch } from "react-icons/hi";
import adminApi from "../../api/adminApi";
import ActionButton from "../../components/admin/ActionButton";
import { normalizeAvatarUrl, buildDefaultAvatarUrl } from "../../utils/avatar";

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
    const [reEvaluating, setReEvaluating] = useState(false);

    // History/Log states
    const [historyOpen, setHistoryOpen] = useState(false);
    const [historyData, setHistoryData] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyPageNumber, setHistoryPageNumber] = useState(1);
    const [historyTotalCount, setHistoryTotalCount] = useState(0);
    const [historyPageSize] = useState(10);
    const [historyActionFilter, setHistoryActionFilter] = useState("all");
    const [historySearchQuery, setHistorySearchQuery] = useState("");

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

    const openDetail = async (app) => {
        setSelectedApp(app); // show immediately with list data
        setDetailOpen(true);
        // Then fetch full detail (with AI analysis fields)
        try {
            const res = await adminApi.getMentorApplicationDetail(app.userId);
            const detail = res?.data?.data ?? res?.data;
            if (detail) setSelectedApp(detail);
        } catch (err) {
            console.error("Failed to load application detail:", err);
        }
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

    const handleReEvaluate = async (userId) => {
        const ok = window.confirm("Run AI analysis on this application? This will use Gemini API quota.");
        if (!ok) return;

        setReEvaluating(true);
        setApiError("");
        try {
            const res = await adminApi.reEvaluateMentorApplication(userId);
            const updatedApp = res?.data?.data;
            if (updatedApp) {
                setSelectedApp(updatedApp);
            }
            await fetchApplications();
            alert(res?.data?.message || "AI re-evaluation completed!");
        } catch (err) {
            setApiError(err?.response?.data?.message || "Failed to re-evaluate application");
        } finally {
            setReEvaluating(false);
        }
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
        setHistorySearchQuery("");
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
            4: "Auto Rejected",
            5: "AI Re-evaluated"
        };
        return labels[action] ?? action;
    };

    const getActionColor = (action) => {
        const colors = {
            0: "text-blue-600 bg-blue-50 dark:bg-blue-900/20",
            1: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20",
            2: "text-red-600 bg-red-50 dark:bg-red-900/20",
            3: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20",
            4: "text-red-600 bg-red-50 dark:bg-red-900/20",
            5: "text-purple-600 bg-purple-50 dark:bg-purple-900/20"
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

    // Filter and sort history data
    const filteredAndSortedHistoryData = useMemo(() => {
        if (!historyData || historyData.length === 0) return [];
        
        let filtered = historyData;
        
        // Filter by search query - show ALL records of matching users
        if (historySearchQuery.trim()) {
            const query = historySearchQuery.toLowerCase();
            
            // Find all userIds that match the search query
            const matchingUserIds = new Set();
            historyData.forEach(item => {
                const fullName = (item.userFullName || "").toLowerCase();
                const email = (item.userEmail || "").toLowerCase();
                if (fullName.includes(query) || email.includes(query)) {
                    matchingUserIds.add(item.userId);
                }
            });
            
            // Include all records from matching users
            filtered = historyData.filter(item => matchingUserIds.has(item.userId));
        }
        
        // Group by userId and sort: group records of same user together
        const sorted = [...filtered].sort((a, b) => {
            // First, compare by userId to keep same user's records together
            if (a.userId !== b.userId) {
                const nameA = (a.userFullName || a.userEmail || "").toLowerCase();
                const nameB = (b.userFullName || b.userEmail || "").toLowerCase();
                return nameA.localeCompare(nameB);
            }
            // Within same user, sort by creation date (newest first)
            return new Date(b.createdAt) - new Date(a.createdAt);
        });
        
        return sorted;
    }, [historyData, historySearchQuery]);

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
                        {showFilters ? <HiChevronUp className="w-5 h-5" /> : <HiChevronDown className="w-5 h-5" />}
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
                                <th className="px-6 py-4">Specialization</th>
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
                                                    src={normalizeAvatarUrl(app.avatarUrl) || buildDefaultAvatarUrl({ id: app.userId, fullName: app.fullName, email: app.email })}
                                                    alt=""
                                                    className="w-10 h-10 rounded-full object-cover"
                                                    onError={(e) => {
                                                        e.currentTarget.onerror = null;
                                                        e.currentTarget.src = buildDefaultAvatarUrl({ id: app.userId, fullName: app.fullName, email: app.email });
                                                    }}
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
                                            {app.specialization || "—"}
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
                    <div className="w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 shadow-xl max-h-[90vh] overflow-y-auto">
                        <div className="px-5 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                            <h3 className="font-semibold text-neutral-900 dark:text-white">Application Details</h3>
                            <button onClick={() => setDetailOpen(false)} className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800">
                                <HiX className="w-5 h-5 text-neutral-500" />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div className="flex items-center gap-4">
                                <img 
                                    src={normalizeAvatarUrl(selectedApp.avatarUrl) || buildDefaultAvatarUrl({ id: selectedApp.userId, fullName: selectedApp.fullName, email: selectedApp.email })} 
                                    alt="" 
                                    className="w-16 h-16 rounded-full object-cover"
                                    onError={(e) => {
                                        e.currentTarget.onerror = null;
                                        e.currentTarget.src = buildDefaultAvatarUrl({ id: selectedApp.userId, fullName: selectedApp.fullName, email: selectedApp.email });
                                    }}
                                />
                                <div>
                                    <h4 className="text-lg font-bold text-neutral-900 dark:text-white">{selectedApp.fullName}</h4>
                                    <p className="text-neutral-500">{selectedApp.email}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                                <div>
                                    <p className="text-xs text-neutral-500">Specialization</p>
                                    <p className="font-medium text-neutral-900 dark:text-white">{selectedApp.specialization || "—"}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-neutral-500">Experience</p>
                                    <p className="font-medium text-neutral-900 dark:text-white">{selectedApp.experienceYears ? `${selectedApp.experienceYears} years` : "—"}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-neutral-500">Status</p>
                                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedApp.approvalStatus)}`}>
                                        {getStatusLabel(selectedApp.approvalStatus)}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-xs text-neutral-500">Applied Date</p>
                                    <p className="font-medium text-neutral-900 dark:text-white">{formatDate(selectedApp.createdAt)}</p>
                                </div>
                            </div>

                            {/* Categories */}
                            {selectedApp.categories && selectedApp.categories.length > 0 && (
                                <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
                                    <p className="text-xs text-neutral-500 mb-2">Categories</p>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedApp.categories.map((cat, idx) => (
                                            <span key={idx} className="px-2 py-1 text-xs font-medium bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 rounded-md">
                                                {cat.name || cat}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Hashtags */}
                            {selectedApp.hashtags && selectedApp.hashtags.length > 0 && (
                                <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
                                    <p className="text-xs text-neutral-500 mb-2">Hashtags / Skills</p>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedApp.hashtags.map((tag, idx) => (
                                            <span key={idx} className="px-2 py-1 text-xs font-medium bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 rounded-md">
                                                #{tag.name || tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

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

                            {/* AI Analysis Section */}
                            {selectedApp.isAiReviewed && (
                                <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
                                    <div className="flex items-center gap-2 mb-3">
                                        <h4 className="text-sm font-semibold text-neutral-900 dark:text-white">AI Analysis</h4>
                                        {selectedApp.aiModelVersion && (
                                            <span className="text-xs text-neutral-400">({selectedApp.aiModelVersion})</span>
                                        )}
                                    </div>

                                    {/* Confidence Score */}
                                    {selectedApp.aiConfidenceScore != null && (
                                        <div className="mb-3">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs text-neutral-500">Confidence Score</span>
                                                <span className={`text-sm font-semibold ${
                                                    selectedApp.aiConfidenceScore >= 80 ? 'text-emerald-600' :
                                                    selectedApp.aiConfidenceScore >= 50 ? 'text-amber-600' :
                                                    'text-red-600'
                                                }`}>
                                                    {selectedApp.aiConfidenceScore}%
                                                </span>
                                            </div>
                                            <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
                                                <div 
                                                    className={`h-2 rounded-full transition-all ${
                                                        selectedApp.aiConfidenceScore >= 80 ? 'bg-emerald-500' :
                                                        selectedApp.aiConfidenceScore >= 50 ? 'bg-amber-500' :
                                                        'bg-red-500'
                                                    }`}
                                                    style={{ width: `${selectedApp.aiConfidenceScore}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Recommended Action */}
                                    {selectedApp.aiRecommendedAction && (
                                        <div className="mb-3">
                                            <span className="text-xs text-neutral-500 block mb-1">Recommendation</span>
                                            <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                                                selectedApp.aiRecommendedAction === 'AUTO_APPROVE' 
                                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                                selectedApp.aiRecommendedAction === 'AUTO_REJECT'
                                                    ? 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                    'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                            }`}>
                                                {selectedApp.aiRecommendedAction === 'AUTO_APPROVE' ? 'Auto Approve' :
                                                 selectedApp.aiRecommendedAction === 'AUTO_REJECT' ? 'Auto Reject' :
                                                 'Manual Review'}
                                            </span>
                                        </div>
                                    )}

                                    {/* AI Reasoning */}
                                    {selectedApp.aiReasoning && (
                                        <div className="mb-3 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
                                            <p className="text-xs text-neutral-500 mb-1">Reasoning</p>
                                            <p className="text-sm text-neutral-700 dark:text-neutral-300">{selectedApp.aiReasoning}</p>
                                        </div>
                                    )}

                                    {/* Key Points */}
                                    {selectedApp.aiKeyPoints && selectedApp.aiKeyPoints.length > 0 && (
                                        <div className="mb-3">
                                            <p className="text-xs text-neutral-500 mb-1.5">Strengths</p>
                                            <ul className="space-y-1">
                                                {selectedApp.aiKeyPoints.map((point, idx) => (
                                                    <li key={idx} className="text-sm text-neutral-700 dark:text-neutral-300 pl-3 border-l-2 border-emerald-400">
                                                        {point}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Red Flags */}
                                    {selectedApp.aiRedFlags && selectedApp.aiRedFlags.length > 0 && (
                                        <div className="mb-3">
                                            <p className="text-xs text-neutral-500 mb-1.5">Concerns</p>
                                            <ul className="space-y-1">
                                                {selectedApp.aiRedFlags.map((flag, idx) => (
                                                    <li key={idx} className="text-sm text-neutral-700 dark:text-neutral-300 pl-3 border-l-2 border-red-400">
                                                        {flag}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Action buttons section */}
                        <div className="px-5 py-4 border-t border-neutral-200 dark:border-neutral-800 flex flex-wrap justify-end gap-3">
                            {/* Re-evaluate with AI — always available */}
                            <button
                                onClick={() => handleReEvaluate(selectedApp.userId)}
                                disabled={reEvaluating || processing}
                                className="px-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-sm font-medium disabled:opacity-50 flex items-center gap-2"
                            >
                                {reEvaluating ? (
                                    <>
                                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                                        Analyzing...
                                    </>
                                ) : (
                                    "Re-evaluate with AI"
                                )}
                            </button>

                            {/* Approve/Reject — only for Pending */}
                            {(selectedApp.approvalStatus === "Pending" || selectedApp.approvalStatus === 0) && (
                                <>
                                <button
                                    onClick={() => openReject(selectedApp)}
                                    className="px-4 py-2 rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm font-medium"
                                >
                                    Reject
                                </button>
                                <button
                                    onClick={() => handleApprove(selectedApp.userId)}
                                    disabled={processing}
                                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium disabled:opacity-50"
                                >
                                    {processing ? "Processing..." : "Approve"}
                                </button>
                                </>
                            )}
                        </div>
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/40">
                    <div className="w-full max-w-4xl bg-white dark:bg-neutral-900 rounded-xl sm:rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl max-h-[95vh] sm:max-h-[90vh] flex flex-col">
                        <div className="px-3 sm:px-5 py-3 sm:py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-sm sm:text-base text-neutral-900 dark:text-white truncate">Application History Log</h3>
                                <p className="text-xs text-neutral-500 mt-0.5 hidden sm:block">
                                    Audit trail of all mentor application actions
                                </p>
                            </div>
                            <button onClick={() => setHistoryOpen(false)} className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 flex-shrink-0">
                                <HiX className="w-4 h-4 sm:w-5 sm:h-5 text-neutral-500" />
                            </button>
                        </div>

                        {/* Filters */}
                        <div className="px-3 sm:px-5 py-2 sm:py-3 border-b border-neutral-200 dark:border-neutral-800">
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                                {/* Action Filter */}
                                <div className="flex items-center gap-2">
                                    <span className="text-xs sm:text-sm text-neutral-500 whitespace-nowrap">Filter:</span>
                                    <select
                                        value={historyActionFilter}
                                        onChange={(e) => { setHistoryActionFilter(e.target.value); setHistoryPageNumber(1); }}
                                        className="flex-1 sm:flex-none px-2 sm:px-3 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs sm:text-sm text-neutral-900 dark:text-white focus:outline-none"
                                    >
                                        <option value="all">All Actions</option>
                                        <option value="0">Submitted</option>
                                        <option value="1">Approved</option>
                                        <option value="2">Rejected</option>
                                    </select>
                                </div>
                                
                                {/* Search Input */}
                                <div className="flex-1 relative">
                                    <HiSearch className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-neutral-400" />
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        value={historySearchQuery}
                                        onChange={(e) => setHistorySearchQuery(e.target.value)}
                                        className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs sm:text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                
                                {/* Record Count */}
                                {historyTotalCount > 0 && (
                                    <span className="text-xs text-neutral-400 whitespace-nowrap text-center sm:text-left">
                                        {filteredAndSortedHistoryData.length} / {historyTotalCount} records
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Table */}
                        <div className="flex-1 overflow-auto">
                            <table className="min-w-full text-xs sm:text-sm">
                                <thead className="bg-neutral-50 dark:bg-neutral-800/60 sticky top-0">
                                    <tr className="text-left text-[10px] sm:text-xs font-semibold text-neutral-600 dark:text-neutral-300 uppercase tracking-wide">
                                        <th className="px-2 sm:px-5 py-2 sm:py-3 min-w-[120px] sm:min-w-0">User</th>
                                        <th className="px-2 sm:px-5 py-2 sm:py-3 min-w-[90px] sm:min-w-0">Action</th>
                                        <th className="px-2 sm:px-5 py-2 sm:py-3 hidden md:table-cell">Reason</th>
                                        <th className="px-2 sm:px-5 py-2 sm:py-3 hidden lg:table-cell">By</th>
                                        <th className="px-2 sm:px-5 py-2 sm:py-3 min-w-[100px] sm:min-w-0">Time</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                    {historyLoading ? (
                                        <tr>
                                            <td colSpan={5} className="px-2 sm:px-5 py-8 sm:py-10 text-center text-neutral-500 text-xs sm:text-sm">Loading...</td>
                                        </tr>
                                    ) : filteredAndSortedHistoryData.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-2 sm:px-5 py-8 sm:py-10 text-center text-neutral-500 text-xs sm:text-sm">
                                                {historySearchQuery ? "No matching results found" : "No history records found"}
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredAndSortedHistoryData.map((item) => (
                                            <tr key={item.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                                                <td className="px-2 sm:px-5 py-2 sm:py-3">
                                                    <div>
                                                        <p className="text-xs sm:text-sm font-medium text-neutral-900 dark:text-white line-clamp-1">
                                                            {item.userFullName || "—"}
                                                        </p>
                                                        <p className="text-[10px] sm:text-xs text-neutral-500 truncate">{item.userEmail}</p>
                                                    </div>
                                                </td>
                                                <td className="px-2 sm:px-5 py-2 sm:py-3">
                                                    <span className={`inline-block px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium rounded-full ${getActionColor(item.action)}`}>
                                                        {getActionLabel(item.action)}
                                                    </span>
                                                    {item.submissionCount > 1 && (
                                                        <span className="ml-1 sm:ml-2 text-[10px] sm:text-xs text-neutral-400">
                                                            (#{item.submissionCount})
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-2 sm:px-5 py-2 sm:py-3 hidden md:table-cell">
                                                    <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 max-w-xs truncate">
                                                        {item.reason || "—"}
                                                    </p>
                                                </td>
                                                <td className="px-2 sm:px-5 py-2 sm:py-3 hidden lg:table-cell">
                                                    <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 truncate">
                                                        {item.createdByEmail || (item.action === 0 ? "User" : "System")}
                                                    </p>
                                                </td>
                                                <td className="px-2 sm:px-5 py-2 sm:py-3">
                                                    <p className="text-[10px] sm:text-sm text-neutral-500 whitespace-nowrap">
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
                            <div className="px-3 sm:px-5 py-2 sm:py-3 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-2">
                                <button
                                    disabled={historyPageNumber === 1}
                                    onClick={() => setHistoryPageNumber((p) => p - 1)}
                                    className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 disabled:opacity-50 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                                >
                                    <span className="hidden sm:inline">Previous</span>
                                    <span className="sm:hidden">Prev</span>
                                </button>
                                <span className="text-[10px] sm:text-xs text-neutral-500">
                                    Page {historyPageNumber} of {Math.ceil(historyTotalCount / historyPageSize)}
                                </span>
                                <button
                                    disabled={historyPageNumber >= Math.ceil(historyTotalCount / historyPageSize)}
                                    onClick={() => setHistoryPageNumber((p) => p + 1)}
                                    className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 disabled:opacity-50 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
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
