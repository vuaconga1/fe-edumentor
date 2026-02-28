import React, { useEffect, useMemo, useState } from 'react';
import { HiEye, HiCheck, HiX, HiChevronDown, HiChevronUp, HiRefresh } from 'react-icons/hi';
import DataTable from '../../components/admin/DataTable';
import Modal from '../../components/admin/Modal';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import ActionButton from '../../components/admin/ActionButton';
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
  const [searchKeyword, setSearchKeyword] = useState('');

  // Pagination
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize] = useState(10);

  const filteredReports = reports.filter(report => {
    if (filterType !== 'all' && report.reason !== filterType) return false;
    if (filterStatus !== 'all' && report.status !== filterStatus) return false;
    
    // Search filter
    if (searchKeyword.trim()) {
      const keyword = searchKeyword.toLowerCase();
      const matchReason = (report.reason || '').toLowerCase().includes(keyword);
      const matchDetails = (report.details || '').toLowerCase().includes(keyword);
      const matchReportedUser = (report.reportedUserName || '').toLowerCase().includes(keyword);
      const matchReporter = (report.reporterName || '').toLowerCase().includes(keyword);
      if (!matchReason && !matchDetails && !matchReportedUser && !matchReporter) return false;
    }
    
    return true;
  });
  useEffect(() => {
    async function fetchReports() {
      try {
        setIsLoading(true);
        setError("");

        const res = await adminApi.getReports({ pageNumber: 1, pageSize: 200, status: filterStatus });
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

  const totalPages = Math.ceil(filteredReports.length / pageSize);
  const paginatedReports = filteredReports.slice((pageNumber - 1) * pageSize, pageNumber * pageSize);

  // Reset page on filter changes
  useEffect(() => {
    setPageNumber(1);
  }, [filterStatus, filterType, searchKeyword]);

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

  // Direct action from detail modal (no double modal)
  const handleDirectAction = async (action) => {
    if (!selectedReport) return;
    try {
      const status = action === "resolve" ? "Resolved" : "Dismissed";
      await adminApi.handleReport(selectedReport.id, { status, banUser: false });
      const newStatus = action === "resolve" ? "resolved" : "dismissed";
      setReports((prev) =>
        prev.map((r) => (r.id === selectedReport.id ? { ...r, status: newStatus } : r))
      );
      setSelectedReport((prev) => (prev?.id === selectedReport.id ? { ...prev, status: newStatus } : prev));
      setIsDetailOpen(false);
    } catch (err) {
      console.log("Handle report failed", err);
      alert(err?.response?.data?.message || "Action failed.");
    }
  };

  const confirmActionHandler = async () => {
    if (!selectedReport || !confirmAction) return;

    try {
      setIsConfirmOpen(false);

      // Backend sử dụng handleReport endpoint
      const status = confirmAction === "resolve" ? "Resolved" : "Dismissed";
      await adminApi.handleReport(selectedReport.id, { status, banUser: false });

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

  // Refetch reports data
  const refetchReports = async () => {
    try {
      setIsLoading(true);
      setError("");
      const res = await adminApi.getReports({ pageNumber: 1, pageSize: 200, status: filterStatus });
      const data = res?.data?.data ?? res?.data;
      const list = Array.isArray(data?.items) ? data.items : (Array.isArray(data) ? data : []);
      setReports(list);
    } catch (err) {
      console.log("Failed to fetch reports", err);
      setError(err?.response?.data?.message || "Cannot load reports.");
    } finally {
      setIsLoading(false);
    }
  };

  // Report Filters Component (inline)
  const ReportFilters = ({ searchKeyword, setSearchKeyword, filterType, setFilterType, filterStatus, setFilterStatus }) => {
    const [showFilters, setShowFilters] = useState(false);
    const hasActiveFilters = filterType !== "all" || filterStatus !== "all" || searchKeyword.trim();

    return (
      <div className="p-3 sm:p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
        {/* Search + Toggle */}
        <div className="flex items-center gap-2 sm:gap-3">
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="Search reports..."
            className="flex-1 min-w-0 px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-blue-500"
          />
          
          {/* Desktop Filters */}
          <div className="hidden lg:flex items-center gap-3">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Types</option>
              <option value="spam">Spam</option>
              <option value="inappropriate">Inappropriate</option>
              <option value="fake">Fake</option>
              <option value="privacy">Privacy</option>
              <option value="other">Other</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="Open">Open</option>
              <option value="Resolved">Resolved</option>
              <option value="Dismissed">Dismissed</option>
            </select>
            {hasActiveFilters && (
              <button
                onClick={() => { setFilterType("all"); setFilterStatus("all"); setSearchKeyword(""); }}
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
          
          <button
            onClick={refetchReports}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
            title="Refresh"
          >
            <HiRefresh className="w-5 h-5 text-neutral-500" />
          </button>
        </div>
        
        {/* Mobile Filters Dropdown */}
        {showFilters && (
          <div className="lg:hidden mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-700 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Types</option>
                <option value="spam">Spam</option>
                <option value="inappropriate">Inappropriate</option>
                <option value="fake">Fake</option>
                <option value="privacy">Privacy</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="Open">Open</option>
                <option value="Resolved">Resolved</option>
                <option value="Dismissed">Dismissed</option>
              </select>
            </div>
            {hasActiveFilters && (
              <button
                onClick={() => { setFilterType("all"); setFilterStatus("all"); setSearchKeyword(""); setShowFilters(false); }}
                className="sm:col-span-2 flex items-center justify-center gap-1 text-sm text-blue-600"
              >
                <HiX className="w-4 h-4" /> Clear all filters
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  const getStatusColor = (status) => {
    const s = (status || '').toLowerCase();
    const colors = {
      pending: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400',
      open: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400',
      investigating: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400',
      resolved: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400',
      dismissed: 'text-neutral-600 bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-400'
    };
    return colors[s] || colors.pending;
  };

  const getTypeColor = (type) => {
    const colors = {
      spam: 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400',
      inappropriate: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400',
      fake: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400',
      privacy: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400',
      other: 'text-neutral-600 bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-400'
    };
    return colors[type] || colors.other;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const utc = dateString.endsWith?.('Z') ? dateString : dateString + 'Z';
    return new Date(utc).toLocaleDateString('en-US', {
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
      key: 'reason',
      label: 'Type',
      render: (value) => (
        <span className={`inline-block px-2.5 py-1 text-xs font-medium rounded-full capitalize ${getTypeColor(value)}`}>
          {value}
        </span>
      )
    },
    {
      key: 'details',
      label: 'Reason',
      render: (value) => <span className="text-neutral-900 dark:text-white font-medium">{value || '-'}</span>
    },
    {
      key: 'reportedUserName',
      label: 'Reported User',
      render: (value) => <span className="text-neutral-600 dark:text-neutral-300">{value || '-'}</span>
    },
    {
      key: 'reporterName',
      label: 'Reported By',
      render: (value) => <span className="text-neutral-500">{value || '-'}</span>
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
          <ActionButton
            icon={<HiEye className="w-4 h-4" />}
            tooltip="View Details"
            onClick={(e) => { e?.stopPropagation?.(); handleView(row); }}
            variant="info"
          />
          {['pending', 'open', 'investigating'].includes(row.status?.toLowerCase()) ? (
            <>
              <ActionButton
                icon={<HiCheck className="w-4 h-4" />}
                tooltip="Resolve Report"
                onClick={(e) => { e?.stopPropagation?.(); handleAction(row, 'resolve'); }}
                variant="success"
              />
              <ActionButton
                icon={<HiX className="w-4 h-4" />}
                tooltip="Dismiss Report"
                onClick={(e) => { e?.stopPropagation?.(); handleAction(row, 'dismiss'); }}
                variant="danger"
              />
            </>
          ) : null}
        </div>
      )
    }
  ];

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white">Reports</h1>
        <p className="text-neutral-500 dark:text-neutral-400 text-sm">Review and manage user reports</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {[
          { key: 'pending', label: 'Pending', match: (s) => s?.toLowerCase() === 'pending' || s?.toLowerCase() === 'open' },
          { key: 'investigating', label: 'Investigating', match: (s) => s?.toLowerCase() === 'investigating' },
          { key: 'resolved', label: 'Resolved', match: (s) => s?.toLowerCase() === 'resolved' },
          { key: 'dismissed', label: 'Dismissed', match: (s) => s?.toLowerCase() === 'dismissed' },
        ].map(({ key, label, match }) => {
          const count = reports.filter(r => match(r.status)).length;
          return (
            <div key={key} className="p-3 sm:p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 text-center">
              <p className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white">{count}</p>
              <p className="text-xs sm:text-sm text-neutral-500 capitalize">{label}</p>
            </div>
          );
        })}
      </div>

      {/* Filters - Mobile Responsive */}
      <ReportFilters
        searchKeyword={searchKeyword}
        setSearchKeyword={setSearchKeyword}
        filterType={filterType}
        setFilterType={setFilterType}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
      />

      {/* Table */}
      <DataTable
        columns={columns}
        data={isLoading ? [] : paginatedReports}
        emptyMessage={isLoading ? "Loading..." : "No reports found"}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-4 sm:px-5 py-3 sm:py-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-sm text-neutral-500 text-center sm:text-left">
            Page {pageNumber} of {totalPages} ({filteredReports.length} reports)
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
                <span className={`inline-block px-2.5 py-1 text-xs font-medium rounded-full capitalize ${getTypeColor(selectedReport.reason)}`}>
                  {selectedReport.reason}
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
                <p className="text-neutral-900 dark:text-white font-medium">{selectedReport.details || '-'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl">
              <div>
                <p className="text-xs text-neutral-500 uppercase tracking-wide mb-1">Reported User</p>
                <p className="text-neutral-900 dark:text-white font-medium">{selectedReport.reportedUser?.fullName || selectedReport.reportedUserName || '-'}</p>
                {(selectedReport.reportedUser?.email || selectedReport.reportedUserEmail) && (
                  <p className="text-xs text-neutral-500">{selectedReport.reportedUser?.email || selectedReport.reportedUserEmail}</p>
                )}
                {selectedReport.reportedUser?.totalReports > 0 && (
                  <p className="text-xs text-red-500 mt-1">{selectedReport.reportedUser.totalReports} total report(s)</p>
                )}
              </div>
              <div>
                <p className="text-xs text-neutral-500 uppercase tracking-wide mb-1">Reported By</p>
                <p className="text-neutral-900 dark:text-white">{selectedReport.reporter?.fullName || selectedReport.reporterName || '-'}</p>
                {(selectedReport.reporter?.email || selectedReport.reporterEmail) && (
                  <p className="text-xs text-neutral-500">{selectedReport.reporter?.email || selectedReport.reporterEmail}</p>
                )}
              </div>
            </div>

            {/* Order Info */}
            {(selectedReport.order || selectedReport.orderId) && (
              <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl">
                <p className="text-xs text-neutral-500 uppercase tracking-wide mb-2">Related Order</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-neutral-500">Order ID</p>
                    <p className="font-medium text-neutral-900 dark:text-white">#{selectedReport.order?.id || selectedReport.orderId}</p>
                  </div>
                  {(selectedReport.order?.title || selectedReport.orderTitle) && (
                    <div>
                      <p className="text-xs text-neutral-500">Title</p>
                      <p className="font-medium text-neutral-900 dark:text-white">{selectedReport.order?.title || selectedReport.orderTitle}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Handler Info */}
            {selectedReport.handlerName && (
              <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl">
                <p className="text-xs text-neutral-500 uppercase tracking-wide mb-2">Handled By</p>
                <p className="font-medium text-neutral-900 dark:text-white">{selectedReport.handlerName}</p>
                {selectedReport.handlerNote && (
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">{selectedReport.handlerNote}</p>
                )}
              </div>
            )}

            {['pending', 'open', 'investigating'].includes(selectedReport.status?.toLowerCase()) && (
              <div className="flex gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                <button
                  onClick={() => handleDirectAction('resolve')}
                  className="flex-1 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  Mark as Resolved
                </button>
                <button
                  onClick={() => handleDirectAction('dismiss')}
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
