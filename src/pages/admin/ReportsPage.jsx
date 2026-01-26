import React, { useEffect, useMemo, useState } from 'react';
import { HiEye, HiCheck, HiX, HiFilter } from 'react-icons/hi';
import DataTable from '../../components/admin/DataTable';
import Modal from '../../components/admin/Modal';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import adminApi from '../../api/adminApi';

const ReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedReport, setSelectedReport] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredReports = reports.filter(report => {
    if (filterType !== 'all' && report.type !== filterType) return false;
    if (filterStatus !== 'all' && report.status !== filterStatus) return false;
    return true;
  });
  useEffect(() => {
    async function fetchReports() {
      try {
        setIsLoading(true);
        setError("");

        const res = await adminApi.getReports({ pageNumber: 1, pageSize: 50, status: filterStatus });
        const data = res?.data?.data ?? res?.data;

        // backend thường trả { items: [...] }
        const list = Array.isArray(data?.items) ? data.items : (Array.isArray(data) ? data : []);
        setReports(list);
      } catch (err) {
        console.log("Failed to fetch reports", err);
        setError(err?.response?.data?.message || "Cannot load reports.");
        setReports([]);
      } finally {
        setIsLoading(false);
      }
    }

    // nếu muốn filter status gọi server luôn, để filterStatus vào deps
    fetchReports();
  }, [filterStatus]);
  const handleView = async (report) => {
    try {
      setIsDetailOpen(true);
      setSelectedReport(null); // show loading inside modal

      const res = await adminApi.getReportDetail(report.id);
      const data = res?.data?.data ?? res?.data;
      setSelectedReport(data);
    } catch (err) {
      console.log("Failed to fetch report detail", err);
      setSelectedReport(report); // fallback show row data
    }
  };

  const handleAction = (report, action) => {
    setSelectedReport(report);
    setConfirmAction(action);
    setIsConfirmOpen(true);
  };

  const confirmActionHandler = async () => {
    if (!selectedReport || !confirmAction) return;

    try {
      setIsConfirmOpen(false);

      if (confirmAction === "resolve") {
        // POST /api/Admin/reports/{id}/resolve (hoặc /resolve)
        await adminApi.resolveReport(selectedReport.id, "Resolved by admin");
      } else {
        // dismiss -> map thành reject
        await adminApi.rejectReport(selectedReport.id, "Rejected by admin");
      }

      // Update UI nhanh (optimistic)
      const newStatus = confirmAction === "resolve" ? "resolved" : "dismissed";
      setReports((prev) =>
        prev.map((r) => (r.id === selectedReport.id ? { ...r, status: newStatus } : r))
      );

      // Nếu detail đang mở, update luôn
      setSelectedReport((prev) => (prev?.id === selectedReport.id ? { ...prev, status: newStatus } : prev));
    } catch (err) {
      console.log("Handle report failed", err);
      alert(err?.response?.data?.message || "Action failed.");
    }
  };


  const getStatusColor = (status) => {
    const colors = {
      pending: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400',
      investigating: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400',
      resolved: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400',
      dismissed: 'text-neutral-600 bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-400'
    };
    return colors[status] || colors.pending;
  };

  const getTypeColor = (type) => {
    const colors = {
      user: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400',
      content: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400',
      review: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400',
      payment: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400'
    };
    return colors[type] || colors.user;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const columns = [
    {
      key: 'id',
      label: 'ID',
      render: (value) => <span className="text-neutral-500 font-mono text-xs">#{value}</span>
    },
    {
      key: 'type',
      label: 'Type',
      render: (value) => (
        <span className={`inline-block px-2.5 py-1 text-xs font-medium rounded-full capitalize ${getTypeColor(value)}`}>
          {value}
        </span>
      )
    },
    {
      key: 'reason',
      label: 'Reason',
      render: (value) => <span className="text-neutral-900 dark:text-white font-medium">{value}</span>
    },
    {
      key: 'reportedUser',
      label: 'Reported User',
      render: (value) => <span className="text-neutral-600 dark:text-neutral-300">{value}</span>
    },
    {
      key: 'reportedBy',
      label: 'Reported By',
      render: (value) => <span className="text-neutral-500">{value}</span>
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <span className={`inline-block px-2.5 py-1 text-xs font-medium rounded-full capitalize ${getStatusColor(value)}`}>
          {value}
        </span>
      )
    },
    {
      key: 'createdAt',
      label: 'Date',
      render: (value) => <span className="text-neutral-500 text-sm">{formatDate(value)}</span>
    },
    {
      key: 'actions',
      label: '',
      sortable: false,
      render: (_, row) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); handleView(row); }}
            className="p-2 rounded-lg text-neutral-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            title="View details"
          >
            <HiEye className="w-4 h-4" />
          </button>
          {row.status === 'pending' || row.status === 'investigating' ? (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); handleAction(row, 'resolve'); }}
                className="p-2 rounded-lg text-neutral-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                title="Resolve"
              >
                <HiCheck className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleAction(row, 'dismiss'); }}
                className="p-2 rounded-lg text-neutral-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                title="Dismiss"
              >
                <HiX className="w-4 h-4" />
              </button>
            </>
          ) : null}
        </div>
      )
    }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Reports</h1>
        <p className="text-neutral-500 dark:text-neutral-400 text-sm">Review and manage user reports</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {['pending', 'investigating', 'resolved', 'dismissed'].map(status => {
          const count = reports.filter(r => r.status === status).length;
          return (
            <div key={status} className="p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 text-center">
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">{count}</p>
              <p className="text-sm text-neutral-500 capitalize">{status}</p>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
        <HiFilter className="w-5 h-5 text-neutral-400" />
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-blue-500"
        >
          <option value="all">All Types</option>
          <option value="user">User</option>
          <option value="content">Content</option>
          <option value="review">Review</option>
          <option value="payment">Payment</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-blue-500"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="investigating">Investigating</option>
          <option value="resolved">Resolved</option>
          <option value="dismissed">Dismissed</option>
        </select>
        {(filterType !== 'all' || filterStatus !== 'all') && (
          <button
            onClick={() => { setFilterType('all'); setFilterStatus('all'); }}
            className="text-sm text-blue-600 hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={isLoading ? [] : filteredReports}
        searchPlaceholder="Search reports..."
        emptyMessage={isLoading ? "Loading..." : "No reports found"}
      />

      {error && (
        <div className="text-sm text-red-500">{error}</div>
      )}

      {/* Detail Modal */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title="Report Details"
        size="lg"
      >
        {selectedReport && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-neutral-500 uppercase tracking-wide mb-1">Report ID</p>
                <p className="text-neutral-900 dark:text-white font-mono">#{selectedReport.id}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 uppercase tracking-wide mb-1">Date</p>
                <p className="text-neutral-900 dark:text-white">{formatDate(selectedReport.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 uppercase tracking-wide mb-1">Type</p>
                <span className={`inline-block px-2.5 py-1 text-xs font-medium rounded-full capitalize ${getTypeColor(selectedReport.type)}`}>
                  {selectedReport.type}
                </span>
              </div>
              <div>
                <p className="text-xs text-neutral-500 uppercase tracking-wide mb-1">Status</p>
                <span className={`inline-block px-2.5 py-1 text-xs font-medium rounded-full capitalize ${getStatusColor(selectedReport.status)}`}>
                  {selectedReport.status}
                </span>
              </div>
            </div>

            <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl space-y-3">
              <div>
                <p className="text-xs text-neutral-500 uppercase tracking-wide mb-1">Reason</p>
                <p className="text-neutral-900 dark:text-white font-medium">{selectedReport.reason}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 uppercase tracking-wide mb-1">Description</p>
                <p className="text-neutral-700 dark:text-neutral-300">{selectedReport.description}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl">
              <div>
                <p className="text-xs text-neutral-500 uppercase tracking-wide mb-1">Reported User</p>
                <p className="text-neutral-900 dark:text-white font-medium">{selectedReport.reportedUser}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 uppercase tracking-wide mb-1">Reported By</p>
                <p className="text-neutral-900 dark:text-white">{selectedReport.reportedBy}</p>
              </div>
            </div>

            {(selectedReport.status === 'pending' || selectedReport.status === 'investigating') && (
              <div className="flex gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                <button
                  onClick={() => { setIsDetailOpen(false); handleAction(selectedReport, 'resolve'); }}
                  className="flex-1 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  Mark as Resolved
                </button>
                <button
                  onClick={() => { setIsDetailOpen(false); handleAction(selectedReport, 'dismiss'); }}
                  className="flex-1 py-2 text-sm font-medium bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 rounded-lg hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors"
                >
                  Dismiss Report
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Action Confirmation */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={confirmActionHandler}
        title={confirmAction === 'resolve' ? 'Resolve Report' : 'Dismiss Report'}
        message={
          confirmAction === 'resolve'
            ? 'Are you sure you want to mark this report as resolved?'
            : 'Are you sure you want to dismiss this report?'
        }
        confirmText={confirmAction === 'resolve' ? 'Resolve' : 'Dismiss'}
        danger={confirmAction === 'dismiss'}
      />
    </div>
  );
};

export default ReportsPage;
