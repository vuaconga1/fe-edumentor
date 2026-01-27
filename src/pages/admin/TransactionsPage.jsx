import React, { useEffect, useMemo, useState, useCallback } from "react";
import { HiEye, HiFilter, HiCheck, HiX, HiRefresh } from "react-icons/hi";
import DataTable from "../../components/admin/DataTable";
import Modal from "../../components/admin/Modal";
import ActionButton from "../../components/admin/ActionButton";
import adminApi from "../../api/adminApi";
const TransactionsPage = () => {
  // ===== DATA FROM API =====
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ===== UI STATE =====
  const [selectedTx, setSelectedTx] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");

  // ===== VERIFY MODAL =====
  const [isVerifyOpen, setIsVerifyOpen] = useState(false);
  const [verifyApprove, setVerifyApprove] = useState(true);
  const [verifyNote, setVerifyNote] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);

  // ===== PAGINATION (basic) =====
  const [pageNumber] = useState(1);
  const [pageSize] = useState(50);

  // ===== FETCH LIST =====
  useEffect(() => {
    let mounted = true;

    async function fetchTransactions() {
      try {
        setLoading(true);
        setError("");

        const res = await adminApi.getTransactions({
          pageNumber,
          pageSize,
          status: filterStatus, // BE: if supports
          type: filterType, // BE: if supports
        });

        const raw = res?.data;
        const data = raw?.data ?? raw;

        // parse flexible pagination shapes
        const list = Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data?.transactions)
          ? data.transactions
          : Array.isArray(data)
          ? data
          : [];

        if (mounted) setTransactions(list);
      } catch (err) {
        console.log("Failed to fetch transactions", err);
        if (mounted) {
          setTransactions([]);
          setError(err?.response?.data?.message || "Cannot load transactions");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchTransactions();
    return () => {
      mounted = false;
    };
  }, [pageNumber, pageSize, filterStatus, filterType]);

  // Debounce searchKeyword
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedKeyword(searchKeyword), 400);
    return () => clearTimeout(handler);
  }, [searchKeyword]);

  // ===== FILTER (client fallback, in case BE doesn't filter) =====
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (filterType !== "all" && String(tx.type).toLowerCase() !== filterType)
        return false;
      if (
        filterStatus !== "all" &&
        String(tx.status).toLowerCase() !== filterStatus
      )
        return false;
      // Search filter
      if (debouncedKeyword) {
        const keyword = debouncedKeyword.toLowerCase();
        const userName = String(tx.userName || "").toLowerCase();
        const txId = String(tx.id || "").toLowerCase();
        if (!userName.includes(keyword) && !txId.includes(keyword)) return false;
      }
      return true;
    });
  }, [transactions, filterType, filterStatus, debouncedKeyword]);

  const handleView = (tx) => {
    setSelectedTx(tx);
    setIsDetailOpen(true);
  };

  const formatCurrency = (amount) => {
    const num = Number(amount) || 0;
    return new Intl.NumberFormat("vi-VN").format(num) + "đ";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status) => {
    const s = String(status || "").toLowerCase();
    const colors = {
      completed:
        "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400",
      pending:
        "text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400",
      failed: "text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400",
      rejected:
        "text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400",
      approved:
        "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400",
    };
    return colors[s] || colors.pending;
  };

  const getTypeColor = (type) => {
    const t = String(type || "").toLowerCase();
    const colors = {
      deposit: "text-emerald-600",
      withdraw: "text-red-600",
      payment: "text-blue-600",
      earning: "text-emerald-600",
      refund: "text-amber-600",
    };
    return colors[t] || "text-neutral-600";
  };

  const getTypeSign = (type) => {
    const t = String(type || "").toLowerCase();
    return ["withdraw", "payment"].includes(t) ? "-" : "+";
  };

  // ===== TOTALS (keep same UI blocks) =====
  const totalDeposits = useMemo(() => {
    return transactions
      .filter(
        (t) =>
          String(t.type).toLowerCase() === "deposit" &&
          String(t.status).toLowerCase() === "completed"
      )
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [transactions]);

  const totalWithdrawals = useMemo(() => {
    return transactions
      .filter(
        (t) =>
          String(t.type).toLowerCase() === "withdraw" &&
          String(t.status).toLowerCase() === "completed"
      )
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [transactions]);

  const pendingAmount = useMemo(() => {
    return transactions
      .filter((t) => String(t.status).toLowerCase() === "pending")
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [transactions]);

  // ===== VERIFY FLOW =====
  const openVerify = (tx, approveDefault = true) => {
    setSelectedTx(tx);
    setVerifyApprove(approveDefault);
    setVerifyNote("");
    setIsVerifyOpen(true);
  };

  const handleVerifySubmit = async () => {
    if (!selectedTx?.id) return;

    try {
      setVerifyLoading(true);

      const res = await adminApi.verifyTransaction(selectedTx.id, {
        approve: verifyApprove,
        note: verifyNote || null,
      });

      const msg = res?.data?.message || "Verify transaction successfully";

      // update local state (optimistic)
      setTransactions((prev) =>
        prev.map((t) => {
          if (t.id !== selectedTx.id) return t;

          // status mapping: approve -> completed, reject -> failed (tuỳ BE, nhưng UI có 3 trạng thái này)
          const nextStatus = verifyApprove ? "completed" : "failed";
          return { ...t, status: nextStatus, note: verifyNote || t.note };
        })
      );

      setIsVerifyOpen(false);
      alert(msg);
    } catch (err) {
      console.log("Verify transaction failed", err);
      alert(err?.response?.data?.message || "Verify failed");
    } finally {
      setVerifyLoading(false);
    }
  };

  const columns = [
    {
      key: "id",
      label: "Transaction ID",
      render: (value) => (
        <span className="font-mono text-sm text-neutral-900 dark:text-white">
          {value}
        </span>
      ),
    },
    {
      key: "userName",
      label: "User",
      render: (value) => (
        <span className="text-neutral-900 dark:text-white font-medium">
          {value}
        </span>
      ),
    },
    {
      key: "type",
      label: "Type",
      render: (value) => (
        <span className={`capitalize font-medium ${getTypeColor(value)}`}>
          {value}
        </span>
      ),
    },
    {
      key: "amount",
      label: "Amount",
      render: (value, row) => (
        <span className={`font-medium ${getTypeColor(row.type)}`}>
          {getTypeSign(row.type)}
          {formatCurrency(value)}
        </span>
      ),
    },
    {
      key: "method",
      label: "Method",
      render: (value) => (
        <span className="text-neutral-600 dark:text-neutral-300">{value}</span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (value) => (
        <span
          className={`inline-block px-2.5 py-1 text-xs font-medium rounded-full capitalize ${getStatusColor(
            value
          )}`}
        >
          {value}
        </span>
      ),
    },
    {
      key: "createdAt",
      label: "Date",
      render: (value) => (
        <span className="text-neutral-500 text-sm">{formatDate(value)}</span>
      ),
    },
    {
      key: "actions",
      label: "",
      sortable: false,
      render: (_, row) => {
        const status = String(row.status || "").toLowerCase();
        const isPending = status === "pending";

        return (
          <div className="flex items-center justify-end gap-1">
            <ActionButton
              icon={<HiEye className="w-4 h-4" />}
              tooltip="View Details"
              onClick={(e) => {
                e?.stopPropagation?.();
                handleView(row);
              }}
              variant="info"
            />

            {isPending ? (
              <>
                <ActionButton
                  icon={<HiCheck className="w-4 h-4" />}
                  tooltip="Approve Transaction"
                  onClick={(e) => {
                    e?.stopPropagation?.();
                    openVerify(row, true);
                  }}
                  variant="success"
                />
                <ActionButton
                  icon={<HiX className="w-4 h-4" />}
                  tooltip="Reject Transaction"
                  onClick={(e) => {
                    e?.stopPropagation?.();
                    openVerify(row, false);
                  }}
                  variant="danger"
                />
              </>
            ) : null}
          </div>
        );
      },
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
          Transactions
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 text-sm">
          Review and manage platform transactions
        </p>
      </div>

      {/* Stats (keep same blocks) */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
          <p className="text-sm text-neutral-500 mb-1">Total Deposits</p>
          <p className="text-2xl font-bold text-emerald-600">
            {formatCurrency(totalDeposits)}
          </p>
        </div>
        <div className="p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
          <p className="text-sm text-neutral-500 mb-1">Total Withdrawals</p>
          <p className="text-2xl font-bold text-red-600">
            {formatCurrency(totalWithdrawals)}
          </p>
        </div>
        <div className="p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
          <p className="text-sm text-neutral-500 mb-1">Pending Amount</p>
          <p className="text-2xl font-bold text-amber-600">
            {formatCurrency(pendingAmount)}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
        <HiFilter className="w-5 h-5 text-neutral-400" />
        <input
          type="text"
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          placeholder="Search by user or transaction ID..."
          className="px-3 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-blue-500 flex-1"
        />

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-blue-500"
        >
          <option value="all">All Types</option>
          <option value="deposit">Deposit</option>
          <option value="withdraw">Withdraw</option>
          <option value="payment">Payment</option>
          <option value="earning">Earning</option>
          <option value="refund">Refund</option>
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-blue-500"
        >
          <option value="all">All Status</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>

        {(filterType !== "all" || filterStatus !== "all" || searchKeyword) && (
          <button
            onClick={() => {
              setFilterType("all");
              setFilterStatus("all");
              setSearchKeyword("");
            }}
            className="text-sm text-blue-600 hover:underline whitespace-nowrap"
          >
            Clear filters
          </button>
        )}
        <button
          onClick={() => window.location.reload()}
          className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
          title="Refresh"
        >
          <HiRefresh className="w-5 h-5 text-neutral-500" />
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Table */}
      <DataTable
        columns={columns}
        data={loading ? [] : filteredTransactions}
        searchPlaceholder="Search transactions."
        emptyMessage={loading ? "Loading..." : "No transactions found"}
      />

      {/* Detail Modal */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title="Transaction Details"
      >
        {selectedTx && (
          <div className="space-y-4">
            <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl text-center">
              <p className="text-xs text-neutral-500 uppercase tracking-wide mb-1">
                Amount
              </p>
              <p className={`text-3xl font-bold ${getTypeColor(selectedTx.type)}`}>
                {getTypeSign(selectedTx.type)}
                {formatCurrency(selectedTx.amount)}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-neutral-500 uppercase tracking-wide mb-1">
                  Transaction ID
                </p>
                <p className="text-neutral-900 dark:text-white font-mono">
                  {selectedTx.id}
                </p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 uppercase tracking-wide mb-1">
                  Status
                </p>
                <span
                  className={`inline-block px-2.5 py-1 text-xs font-medium rounded-full capitalize ${getStatusColor(
                    selectedTx.status
                  )}`}
                >
                  {selectedTx.status}
                </span>
              </div>
              <div>
                <p className="text-xs text-neutral-500 uppercase tracking-wide mb-1">
                  Type
                </p>
                <p className="text-neutral-900 dark:text-white capitalize">
                  {selectedTx.type}
                </p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 uppercase tracking-wide mb-1">
                  Method
                </p>
                <p className="text-neutral-900 dark:text-white">
                  {selectedTx.method}
                </p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 uppercase tracking-wide mb-1">
                  User
                </p>
                <p className="text-neutral-900 dark:text-white">
                  {selectedTx.userName}
                </p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 uppercase tracking-wide mb-1">
                  Date
                </p>
                <p className="text-neutral-900 dark:text-white">
                  {formatDate(selectedTx.createdAt)}
                </p>
              </div>
            </div>

            {selectedTx.note && (
              <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl">
                <p className="text-xs text-neutral-500 uppercase tracking-wide mb-1">
                  Note
                </p>
                <p className="text-neutral-700 dark:text-neutral-300">
                  {selectedTx.note}
                </p>
              </div>
            )}

            {/* Quick verify actions in detail modal (optional) */}
            {String(selectedTx.status || "").toLowerCase() === "pending" && (
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setIsDetailOpen(false);
                    openVerify(selectedTx, true);
                  }}
                  className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition"
                >
                  Approve
                </button>
                <button
                  onClick={() => {
                    setIsDetailOpen(false);
                    openVerify(selectedTx, false);
                  }}
                  className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition"
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Verify Modal */}
      <Modal
        isOpen={isVerifyOpen}
        onClose={() => {
          if (!verifyLoading) setIsVerifyOpen(false);
        }}
        title="Verify Transaction"
      >
        {selectedTx && (
          <div className="space-y-4">
            <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl">
              <div className="flex items-center justify-between">
                <p className="text-xs text-neutral-500 uppercase tracking-wide">
                  Transaction ID
                </p>
                <p className="text-neutral-900 dark:text-white font-mono">
                  {selectedTx.id}
                </p>
              </div>

              <div className="mt-2 flex items-center justify-between">
                <p className="text-xs text-neutral-500 uppercase tracking-wide">
                  Amount
                </p>
                <p className={`font-semibold ${getTypeColor(selectedTx.type)}`}>
                  {getTypeSign(selectedTx.type)}
                  {formatCurrency(selectedTx.amount)}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setVerifyApprove(true)}
                disabled={verifyLoading}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
                  verifyApprove
                    ? "bg-emerald-600 text-white"
                    : "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200"
                }`}
              >
                Approve
              </button>
              <button
                type="button"
                onClick={() => setVerifyApprove(false)}
                disabled={verifyLoading}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
                  !verifyApprove
                    ? "bg-red-600 text-white"
                    : "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200"
                }`}
              >
                Reject
              </button>
            </div>

            <div>
              <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
                Note (optional)
              </label>
              <textarea
                rows={3}
                value={verifyNote}
                onChange={(e) => setVerifyNote(e.target.value)}
                disabled={verifyLoading}
                className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-none focus:border-blue-500"
                placeholder="Reason / note for this verification..."
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsVerifyOpen(false)}
                disabled={verifyLoading}
                className="flex-1 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleVerifySubmit}
                disabled={verifyLoading}
                className={`flex-1 py-2 rounded-lg text-white font-semibold transition ${
                  verifyApprove
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-red-600 hover:bg-red-700"
                } ${verifyLoading ? "opacity-60 cursor-not-allowed" : ""}`}
              >
                {verifyLoading ? "Processing..." : "Submit"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TransactionsPage;
