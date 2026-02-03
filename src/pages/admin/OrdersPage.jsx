// src/pages/admin/OrdersPage.jsx
import React, { useEffect, useState } from "react";
import { HiEye, HiRefresh, HiChevronDown, HiChevronUp, HiX } from "react-icons/hi";
import adminApi from "../../api/adminApi";
import ActionButton from "../../components/admin/ActionButton";

const STATUS_OPTIONS = [
    { value: "all", label: "All Status" },
    { value: "Pending", label: "Pending" },
    { value: "Accepted", label: "Accepted" },
    { value: "InProgress", label: "In Progress" },
    { value: "Completed", label: "Completed" },
    { value: "Cancelled", label: "Cancelled" },
    { value: "Disputed", label: "Disputed" },
];

export default function OrdersPage() {
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [pageNumber, setPageNumber] = useState(1);
    const [pageSize] = useState(10);
    const [status, setStatus] = useState("all");
    const [keyword, setKeyword] = useState("");
    const [apiError, setApiError] = useState("");

    const [selectedOrder, setSelectedOrder] = useState(null);
    const [detailOpen, setDetailOpen] = useState(false);

    const fetchOrders = async () => {
        setLoading(true);
        setApiError("");
        try {
            const res = await adminApi.getOrders({ pageNumber, pageSize, status, keyword });
            const data = res?.data?.data ?? res?.data;
            setOrders(data?.items ?? []);
            setTotalCount(data?.totalCount ?? 0);
        } catch (err) {
            setApiError(err?.response?.data?.message || "Failed to load orders");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [pageNumber, status]);

    const handleSearch = () => {
        setPageNumber(1);
        fetchOrders();
    };

    const openDetail = async (order) => {
        setSelectedOrder(order);
        setDetailOpen(true);
    };

    const getStatusColor = (s) => {
        const colors = {
            Pending: "text-amber-600 bg-amber-50 dark:bg-amber-900/20",
            Accepted: "text-blue-600 bg-blue-50 dark:bg-blue-900/20",
            InProgress: "text-purple-600 bg-purple-50 dark:bg-purple-900/20",
            Completed: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20",
            Cancelled: "text-neutral-600 bg-neutral-100 dark:bg-neutral-800",
            Disputed: "text-red-600 bg-red-50 dark:bg-red-900/20",
        };
        return colors[s] || colors.Pending;
    };

    const formatCurrency = (amount) =>
        new Intl.NumberFormat("vi-VN").format(amount || 0) + "đ";

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
    const hasActiveFilters = keyword || status !== "all";

    return (
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white">Orders</h1>
                <p className="text-neutral-500 dark:text-neutral-400 text-sm">
                    Manage platform orders {totalCount > 0 && `(${totalCount} total)`}
                </p>
            </div>

            {/* Filters - Mobile Responsive */}
            <div className="p-3 sm:p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
                {/* Search + Toggle */}
                <div className="flex items-center gap-2 sm:gap-3">
                    <input
                        type="text"
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                        placeholder="Search orders..."
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
                                onClick={() => { setKeyword(""); setStatus("all"); }}
                                className="text-sm text-blue-600 hover:underline whitespace-nowrap"
                            >
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
                    
                    <button onClick={fetchOrders} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors" title="Refresh">
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
                        {hasActiveFilters && (
                            <button
                                onClick={() => { setKeyword(""); setStatus("all"); setShowFilters(false); }}
                                className="flex items-center gap-1 text-sm text-blue-600"
                            >
                                <HiX className="w-4 h-4" /> Clear all filters
                            </button>
                        )}
                    </div>
                )}
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
                                <th className="px-6 py-4">Student</th>
                                <th className="px-6 py-4">Mentor</th>
                                <th className="px-6 py-4">Price</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Created</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-5 py-10 text-center text-neutral-500">Loading...</td>
                                </tr>
                            ) : orders.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-5 py-10 text-center text-neutral-500">No orders found</td>
                                </tr>
                            ) : (
                                orders.map((order) => (
                                    <tr key={order.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                                        <td className="px-6 py-4 text-sm font-mono text-neutral-600 dark:text-neutral-300">
                                            #{order.id}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-neutral-900 dark:text-white">
                                                {order.studentName || "—"}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-neutral-900 dark:text-white">
                                                {order.mentorName || "—"}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-semibold text-neutral-900 dark:text-white">
                                            {formatCurrency(order.totalPrice || order.agreedPrice)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-neutral-500">
                                            {formatDate(order.createdAt)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-1">
                                                <ActionButton
                                                    icon={<HiEye className="w-4 h-4" />}
                                                    tooltip="View Detail"
                                                    onClick={() => openDetail(order)}
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

            {/* Detail Modal */}
            {detailOpen && selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
                    <div className="w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="px-4 sm:px-5 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                            <h3 className="font-bold text-neutral-900 dark:text-white">
                                Order #{selectedOrder.id}
                            </h3>
                            <button
                                onClick={() => setDetailOpen(false)}
                                className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="p-4 sm:p-5 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-neutral-500">Student</p>
                                    <p className="font-medium text-neutral-900 dark:text-white">{selectedOrder.studentName}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-neutral-500">Mentor</p>
                                    <p className="font-medium text-neutral-900 dark:text-white">{selectedOrder.mentorName}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-neutral-500">Total Price</p>
                                    <p className="font-medium text-neutral-900 dark:text-white">{formatCurrency(selectedOrder.totalPrice)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-neutral-500">Status</p>
                                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedOrder.status)}`}>
                                        {selectedOrder.status}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-xs text-neutral-500">Billing Type</p>
                                    <p className="font-medium text-neutral-900 dark:text-white">{selectedOrder.billingType || "—"}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-neutral-500">Created At</p>
                                    <p className="font-medium text-neutral-900 dark:text-white">{formatDate(selectedOrder.createdAt)}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
