import React, { useEffect, useMemo, useRef, useState } from "react";
import { HiChevronDown } from "react-icons/hi";
import { normalizeAvatarUrl, buildDefaultAvatarUrl } from "../../utils/avatar";

import OrderDetailModal from "../../components/order/OrderDetailModal";
import orderApi from "../../api/orderApi";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("vi-VN").format(Number(amount || 0));

const formatDate = (dateString) => {
  if (!dateString) return "-";
  const utc = dateString.endsWith('Z') ? dateString : dateString + 'Z';
  return new Date(utc).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const minutesToDuration = (mins) => {
  const m = Number(mins || 0);
  if (!m) return "-";
  const h = Math.floor(m / 60);
  const mm = m % 60;
  if (h && mm) return `${h}h ${mm}m`;
  if (h) return `${h}h`;
  return `${mm}m`;
};

const normalizeStatusKey = (statusDisplay) => {
  const s = String(statusDisplay || "").toLowerCase();
  if (s.includes("complete") || s.includes("done") || s.includes("finished"))
    return "completed";
  if (s.includes("cancel")) return "cancelled";
  if (s.includes("pending") || s.includes("await") || s.includes("new"))
    return "pending";
  return "pending";
};

const statusConfig = {
  all: { label: "All Orders" },
  completed: { label: "Completed" },
  pending: { label: "Pending" },
  cancelled: { label: "Cancelled" },
};

const getStatusStyle = (statusKey) => {
  switch (statusKey) {
    case "completed":
      return "text-green-600 dark:text-green-400";
    case "pending":
      return "text-amber-600 dark:text-amber-400";
    case "cancelled":
      return "text-neutral-500 dark:text-neutral-400";
    default:
      return "text-neutral-500";
  }
};

const getStatusLabel = (statusDisplay, statusKey) => {
  if (statusDisplay) return statusDisplay;
  switch (statusKey) {
    case "completed":
      return "Completed";
    case "pending":
      return "Pending";
    case "cancelled":
      return "Cancelled";
    default:
      return "Pending";
  }
};

const MentorOrdersPage = () => {
  const [filterStatus, setFilterStatus] = useState("all");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch orders for mentor
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        setLoadError("");

        // For mentor, use getMyOrdersMentor
        const res = await orderApi.getMyOrdersMentor({
          PageNumber: 1,
          PageSize: 100,
          SortBy: "CreatedAt",
          SortDescending: true,
        });

        const items = res?.data?.data?.items ?? [];
        const mapped = items.map((o) => {
          const statusDisplay = o.statusDisplay ?? "";
          const statusKey = normalizeStatusKey(statusDisplay);

          return {
            id: o.id,
            // For mentor view, show student info
            student: {
              id: o.studentId,
              name: o.studentName ?? "Student",
              avatar:
                normalizeAvatarUrl(o.studentAvatar) ||
                buildDefaultAvatarUrl({
                  id: o.studentId,
                  email: o.studentEmail,
                  fullName: o.studentName
                }),
            },

            service: o.requestTitle ?? "(No title)",
            date: o.startedAt ?? o.createdAt ?? null,
            duration: minutesToDuration(o.totalSessionMinutes),
            total: Number(o.totalPrice ?? o.agreedPrice ?? 0),

            statusKey,
            statusDisplay,

            hasEscrow: !!o.hasEscrow,
          };
        });

        if (mounted) setOrders(mapped);
      } catch (e) {
        console.log("Load orders failed:", e);
        if (mounted) setLoadError("Load orders failed. Check console/network.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredOrders = useMemo(() => {
    if (filterStatus === "all") return orders;
    return orders.filter((o) => o.statusKey === filterStatus);
  }, [orders, filterStatus]);

  const handleOpenDetail = async (order) => {
    setSelectedOrder(order);
    setIsDetailOpen(true);
  };

  const totalCompleted = useMemo(
    () => orders.filter((o) => o.statusKey === "completed").length,
    [orders]
  );
  const totalPending = useMemo(
    () => orders.filter((o) => o.statusKey === "pending").length,
    [orders]
  );
  const totalEarned = useMemo(() => {
    return orders.reduce(
      (sum, o) => sum + (o.statusKey === "completed" ? o.total : 0),
      0
    );
  }, [orders]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950">
      <div className="px-4 py-5 sm:px-6 sm:py-6 space-y-5">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-800 dark:text-white">
              Order History
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">
              View and manage your mentoring sessions
            </p>
          </div>

          {/* Dropdown Filter */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg text-sm font-medium text-gray-700 dark:text-neutral-300 hover:border-gray-300 dark:hover:border-neutral-700 transition-colors w-full sm:w-auto sm:min-w-[150px] justify-between"
            >
              <span>{statusConfig[filterStatus]?.label}</span>
              <HiChevronDown
                className={`w-4 h-4 text-gray-500 dark:text-neutral-400 transition-transform duration-200 ${
                  isDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 left-0 sm:left-auto top-full mt-1 sm:w-44 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg shadow-lg z-20 overflow-hidden">
                {Object.keys(statusConfig).map((key) => (
                  <button
                    key={key}
                    onClick={() => {
                      setFilterStatus(key);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                      filterStatus === key
                        ? "bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-white font-medium"
                        : "text-gray-600 dark:text-neutral-400 hover:bg-gray-50 dark:hover:bg-neutral-800"
                    }`}
                  >
                    {statusConfig[key].label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Loading / Error */}
        {loading && (
          <div className="bg-white dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-800 p-4 text-sm text-gray-500">
            Loading orders...
          </div>
        )}
        {!loading && loadError && (
          <div className="bg-white dark:bg-neutral-900 rounded-lg border border-red-200 dark:border-red-800 p-4 text-sm text-red-600">
            {loadError}
          </div>
        )}

        {/* Stats Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-800 p-3 sm:p-4">
            <p className="text-xs text-gray-500 mb-1">Total Orders</p>
            <p className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-white">
              {orders.length}
            </p>
          </div>
          <div className="bg-white dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-800 p-3 sm:p-4">
            <p className="text-xs text-gray-500 mb-1">Completed</p>
            <p className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-white">
              {totalCompleted}
            </p>
          </div>
          <div className="bg-white dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-800 p-3 sm:p-4">
            <p className="text-xs text-gray-500 mb-1">Pending</p>
            <p className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-white">
              {totalPending}
            </p>
          </div>
          <div className="bg-white dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-800 p-3 sm:p-4">
            <p className="text-xs text-gray-500 mb-1">Total Earned</p>
            <p className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-white">
              {formatCurrency(totalEarned)} VND
            </p>
          </div>
        </div>

        {/* Order List */}
        <div className="bg-white dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-800 overflow-hidden">
          {/* Table Header - Desktop */}
          <div className="hidden lg:grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50 dark:bg-neutral-800/50 border-b border-gray-200 dark:border-neutral-800 text-xs font-medium text-gray-500 uppercase tracking-wide">
            <div className="col-span-4">Student / Service</div>
            <div className="col-span-2">Date</div>
            <div className="col-span-2">Duration</div>
            <div className="col-span-2">Amount</div>
            <div className="col-span-2 text-right">Status</div>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-neutral-800">
            {!loading && filteredOrders.length > 0 ? (
              filteredOrders.map((order) => {
                return (
                  <div
                    key={order.id}
                    onClick={() => handleOpenDetail(order)}
                    className="p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-neutral-800/30 transition-colors cursor-pointer"
                  >
                    {/* Desktop Layout */}
                    <div className="hidden lg:grid grid-cols-12 gap-4 items-center">
                      {/* Student Info */}
                      <div className="col-span-4 flex items-center gap-3">
                        <img
                          src={order.student.avatar}
                          alt={order.student.name}
                          className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = buildDefaultAvatarUrl({
                              id: order.student.id,
                              fullName: order.student.name
                            });
                          }}
                        />
                        <div className="min-w-0">
                          <p className="font-medium text-gray-800 dark:text-white truncate text-sm">
                            {order.student.name}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {order.service}
                          </p>
                        </div>
                      </div>

                      {/* Date */}
                      <div className="col-span-2">
                        <span className="text-sm text-gray-600 dark:text-neutral-400">
                          {formatDate(order.date)}
                        </span>
                      </div>

                      {/* Duration */}
                      <div className="col-span-2">
                        <span className="text-sm text-gray-600 dark:text-neutral-400">
                          {order.duration}
                        </span>
                      </div>

                      {/* Amount */}
                      <div className="col-span-2">
                        <span className="text-sm font-medium text-gray-800 dark:text-white">
                          {formatCurrency(order.total)} VND
                        </span>
                      </div>

                      {/* Status */}
                      <div className="col-span-2 flex items-center justify-end">
                        <span className={`text-sm font-medium ${getStatusStyle(order.statusKey)}`}>
                          {getStatusLabel(order.statusDisplay, order.statusKey)}
                        </span>
                      </div>
                    </div>

                    {/* Mobile & Tablet Layout */}
                    <div className="lg:hidden space-y-3">
                      {/* Top row: Avatar + Info + Status */}
                      <div className="flex items-start gap-3">
                        <img
                          src={order.student.avatar}
                          alt={order.student.name}
                          className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = buildDefaultAvatarUrl({
                              id: order.student.id,
                              fullName: order.student.name
                            });
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-medium text-gray-800 dark:text-white text-sm truncate">
                                {order.student.name}
                              </p>
                              <p className="text-xs text-gray-500 truncate mt-0.5">
                                {order.service}
                              </p>
                            </div>
                            <span className={`text-xs font-medium whitespace-nowrap ${getStatusStyle(order.statusKey)}`}>
                              {getStatusLabel(order.statusDisplay, order.statusKey)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Bottom row: Details + Amount */}
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-500 space-x-2">
                          <span>{formatDate(order.date)}</span>
                          <span>•</span>
                          <span>{order.duration}</span>
                        </div>
                        <span className="text-sm font-medium text-gray-800 dark:text-white">
                          {formatCurrency(order.total)} VND
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : !loading ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <p className="text-gray-500 dark:text-neutral-400 mb-1 text-center">
                  No orders found
                </p>
                <p className="text-sm text-gray-400 text-center">
                  Try changing the filter to see other orders
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Order Detail Modal */}
      {isDetailOpen && selectedOrder && (
        <OrderDetailModal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          order={selectedOrder}
        />
      )}
    </div>
  );
};

export default MentorOrdersPage;
