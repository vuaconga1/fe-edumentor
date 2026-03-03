// src/pages/admin/MentorApplicationsPage.jsx
import React, { useState } from "react";
import { HiX, HiEye, HiRefresh, HiClipboardList, HiChevronDown, HiChevronUp } from "react-icons/hi";
import ActionButton from "../../components/admin/ActionButton";
import { normalizeAvatarUrl, buildDefaultAvatarUrl } from "../../utils/avatar";

// Import hooks and components
import useMentorApplications from "../../hooks/useMentorApplications";
import useApplicationHistory from "../../hooks/useApplicationHistory";
import ApplicationDetailModal from "../../components/admin/mentor-applications/ApplicationDetailModal";
import ApplicationHistoryModal from "../../components/admin/mentor-applications/ApplicationHistoryModal";
import ApplicationRejectModal from "../../components/admin/mentor-applications/ApplicationRejectModal";
import { getStatusLabel, getStatusColor, formatDate } from "../../utils/applicationUtils";

const STATUS_OPTIONS = [
    { value: "all", label: "All Status" },
    { value: "Pending", label: "Pending" },
    { value: "Approved", label: "Approved" },
    { value: "Rejected", label: "Rejected" },
];

export default function MentorApplicationsPage() {
    // 1. Hook for Main Table Data
    const appData = useMentorApplications();

    // 2. Hook for History Log 
    const historyData = useApplicationHistory();

    const [showFilters, setShowFilters] = useState(false);
    const hasActiveFilters = appData.searchKeyword || appData.status !== "all";
    const totalPages = Math.ceil(appData.totalCount / appData.pageSize);

    return (
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white">Mentor Applications</h1>
                <p className="text-neutral-500 dark:text-neutral-400 text-sm">
                    Review mentor registration requests {appData.totalCount > 0 && `(${appData.totalCount} total)`}
                </p>
            </div>

            {/* Filters - Mobile Responsive */}
            <div className="p-3 sm:p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center gap-2 sm:gap-3">
                    <input
                        type="text"
                        value={appData.searchKeyword}
                        onChange={(e) => appData.setSearchKeyword(e.target.value)}
                        placeholder="Search applications..."
                        className="flex-1 min-w-0 px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />

                    {/* Desktop Filters */}
                    <div className="hidden lg:flex items-center gap-3">
                        <select
                            value={appData.status}
                            onChange={(e) => { appData.setStatus(e.target.value); appData.setPageNumber(1); }}
                            className="px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-blue-500"
                        >
                            {STATUS_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                        {hasActiveFilters && (
                            <button
                                onClick={() => { appData.setStatus("all"); appData.setSearchKeyword(""); appData.setPageNumber(1); }}
                                className="text-sm text-blue-600 hover:underline whitespace-nowrap"
                            >
                                Clear
                            </button>
                        )}
                        <button
                            onClick={historyData.openHistory}
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
                        onClick={appData.fetchApplications}
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
                                value={appData.status}
                                onChange={(e) => { appData.setStatus(e.target.value); appData.setPageNumber(1); }}
                                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-blue-500"
                            >
                                {STATUS_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={historyData.openHistory}
                                className="flex items-center gap-2 px-3 py-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors text-sm text-neutral-700 dark:text-neutral-300"
                            >
                                <HiClipboardList className="w-4 h-4" />
                                <span>View Log</span>
                            </button>
                            {hasActiveFilters && (
                                <button onClick={() => { appData.setStatus("all"); appData.setSearchKeyword(""); appData.setPageNumber(1); setShowFilters(false); }} className="flex items-center gap-1 text-sm text-blue-600">
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
                            {appData.loading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-10 text-center text-neutral-500">Loading...</td>
                                </tr>
                            ) : appData.filteredApplications.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-10 text-center text-neutral-500">No applications found</td>
                                </tr>
                            ) : (
                                appData.filteredApplications.map((app) => (
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
                                                    onClick={() => appData.openDetail(app)}
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
                            Page {appData.pageNumber} of {totalPages}
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                disabled={appData.pageNumber === 1}
                                onClick={() => appData.setPageNumber((p) => p - 1)}
                                className="px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-sm disabled:opacity-50 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                            >
                                Prev
                            </button>
                            <button
                                disabled={appData.pageNumber === totalPages}
                                onClick={() => appData.setPageNumber((p) => p + 1)}
                                className="px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-sm disabled:opacity-50 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Application Detail Modal JSX */}
            {appData.detailOpen && (
                <ApplicationDetailModal
                    app={appData.selectedApp}
                    onClose={() => appData.setDetailOpen(false)}
                    onReEvaluate={appData.handleReEvaluate}
                    reEvaluating={appData.reEvaluating}
                    processing={appData.processing}
                    onOpenReject={appData.openReject}
                    onApprove={appData.handleApprove}
                />
            )}

            {/* Application Reject Modal JSX */}
            <ApplicationRejectModal
                isOpen={appData.rejectOpen}
                app={appData.selectedApp}
                rejectReason={appData.rejectReason}
                setRejectReason={appData.setRejectReason}
                apiError={appData.apiError}
                processing={appData.processing}
                onReject={appData.handleReject}
                onClose={() => appData.setRejectOpen(false)}
            />

            {/* History Modal JSX */}
            <ApplicationHistoryModal
                isOpen={historyData.historyOpen}
                onClose={historyData.closeHistory}
                historyLoading={historyData.historyLoading}
                historyTotalCount={historyData.historyTotalCount}
                filteredAndSortedHistoryData={historyData.filteredAndSortedHistoryData}
                historySearchQuery={historyData.historySearchQuery}
                setHistorySearchQuery={historyData.setHistorySearchQuery}
                historyActionFilter={historyData.historyActionFilter}
                setHistoryActionFilter={historyData.setHistoryActionFilter}
                historyPageSize={historyData.historyPageSize}
                historyPageNumber={historyData.historyPageNumber}
                setHistoryPageNumber={historyData.setHistoryPageNumber}
            />
        </div>
    );
}
