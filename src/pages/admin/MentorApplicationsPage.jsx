// src/pages/admin/MentorApplicationsPage.jsx
import React, { useEffect, useState, useMemo } from "react";
import { HiFilter, HiCheck, HiX, HiEye, HiRefresh, HiExternalLink } from "react-icons/hi";
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

    const fetchApplications = async () => {
        setLoading(true);
        setApiError("");
        try {
            const res = await adminApi.getMentorApplications({ pageNumber, pageSize, status });
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

    const getStatusColor = (s) => {
        const colors = {
            Pending: "text-amber-600 bg-amber-50 dark:bg-amber-900/20",
            Approved: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20",
            Rejected: "text-red-600 bg-red-50 dark:bg-red-900/20",
        };
        return colors[s] || colors.Pending;
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
        <div className="p-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Mentor Applications</h1>
                <p className="text-neutral-500 dark:text-neutral-400 text-sm">
                    Review mentor registration requests {totalCount > 0 && `(${totalCount} total)`}
                </p>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
                <HiFilter className="w-5 h-5 text-neutral-400" />
                <input
                    type="text"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    placeholder="Search by name or email..."
                    className="px-3 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-blue-500 flex-1"
                />
                <select
                    value={status}
                    onChange={(e) => { setStatus(e.target.value); setPageNumber(1); }}
                    className="px-3 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-blue-500"
                >
                    {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
                {(status !== "all" || searchKeyword) && (
                    <button
                        onClick={() => { setStatus("all"); setSearchKeyword(""); setPageNumber(1); }}
                        className="text-sm text-blue-600 hover:underline whitespace-nowrap"
                    >
                        Clear filters
                    </button>
                )}
                <button
                    onClick={fetchApplications}
                    className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                    title="Refresh"
                >
                    <HiRefresh className="w-5 h-5 text-neutral-500" />
                </button>
            </div>

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
                                                {app.approvalStatus}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-neutral-500">
                                            {formatDate(app.createdAt)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1 h-full">
                                                <span className="flex items-center justify-center w-10 h-10">
                                                    <ActionButton
                                                        icon={<HiEye className="w-4 h-4" />}
                                                        tooltip="View Details"
                                                        onClick={() => openDetail(app)}
                                                        variant="info"
                                                    />
                                                </span>
                                                {app.approvalStatus === "Pending" && (
                                                    <>
                                                        <ActionButton
                                                            icon={<HiCheck className="w-4 h-4" />}
                                                            tooltip="Approve Application"
                                                            onClick={() => handleApprove(app.userId)}
                                                            variant="success"
                                                            disabled={processing}
                                                        />
                                                        <ActionButton
                                                            icon={<HiX className="w-4 h-4" />}
                                                            tooltip="Reject Application"
                                                            onClick={() => openReject(app)}
                                                            variant="danger"
                                                        />
                                                    </>
                                                )}
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
                    <div className="px-5 py-4 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                        <button
                            disabled={pageNumber === 1}
                            onClick={() => setPageNumber((p) => p - 1)}
                            className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <span className="text-sm text-neutral-500">
                            Page {pageNumber} of {totalPages}
                        </span>
                        <button
                            disabled={pageNumber === totalPages}
                            onClick={() => setPageNumber((p) => p + 1)}
                            className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 disabled:opacity-50"
                        >
                            Next
                        </button>
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
                                        {selectedApp.approvalStatus}
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
                                    <a href={selectedApp.portfolioUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-primary-600 hover:underline">
                                        {selectedApp.portfolioUrl} <HiExternalLink className="w-4 h-4" />
                                    </a>
                                </div>
                            )}

                            {selectedApp.rejectionReason && (
                                <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
                                    <p className="text-xs text-neutral-500 mb-1">Rejection Reason</p>
                                    <p className="text-sm text-red-600">{selectedApp.rejectionReason}</p>
                                </div>
                            )}
                        </div>

                        {selectedApp.approvalStatus === "Pending" && (
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
        </div>
    );
}
