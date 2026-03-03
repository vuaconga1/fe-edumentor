import React from "react";
import { HiX, HiSearch } from "react-icons/hi";
import { getActionColor, getActionLabel, formatDateTime } from "../../../utils/applicationUtils";

export default function ApplicationHistoryModal({
    isOpen,
    onClose,
    historyLoading,
    historyTotalCount,
    filteredAndSortedHistoryData,
    historySearchQuery,
    setHistorySearchQuery,
    historyActionFilter,
    setHistoryActionFilter,
    historyPageSize,
    historyPageNumber,
    setHistoryPageNumber
}) {
    if (!isOpen) return null;

    const totalPages = Math.ceil(historyTotalCount / historyPageSize);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/40">
            <div className="w-full max-w-4xl bg-white dark:bg-neutral-900 rounded-xl sm:rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl max-h-[95vh] sm:max-h-[90vh] flex flex-col">
                <div className="px-3 sm:px-5 py-3 sm:py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm sm:text-base text-neutral-900 dark:text-white truncate">Application History Log</h3>
                        <p className="text-xs text-neutral-500 mt-0.5 hidden sm:block">
                            Audit trail of all mentor application actions
                        </p>
                    </div>
                    <button onClick={onClose} className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 flex-shrink-0">
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
                {totalPages > 1 && (
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
                            Page {historyPageNumber} of {totalPages}
                        </span>
                        <button
                            disabled={historyPageNumber >= totalPages}
                            onClick={() => setHistoryPageNumber((p) => p + 1)}
                            className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 disabled:opacity-50 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
