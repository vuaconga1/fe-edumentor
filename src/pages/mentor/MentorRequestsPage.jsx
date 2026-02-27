// src/pages/mentor/MentorRequestsPage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { HiChevronDown } from "react-icons/hi";
import {
  FileText, Send, MessageCircle, CheckCircle, XCircle,
  RefreshCw, Globe
} from "lucide-react";
import requestApi from "../../api/requestApi";
import { normalizeAvatarUrl, buildDefaultAvatarUrl } from "../../utils/avatar";

const REQUEST_STATUS = {
  Open: { label: "Pending", style: "text-amber-600 dark:text-amber-400" },
  Matched: { label: "Matched", style: "text-blue-600 dark:text-blue-400" },
  Accepted: { label: "Accepted", style: "text-green-600 dark:text-green-400" },
  InOrder: { label: "In Progress", style: "text-green-600 dark:text-green-400" },
  Rejected: { label: "Rejected", style: "text-red-500 dark:text-red-400" },
  Closed: { label: "Closed", style: "text-neutral-500 dark:text-neutral-400" },
  Cancelled: { label: "Cancelled", style: "text-neutral-500 dark:text-neutral-400" },
  Deleted: { label: "Cancelled", style: "text-neutral-500 dark:text-neutral-400" },
};

const PROPOSAL_STATUS = {
  Pending: { label: "Pending", style: "text-amber-600 dark:text-amber-400" },
  Accepted: { label: "Accepted", style: "text-green-600 dark:text-green-400" },
  Rejected: { label: "Rejected", style: "text-red-500 dark:text-red-400" },
  Cancelled: { label: "Cancelled", style: "text-neutral-500 dark:text-neutral-400" },
};

const requestFilterConfig = {
  all: { label: "All" },
  open: { label: "Pending" },
  matched: { label: "Matched" },
  accepted: { label: "In Progress" },
  rejected: { label: "Rejected" },
  cancelled: { label: "Cancelled" },
  closed: { label: "Closed" },
};

const proposalFilterConfig = {
  all: { label: "All" },
  pending: { label: "Pending" },
  accepted: { label: "Accepted" },
  rejected: { label: "Rejected" },
  cancelled: { label: "Cancelled" },
};

const formatDate = (d) => {
  if (!d) return "-";
  const utc = d.endsWith('Z') ? d : d + 'Z';
  return new Date(utc).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const formatCurrency = (amount) => {
  if (!amount) return "-";
  return new Intl.NumberFormat("vi-VN").format(Number(amount)) + "đ";
};

const normalizeRequestStatus = (statusDisplay) => {
  const s = String(statusDisplay || "").toLowerCase();
  if (s.includes("cancel") || s.includes("delete")) return "cancelled";
  if (s.includes("inorder") || s.includes("in order") || s === "4") return "accepted";
  if (s.includes("matched") || s === "3") return "matched";
  if (s.includes("open") || s.includes("pending") || s === "0") return "open";
  if (s.includes("accept") || s === "1") return "accepted";
  if (s.includes("reject") || s === "2") return "rejected";
  if (s.includes("close") || s === "5") return "closed";
  return "open";
};

const normalizeProposalStatus = (status) => {
  const s = String(status || "").toLowerCase();
  if (s.includes("pending")) return "pending";
  if (s.includes("accept")) return "accepted";
  if (s.includes("reject")) return "rejected";
  if (s.includes("cancel")) return "cancelled";
  return "pending";
};

const MentorRequestsPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("proposals");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Requests received from students
  const [requests, setRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestsError, setRequestsError] = useState("");

  // Proposals sent to community posts
  const [proposals, setProposals] = useState([]);
  const [proposalsLoading, setProposalsLoading] = useState(true);
  const [proposalsError, setProposalsError] = useState("");

  // Reject modal
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingRequestId, setRejectingRequestId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchRequests = async () => {
    setRequestsLoading(true);
    setRequestsError("");
    try {
      const res = await requestApi.getReceivedRequests(1, 100);
      const data = res?.data?.data;
      setRequests(data?.items || []);
    } catch (err) {
      setRequestsError(err?.response?.data?.message || "Failed to load requests");
    } finally {
      setRequestsLoading(false);
    }
  };

  const fetchProposals = async () => {
    setProposalsLoading(true);
    setProposalsError("");
    try {
      const res = await requestApi.getMyProposals();
      const data = res?.data?.data;
      setProposals(Array.isArray(data) ? data : data?.items || []);
    } catch (err) {
      setProposalsError(err?.response?.data?.message || "Failed to load proposals");
    } finally {
      setProposalsLoading(false);
    }
  };

  useEffect(() => {
    setFilterStatus("all");
    if (activeTab === "requests") fetchRequests();
    else fetchProposals();
  }, [activeTab]);

  const handleAcceptRequest = async (id) => {
    try {
      const res = await requestApi.acceptRequest(id);
      const conversationId = res?.data?.data?.conversationId;
      if (conversationId) {
        navigate(`/mentor/messaging?conversationId=${conversationId}`);
      } else {
        fetchRequests();
      }
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to accept request");
    }
  };

  const handleOpenRejectModal = (id) => {
    setRejectingRequestId(id);
    setRejectReason("");
    setShowRejectModal(true);
  };

  const handleRejectRequest = async () => {
    if (!rejectingRequestId) return;
    try {
      await requestApi.rejectRequest(rejectingRequestId, rejectReason || null);
      setShowRejectModal(false);
      setRejectingRequestId(null);
      setRejectReason("");
      fetchRequests();
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to reject request");
    }
  };

  const handleCancelProposal = async (id) => {
    if (!confirm("Are you sure you want to cancel this proposal?")) return;
    try {
      await requestApi.cancelProposal(id);
      fetchProposals();
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to cancel proposal");
    }
  };

  const handleGoToChat = (conversationId) => {
    navigate(conversationId ? `/mentor/messaging?conversationId=${conversationId}` : "/mentor/messaging");
  };

  // Stats
  const proposalStats = useMemo(() => {
    const total = proposals.length;
    const pending = proposals.filter(p => normalizeProposalStatus(p.status) === "pending").length;
    const accepted = proposals.filter(p => normalizeProposalStatus(p.status) === "accepted").length;
    return { total, pending, accepted };
  }, [proposals]);

  const requestStats = useMemo(() => {
    const total = requests.length;
    const open = requests.filter(r => normalizeRequestStatus(r.statusDisplay || r.status) === "open").length;
    const accepted = requests.filter(r => normalizeRequestStatus(r.statusDisplay || r.status) === "accepted").length;
    return { total, open, accepted };
  }, [requests]);

  const filteredRequests = useMemo(() => {
    if (filterStatus === "all") return requests;
    return requests.filter(r => normalizeRequestStatus(r.statusDisplay || r.status) === filterStatus);
  }, [requests, filterStatus]);

  const filteredProposals = useMemo(() => {
    if (filterStatus === "all") return proposals;
    return proposals.filter(p => normalizeProposalStatus(p.status) === filterStatus);
  }, [proposals, filterStatus]);

  const loading = activeTab === "requests" ? requestsLoading : proposalsLoading;
  const error = activeTab === "requests" ? requestsError : proposalsError;
  const currentFilterConfig = activeTab === "requests" ? requestFilterConfig : proposalFilterConfig;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950">
      <div className="px-4 py-5 sm:px-6 sm:py-6 space-y-5">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-800 dark:text-white">
              My Proposals
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Manage your proposals and received student requests
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => activeTab === "requests" ? fetchRequests() : fetchProposals()}
              className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg text-sm text-gray-600 dark:text-neutral-400 hover:border-gray-300 dark:hover:border-neutral-700 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
            <button
              onClick={() => navigate("/mentor/community")}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Globe className="w-3.5 h-3.5" />
              Community
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-neutral-900 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab("proposals")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "proposals"
                ? "bg-white dark:bg-neutral-800 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-500 dark:text-neutral-400 hover:text-gray-700 dark:hover:text-neutral-300"
            }`}
          >
            My Proposals
          </button>
          <button
            onClick={() => setActiveTab("requests")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "requests"
                ? "bg-white dark:bg-neutral-800 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-500 dark:text-neutral-400 hover:text-gray-700 dark:hover:text-neutral-300"
            }`}
          >
            Received Requests
          </button>
        </div>

        {/* Proposals Tab */}
        {activeTab === "proposals" && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-800 p-3 sm:p-4">
                <p className="text-xs text-gray-500 mb-1">Total Proposals</p>
                <p className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-white">{proposalStats.total}</p>
              </div>
              <div className="bg-white dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-800 p-3 sm:p-4">
                <p className="text-xs text-gray-500 mb-1">Pending</p>
                <p className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-white">{proposalStats.pending}</p>
              </div>
              <div className="bg-white dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-800 p-3 sm:p-4">
                <p className="text-xs text-gray-500 mb-1">Accepted</p>
                <p className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-white">{proposalStats.accepted}</p>
              </div>
            </div>

            {/* Filter */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500 dark:text-neutral-400">
                {filteredProposals.length} proposal{filteredProposals.length !== 1 ? "s" : ""}
              </p>
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg text-sm font-medium text-gray-700 dark:text-neutral-300 hover:border-gray-300 dark:hover:border-neutral-700 transition-colors min-w-[120px] justify-between"
                >
                  <span>{currentFilterConfig[filterStatus]?.label}</span>
                  <HiChevronDown className={`w-4 h-4 text-gray-500 dark:text-neutral-400 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
                </button>
                {isDropdownOpen && (
                  <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg shadow-lg z-20 overflow-hidden">
                    {Object.keys(currentFilterConfig).map((key) => (
                      <button
                        key={key}
                        onClick={() => { setFilterStatus(key); setIsDropdownOpen(false); }}
                        className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                          filterStatus === key
                            ? "bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-white font-medium"
                            : "text-gray-600 dark:text-neutral-400 hover:bg-gray-50 dark:hover:bg-neutral-800"
                        }`}
                      >
                        {currentFilterConfig[key].label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Proposals List */}
            {loading && (
              <div className="bg-white dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-800 p-4 text-sm text-gray-500">
                Loading proposals...
              </div>
            )}
            {!loading && error && (
              <div className="bg-white dark:bg-neutral-900 rounded-lg border border-red-200 dark:border-red-800 p-4 text-sm text-red-600">{error}</div>
            )}
            {!loading && !error && (
              <div className="bg-white dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-800 overflow-hidden">
                {/* Table Header - Desktop */}
                <div className="hidden lg:grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50 dark:bg-neutral-800/50 border-b border-gray-200 dark:border-neutral-800 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  <div className="col-span-4">Post / Student</div>
                  <div className="col-span-3">Message</div>
                  <div className="col-span-2">Price</div>
                  <div className="col-span-1">Status</div>
                  <div className="col-span-2 text-right">Actions</div>
                </div>

                {filteredProposals.length === 0 ? (
                  <div className="px-4 py-10 text-center">
                    <Send className="w-10 h-10 text-gray-300 dark:text-neutral-600 mx-auto mb-3" />
                    <p className="text-sm font-medium text-gray-800 dark:text-white">No proposals found</p>
                    <p className="text-xs text-gray-500 mt-1">Browse community posts and send proposals to students</p>
                  </div>
                ) : (
                  filteredProposals.map((proposal, idx) => {
                    const statusText = proposal.status;
                    const cfg = PROPOSAL_STATUS[statusText] || PROPOSAL_STATUS.Pending;

                    return (
                      <div
                        key={proposal.id}
                        className={`${idx > 0 ? "border-t border-gray-100 dark:border-neutral-800" : ""}`}
                      >
                        {/* Desktop Row */}
                        <div className="hidden lg:grid grid-cols-12 gap-4 px-4 py-4 items-center hover:bg-gray-50 dark:hover:bg-neutral-800/30 transition-colors">
                          <div className="col-span-4 min-w-0">
                            {proposal.postTitle && (
                              <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{proposal.postTitle}</p>
                            )}
                            {proposal.studentName && (
                              <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">by {proposal.studentName}</p>
                            )}
                            <p className="text-xs text-gray-400 dark:text-neutral-500 mt-0.5">{formatDate(proposal.createdAt)}</p>
                          </div>
                          <div className="col-span-3 text-sm text-gray-600 dark:text-neutral-400 line-clamp-2">
                            {proposal.message || "-"}
                          </div>
                          <div className="col-span-2 text-sm text-gray-700 dark:text-neutral-300">
                            {formatCurrency(proposal.price)}
                          </div>
                          <div className="col-span-1">
                            <span className={`text-xs font-medium ${cfg.style}`}>{cfg.label}</span>
                          </div>
                          <div className="col-span-2 flex items-center justify-end gap-2">
                            {statusText === "Pending" && (
                              <button
                                onClick={() => handleCancelProposal(proposal.id)}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-gray-500 dark:text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                Cancel
                              </button>
                            )}
                            {statusText === "Accepted" && (
                              <button
                                onClick={() => handleGoToChat(proposal.conversationId)}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                                Chat
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Mobile Card */}
                        <div className="lg:hidden px-4 py-4 hover:bg-gray-50 dark:hover:bg-neutral-800/30 transition-colors">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              {proposal.postTitle && (
                                <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{proposal.postTitle}</p>
                              )}
                              {proposal.studentName && (
                                <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">by {proposal.studentName}</p>
                              )}
                            </div>
                            <span className={`text-xs font-medium whitespace-nowrap ${cfg.style}`}>{cfg.label}</span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1.5 line-clamp-2">{proposal.message}</p>
                          <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500 dark:text-neutral-400">
                            <span className="font-medium text-gray-700 dark:text-neutral-300">{formatCurrency(proposal.price)}</span>
                            <span>{formatDate(proposal.createdAt)}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-3">
                            {statusText === "Pending" && (
                              <button
                                onClick={() => handleCancelProposal(proposal.id)}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-gray-500 dark:text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                Cancel
                              </button>
                            )}
                            {statusText === "Accepted" && (
                              <button
                                onClick={() => handleGoToChat(proposal.conversationId)}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                                Chat
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </>
        )}

        {/* Requests Tab */}
        {activeTab === "requests" && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-800 p-3 sm:p-4">
                <p className="text-xs text-gray-500 mb-1">Total Requests</p>
                <p className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-white">{requestStats.total}</p>
              </div>
              <div className="bg-white dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-800 p-3 sm:p-4">
                <p className="text-xs text-gray-500 mb-1">Pending</p>
                <p className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-white">{requestStats.open}</p>
              </div>
              <div className="bg-white dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-800 p-3 sm:p-4">
                <p className="text-xs text-gray-500 mb-1">Accepted</p>
                <p className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-white">{requestStats.accepted}</p>
              </div>
            </div>

            {/* Filter */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500 dark:text-neutral-400">
                {filteredRequests.length} request{filteredRequests.length !== 1 ? "s" : ""}
              </p>
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg text-sm font-medium text-gray-700 dark:text-neutral-300 hover:border-gray-300 dark:hover:border-neutral-700 transition-colors min-w-[120px] justify-between"
                >
                  <span>{currentFilterConfig[filterStatus]?.label}</span>
                  <HiChevronDown className={`w-4 h-4 text-gray-500 dark:text-neutral-400 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
                </button>
                {isDropdownOpen && (
                  <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg shadow-lg z-20 overflow-hidden">
                    {Object.keys(currentFilterConfig).map((key) => (
                      <button
                        key={key}
                        onClick={() => { setFilterStatus(key); setIsDropdownOpen(false); }}
                        className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                          filterStatus === key
                            ? "bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-white font-medium"
                            : "text-gray-600 dark:text-neutral-400 hover:bg-gray-50 dark:hover:bg-neutral-800"
                        }`}
                      >
                        {currentFilterConfig[key].label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Request List */}
            {loading && (
              <div className="bg-white dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-800 p-4 text-sm text-gray-500">
                Loading requests...
              </div>
            )}
            {!loading && error && (
              <div className="bg-white dark:bg-neutral-900 rounded-lg border border-red-200 dark:border-red-800 p-4 text-sm text-red-600">{error}</div>
            )}
            {!loading && !error && (
              <div className="bg-white dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-800 overflow-hidden">
                {/* Table Header - Desktop */}
                <div className="hidden lg:grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50 dark:bg-neutral-800/50 border-b border-gray-200 dark:border-neutral-800 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  <div className="col-span-4">Student / Request</div>
                  <div className="col-span-2">Budget</div>
                  <div className="col-span-2">Date</div>
                  <div className="col-span-1">Status</div>
                  <div className="col-span-3 text-right">Actions</div>
                </div>

                {filteredRequests.length === 0 ? (
                  <div className="px-4 py-10 text-center">
                    <FileText className="w-10 h-10 text-gray-300 dark:text-neutral-600 mx-auto mb-3" />
                    <p className="text-sm font-medium text-gray-800 dark:text-white">No requests found</p>
                    <p className="text-xs text-gray-500 mt-1">When students send you requests, they appear here</p>
                  </div>
                ) : (
                  filteredRequests.map((req, idx) => {
                    const statusText = req.statusDisplay || req.status;
                    const cfg = REQUEST_STATUS[statusText] || REQUEST_STATUS.Open;

                    return (
                      <div
                        key={req.id}
                        className={`${idx > 0 ? "border-t border-gray-100 dark:border-neutral-800" : ""}`}
                      >
                        {/* Desktop Row */}
                        <div className="hidden lg:grid grid-cols-12 gap-4 px-4 py-4 items-center hover:bg-gray-50 dark:hover:bg-neutral-800/30 transition-colors">
                          <div className="col-span-4 flex items-center gap-3 min-w-0">
                            <img
                              src={normalizeAvatarUrl(req.studentAvatar) || buildDefaultAvatarUrl({ id: req.studentId, email: req.studentEmail, fullName: req.studentName })}
                              alt={req.studentName}
                              onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = buildDefaultAvatarUrl({ id: req.studentId, email: req.studentEmail, fullName: req.studentName }); }}
                              className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{req.studentName}</p>
                              <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5 truncate">{req.title}</p>
                            </div>
                          </div>
                          <div className="col-span-2 text-sm text-gray-700 dark:text-neutral-300">
                            {formatCurrency(req.expectedBudget)}
                          </div>
                          <div className="col-span-2 text-sm text-gray-500 dark:text-neutral-400">
                            {formatDate(req.createdAt)}
                          </div>
                          <div className="col-span-1">
                            <span className={`text-xs font-medium ${cfg.style}`}>{cfg.label}</span>
                          </div>
                          <div className="col-span-3 flex items-center justify-end gap-2">
                            {(statusText === "Open" || statusText === 0 || statusText === "Matched" || statusText === 3) && (
                              <>
                                <button
                                  onClick={() => handleAcceptRequest(req.id)}
                                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium bg-green-600 text-white hover:bg-green-700 transition-colors"
                                >
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  Accept
                                </button>
                                <button
                                  onClick={() => handleOpenRejectModal(req.id)}
                                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  Reject
                                </button>
                              </>
                            )}
                            {(statusText === "InOrder" || statusText === "Accepted" || statusText === 4 || statusText === 1) && (
                              <button
                                onClick={() => handleGoToChat(req.conversationId)}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                                Chat
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Mobile Card */}
                        <div className="lg:hidden px-4 py-4 hover:bg-gray-50 dark:hover:bg-neutral-800/30 transition-colors">
                          <div className="flex items-start gap-3">
                            <img
                              src={normalizeAvatarUrl(req.studentAvatar) || buildDefaultAvatarUrl({ id: req.studentId, email: req.studentEmail, fullName: req.studentName })}
                              alt={req.studentName}
                              onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = buildDefaultAvatarUrl({ id: req.studentId, email: req.studentEmail, fullName: req.studentName }); }}
                              className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{req.studentName}</p>
                                <span className={`text-xs font-medium whitespace-nowrap ${cfg.style}`}>{cfg.label}</span>
                              </div>
                              <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5 truncate">{req.title}</p>
                              <p className="text-xs text-gray-400 dark:text-neutral-500 mt-0.5 line-clamp-2">{req.description}</p>
                              <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500 dark:text-neutral-400">
                                <span className="font-medium text-gray-700 dark:text-neutral-300">{formatCurrency(req.expectedBudget)}</span>
                                <span>{formatDate(req.createdAt)}</span>
                              </div>
                              <div className="flex items-center gap-2 mt-3">
                                {(statusText === "Open" || statusText === 0 || statusText === "Matched" || statusText === 3) && (
                                  <>
                                    <button
                                      onClick={() => handleAcceptRequest(req.id)}
                                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium bg-green-600 text-white hover:bg-green-700 transition-colors"
                                    >
                                      <CheckCircle className="w-3.5 h-3.5" />
                                      Accept
                                    </button>
                                    <button
                                      onClick={() => handleOpenRejectModal(req.id)}
                                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                    >
                                      <XCircle className="w-3.5 h-3.5" />
                                      Reject
                                    </button>
                                  </>
                                )}
                                {(statusText === "InOrder" || statusText === "Accepted" || statusText === 4 || statusText === 1) && (
                                  <button
                                    onClick={() => handleGoToChat(req.conversationId)}
                                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                                  >
                                    <MessageCircle className="w-3.5 h-3.5" />
                                    Chat
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Reject Request Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-lg shadow-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 dark:border-neutral-800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Reject Request</h2>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-gray-600 dark:text-neutral-400">
                Are you sure? You can optionally provide a reason.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1.5">
                  Reason (optional)
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                  placeholder="Provide a reason for rejecting..."
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none text-sm"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowRejectModal(false); setRejectingRequestId(null); setRejectReason(""); }}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 dark:border-neutral-700 text-gray-700 dark:text-neutral-300 font-medium hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRejectRequest}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition-colors text-sm"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MentorRequestsPage;
