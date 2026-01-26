import React, { useEffect, useMemo, useRef, useState } from "react";
import { HiChevronDown } from "react-icons/hi";

import OrderDetailModal from "../../components/order/OrderDetailModal";
import ReviewModal from "../../components/order/ReviewModal";
import orderApi from "../../api/orderApi";

// --- helpers ---
const normalizeAvatar = (url) => {
  if (!url) return "/avatar-default.jpg";
  if (url.startsWith("http")) return url;

  const base = import.meta.env.VITE_API_BASE_URL; // baseURL giống axios.js
  if (!base) return url.startsWith("/") ? url : `/${url}`;
  const cleaned = url.startsWith("/") ? url : `/${url}`;
  return `${base}${cleaned}`;
};

const formatCurrency = (amount) =>
  new Intl.NumberFormat("vi-VN").format(Number(amount || 0));

const formatDate = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("en-GB", {
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

// statusDisplay từ backend có thể là "Completed", "Cancelled", ...
// Tao normalize về 3 loại để filter + màu
const normalizeStatusKey = (statusDisplay) => {
  const s = String(statusDisplay || "").toLowerCase();
  if (s.includes("complete") || s.includes("done") || s.includes("finished"))
    return "completed";
  if (s.includes("cancel")) return "cancelled";
  if (s.includes("pending") || s.includes("await") || s.includes("new"))
    return "pending";
  // fallback
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
  // ưu tiên label từ backend nếu có
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

const OrderHistoryPage = () => {
  const [filterStatus, setFilterStatus] = useState("all");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);

  // local “reviewed” state (vì list dto không có isReviewed)
  const [reviewedOrderIds, setReviewedOrderIds] = useState(() => new Set());

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

  // Fetch real orders
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        setLoadError("");

        // lấy nhiều chút cho khỏi paginate (tùy backend default)
        const res = await orderApi.getMyOrdersStudent({
          PageNumber: 1,
          PageSize: 100,
          SortBy: "CreatedAt",
          SortDescending: true,
        });

        const items = res?.data?.data?.items ?? [];
        // Map OrderListDto -> UI model
        const mapped = items.map((o) => {
          const statusDisplay = o.statusDisplay ?? "";
          const statusKey = normalizeStatusKey(statusDisplay);

          return {
            id: o.id,
            // UI đang dùng mentor: {name, avatar}
            mentor: {
              id: o.mentorId,
              name: o.mentorName ?? "Mentor",
              avatar: normalizeAvatar(o.mentorAvatar),
            },

            // UI đang dùng "service"
            service: o.requestTitle ?? "(No title)",

            // UI đang dùng date
            date: o.startedAt ?? o.createdAt ?? null,

            // UI đang dùng duration
            duration: minutesToDuration(o.totalSessionMinutes),

            // UI đang dùng total
            total: Number(o.totalPrice ?? o.agreedPrice ?? 0),

            // status
            statusKey, // completed/pending/cancelled
            statusDisplay, // text từ backend

            // escrow info nếu cần
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
    // Nếu modal của mày cần nhiều field hơn, có thể fetch detail ở đây:
    // const detail = await orderApi.getOrderDetail(order.id);
    // rồi setSelectedOrder(detail.data.data)
    setSelectedOrder(order);
    setIsDetailOpen(true);
  };

  const handleOpenReview = (order) => {
    setSelectedOrder(order);
    setIsReviewOpen(true);
  };

  const handleSubmitReview = async (reviewData) => {
    // reviewData từ ReviewModal thường kiểu { rating, comment }
    if (!selectedOrder?.id) return;

    try {
      await orderApi.createReview(selectedOrder.id, {
        rating: Number(reviewData?.rating ?? 0),
        comment: reviewData?.comment ?? null,
      });

      setReviewedOrderIds((prev) => {
        const next = new Set(prev);
        next.add(selectedOrder.id);
        return next;
      });

      setIsReviewOpen(false);
    } catch (e) {
      console.log("Submit review failed:", e);
      alert(
        "Submit review failed. (Có thể order đã review rồi hoặc backend validate lỗi). Check console/network."
      );
    }
  };

  const totalCompleted = useMemo(
    () => orders.filter((o) => o.statusKey === "completed").length,
    [orders]
  );
  const totalPending = useMemo(
    () => orders.filter((o) => o.statusKey === "pending").length,
    [orders]
  );
  const totalSpent = useMemo(() => {
    return orders.reduce(
      (sum, o) => sum + (o.statusKey === "completed" ? o.total : 0),
      0
    );
  }, [orders]);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-4 md:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
              Order History
            </h1>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">
              View and manage your mentoring sessions
            </p>
          </div>

          {/* Dropdown Filter */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors min-w-[160px] justify-between"
            >
              <span>{statusConfig[filterStatus]?.label}</span>
              <HiChevronDown
                className={`w-4 h-4 text-neutral-400 transition-transform ${
                  isDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-lg z-20 overflow-hidden">
                {Object.keys(statusConfig).map((key) => (
                  <button
                    key={key}
                    onClick={() => {
                      setFilterStatus(key);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                      filterStatus === key
                        ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white font-medium"
                        : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800"
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
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 text-sm text-neutral-500">
            Loading orders...
          </div>
        )}
        {!loading && loadError && (
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-red-200 dark:border-red-800 p-4 text-sm text-red-600">
            {loadError}
          </div>
        )}

        {/* Stats Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
            <p className="text-xs text-neutral-500 mb-1">Total Orders</p>
            <p className="text-xl font-bold text-neutral-900 dark:text-white">
              {orders.length}
            </p>
          </div>
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
            <p className="text-xs text-neutral-500 mb-1">Completed</p>
            <p className="text-xl font-bold text-neutral-900 dark:text-white">
              {totalCompleted}
            </p>
          </div>
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
            <p className="text-xs text-neutral-500 mb-1">Pending</p>
            <p className="text-xl font-bold text-neutral-900 dark:text-white">
              {totalPending}
            </p>
          </div>
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
            <p className="text-xs text-neutral-500 mb-1">Total Spent</p>
            <p className="text-xl font-bold text-neutral-900 dark:text-white">
              {formatCurrency(totalSpent)}đ
            </p>
          </div>
        </div>

        {/* Order List */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
          {/* Table Header - Desktop */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-800 text-xs font-medium text-neutral-500 uppercase tracking-wide">
            <div className="col-span-4">Mentor / Service</div>
            <div className="col-span-2">Date</div>
            <div className="col-span-2">Duration</div>
            <div className="col-span-2">Amount</div>
            <div className="col-span-2 text-right">Status</div>
          </div>

          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {!loading && filteredOrders.length > 0 ? (
              filteredOrders.map((order) => {
                const isReviewed = reviewedOrderIds.has(order.id);

                return (
                  <div
                    key={order.id}
                    onClick={() => handleOpenDetail(order)}
                    className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 p-4 md:px-5 md:py-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors cursor-pointer group"
                  >
                    {/* Mentor Info */}
                    <div className="col-span-4 flex items-center gap-3">
                      <img
                        src={order.mentor.avatar}
                        alt={order.mentor.name}
                        className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="font-medium text-neutral-900 dark:text-white truncate text-sm">
                          {order.mentor.name}
                        </p>
                        <p className="text-xs text-neutral-500 truncate">
                          {order.service}
                        </p>
                      </div>
                    </div>

                    {/* Date */}
                    <div className="col-span-2 flex items-center">
                      <span className="text-sm text-neutral-600 dark:text-neutral-400">
                        {formatDate(order.date)}
                      </span>
                    </div>

                    {/* Duration */}
                    <div className="col-span-2 flex items-center">
                      <span className="text-sm text-neutral-600 dark:text-neutral-400">
                        {order.duration}
                      </span>
                    </div>

                    {/* Amount */}
                    <div className="col-span-2 flex items-center">
                      <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                        {formatCurrency(order.total)}đ
                      </span>
                    </div>

                    {/* Status & Actions */}
                    <div className="col-span-2 flex items-center justify-between md:justify-end gap-3">
                      <span
                        className={`text-sm font-medium ${getStatusStyle(
                          order.statusKey
                        )}`}
                      >
                        {getStatusLabel(order.statusDisplay, order.statusKey)}
                      </span>

                      {order.statusKey === "completed" && !isReviewed && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenReview(order);
                          }}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
                        >
                          Review
                        </button>
                      )}

                      {order.statusKey === "completed" && isReviewed && (
                        <span className="text-xs text-neutral-400">Reviewed</span>
                      )}
                    </div>

                    {/* Mobile row */}
                    <div className="md:hidden col-span-1 flex items-center justify-between text-xs text-neutral-500 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                      <span>
                        {formatDate(order.date)} • {order.duration}
                      </span>
                      <span className="font-semibold text-neutral-900 dark:text-white">
                        {formatCurrency(order.total)}đ
                      </span>
                    </div>
                  </div>
                );
              })
            ) : !loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <p className="text-neutral-500 dark:text-neutral-400 mb-1">
                  No orders found
                </p>
                <p className="text-sm text-neutral-400">
                  Try changing the filter to see other orders
                </p>
              </div>
            ) : null}
          </div>
        </div>

        <OrderDetailModal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          order={selectedOrder}
        />

        <ReviewModal
          isOpen={isReviewOpen}
          onClose={() => setIsReviewOpen(false)}
          order={selectedOrder}
          onSubmit={handleSubmitReview}
        />
      </div>
    </div>
  );
};

export default OrderHistoryPage;
