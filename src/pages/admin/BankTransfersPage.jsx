import React, { useEffect, useState, useCallback } from "react";
import { HiCheck, HiX, HiRefresh, HiEye } from "react-icons/hi";
import walletApi from "../../api/walletApi";
import ConfirmDialog from "../../components/admin/ConfirmDialog";
import Modal from "../../components/admin/Modal";

const BankTransfersPage = () => {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState("");

  // Pagination
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize] = useState(10);

  // Confirm dialog
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // { type: 'confirm'|'reject', ref: string }

  // Detail modal
  const [selectedTx, setSelectedTx] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const fetchTransfers = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await walletApi.getPendingBankTransfers({ pageNumber: 1, pageSize: 200 });
      const data = res?.data?.data;
      const list = data?.items ?? data ?? [];
      setTransfers(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Failed to fetch pending transfers", err);
      setError(err?.response?.data?.message || "Cannot load pending transfers");
      setTransfers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransfers();
  }, [fetchTransfers]);

  const handleConfirm = async (transactionRef) => {
    try {
      setActionLoading(transactionRef);
      await walletApi.confirmBankTransfer(transactionRef);
      setTransfers((prev) => prev.filter((t) => t.externalRef !== transactionRef));
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to confirm transfer");
    } finally {
      setActionLoading("");
    }
  };

  const handleReject = async (transactionRef) => {
    try {
      setActionLoading(transactionRef);
      await walletApi.rejectBankTransfer(transactionRef);
      setTransfers((prev) => prev.filter((t) => t.externalRef !== transactionRef));
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to reject transfer");
    } finally {
      setActionLoading("");
    }
  };

  const openConfirm = (type, ref) => {
    setConfirmAction({ type, ref });
    setConfirmOpen(true);
  };

  const executeConfirm = () => {
    if (!confirmAction) return;
    if (confirmAction.type === "confirm") handleConfirm(confirmAction.ref);
    else handleReject(confirmAction.ref);
    setConfirmAction(null);
  };

  const formatCurrency = (val) =>
    new Intl.NumberFormat("vi-VN").format(val) + " VND";

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const utc = dateStr.endsWith?.('Z') ? dateStr : dateStr + 'Z';
    const d = new Date(utc);
    return d.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const totalPages = Math.ceil(transfers.length / pageSize);
  const paginatedTransfers = transfers.slice((pageNumber - 1) * pageSize, pageNumber * pageSize);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
            Bank Transfer Deposits
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Review and confirm pending bank transfer deposits (VietQR)
          </p>
        </div>
        <button
          onClick={fetchTransfers}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
        >
          <HiRefresh className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Pending Transfers</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{transfers.length}</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Total Amount</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {formatCurrency(transfers.reduce((sum, t) => sum + (t.amount || 0), 0))}
          </p>
        </div>
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Oldest Pending</p>
          <p className="text-lg font-semibold text-neutral-700 dark:text-neutral-300 mt-1">
            {transfers.length > 0 ? formatDate(transfers[transfers.length - 1]?.createdAt) : "—"}
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : transfers.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-lg font-medium text-neutral-700 dark:text-neutral-300">
              No pending transfers
            </p>
            <p className="text-sm text-neutral-500 mt-1">
              All bank transfer deposits have been processed.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
                  <th className="px-6 py-3.5 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    Reference
                  </th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    Transfer Code
                  </th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider text-center">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {paginatedTransfers.map((tx) => (
                  <tr
                    key={tx.id}
                    className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span className="text-sm font-mono font-medium text-neutral-900 dark:text-white">
                        {tx.externalRef}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-neutral-700 dark:text-neutral-300">
                        {tx.orderTitle || `Wallet #${tx.walletId}`}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-emerald-600">
                        +{formatCurrency(tx.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <code className="px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-mono">
                        MENTOREDU {tx.externalRef}
                      </code>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-neutral-500">
                        {formatDate(tx.createdAt)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => { setSelectedTx(tx); setDetailOpen(true); }}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-medium rounded-full hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors cursor-pointer"
                        title="Click to view details"
                      >
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                        Pending
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-4 sm:px-5 py-3 sm:py-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-sm text-neutral-500 text-center sm:text-left">
            Page {pageNumber} of {totalPages} ({transfers.length} transfers)
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

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => { setConfirmOpen(false); setConfirmAction(null); }}
        onConfirm={executeConfirm}
        title={confirmAction?.type === "confirm" ? "Confirm Bank Transfer" : "Reject Bank Transfer"}
        message={
          confirmAction?.type === "confirm"
            ? `Are you sure you've received the bank transfer for "${confirmAction?.ref}"? This will credit the user's wallet.`
            : `Reject transfer "${confirmAction?.ref}"? The deposit will be cancelled.`
        }
        confirmText={confirmAction?.type === "confirm" ? "Yes, Confirm" : "Yes, Reject"}
        danger={confirmAction?.type === "reject"}
      />

      {/* Detail Modal */}
      <Modal
        isOpen={detailOpen}
        onClose={() => { setDetailOpen(false); setSelectedTx(null); }}
        title="Transfer Details"
      >
        {selectedTx && (
          <div className="space-y-4 p-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-neutral-500 mb-1">Transaction ID</p>
                <p className="text-sm font-medium text-neutral-900 dark:text-white">{selectedTx.id}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 mb-1">Reference</p>
                <p className="text-sm font-mono font-medium text-neutral-900 dark:text-white">{selectedTx.externalRef}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 mb-1">User</p>
                <p className="text-sm font-medium text-neutral-900 dark:text-white">{selectedTx.orderTitle || `Wallet #${selectedTx.walletId}`}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 mb-1">Amount</p>
                <p className="text-sm font-bold text-emerald-600">+{formatCurrency(selectedTx.amount)}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 mb-1">Status</p>
                <span className="inline-flex px-2.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-medium rounded-full">
                  Pending
                </span>
              </div>
              <div>
                <p className="text-xs text-neutral-500 mb-1">Created At</p>
                <p className="text-sm text-neutral-700 dark:text-neutral-300">{formatDate(selectedTx.createdAt)}</p>
              </div>
            </div>

            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">
                Expected Transfer Description
              </p>
              <code className="text-sm font-mono font-bold text-blue-800 dark:text-blue-200">
                MENTOREDU {selectedTx.externalRef}
              </code>
              <p className="text-xs text-blue-500 mt-2">
                Check your bank account statement for a transfer matching this description and amount.
              </p>
            </div>

            <div className="mt-4">
              <p className="text-xs text-neutral-500 mb-1">Description</p>
              <p className="text-sm text-neutral-700 dark:text-neutral-300">{selectedTx.description}</p>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t border-neutral-200 dark:border-neutral-700">
              <button
                onClick={() => { setDetailOpen(false); openConfirm("confirm", selectedTx.externalRef); }}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <HiCheck className="w-4 h-4" /> Confirm Transfer
              </button>
              <button
                onClick={() => { setDetailOpen(false); openConfirm("reject", selectedTx.externalRef); }}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <HiX className="w-4 h-4" /> Reject
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default BankTransfersPage;
