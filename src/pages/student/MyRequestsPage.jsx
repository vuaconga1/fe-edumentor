// src/pages/student/MyRequestsPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  HiDocumentText, HiClock, HiCurrencyDollar, HiUser, HiTrash,
  HiCheckCircle, HiXCircle, HiPlus, HiRefresh, HiChat, HiPaperAirplane
} from "react-icons/hi";
import requestApi from "../../api/requestApi";
import { normalizeAvatarUrl, buildDefaultAvatarUrl } from "../../utils/avatar";

const REQUEST_STATUS = {
  Open: { label: "Pending", bgClass: "bg-yellow-100 dark:bg-yellow-900/30", textClass: "text-yellow-700 dark:text-yellow-400", icon: HiClock },
  Accepted: { label: "Accepted", bgClass: "bg-green-100 dark:bg-green-900/30", textClass: "text-green-700 dark:text-green-400", icon: HiCheckCircle },
  Rejected: { label: "Rejected", bgClass: "bg-red-100 dark:bg-red-900/30", textClass: "text-red-700 dark:text-red-400", icon: HiXCircle },
  Closed: { label: "Closed", bgClass: "bg-gray-100 dark:bg-gray-900/30", textClass: "text-gray-700 dark:text-gray-400", icon: HiXCircle },
  Deleted: { label: "Deleted", bgClass: "bg-red-100 dark:bg-red-900/30", textClass: "text-red-700 dark:text-red-400", icon: HiTrash },
};

const PROPOSAL_STATUS = {
  Pending: { label: "Pending", bgClass: "bg-yellow-100 dark:bg-yellow-900/30", textClass: "text-yellow-700 dark:text-yellow-400" },
  Accepted: { label: "Accepted", bgClass: "bg-green-100 dark:bg-green-900/30", textClass: "text-green-700 dark:text-green-400" },
  Rejected: { label: "Rejected", bgClass: "bg-red-100 dark:bg-red-900/30", textClass: "text-red-700 dark:text-red-400" },
  Cancelled: { label: "Cancelled", bgClass: "bg-gray-100 dark:bg-gray-900/30", textClass: "text-gray-700 dark:text-gray-400" },
};

const MyRequestsPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("requests"); // "requests" | "proposals"

  // Requests state
  const [requests, setRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [requestsError, setRequestsError] = useState("");
  const [requestsPage, setRequestsPage] = useState(1);
  const [requestsTotalPages, setRequestsTotalPages] = useState(1);

  // Proposals state (proposals received on my community posts)
  const [proposals, setProposals] = useState([]);
  const [proposalsLoading, setProposalsLoading] = useState(false);
  const [proposalsError, setProposalsError] = useState("");
  const [proposalsPage, setProposalsPage] = useState(1);
  const [proposalsTotalPages, setProposalsTotalPages] = useState(1);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return "Not specified";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  // Fetch requests
  const fetchRequests = async () => {
    setRequestsLoading(true);
    setRequestsError("");
    try {
      const res = await requestApi.getMyRequests(requestsPage, 10);
      const data = res?.data?.data;
      setRequests(data?.items || []);
      setRequestsTotalPages(data?.totalPages || 1);
    } catch (err) {
      setRequestsError(err?.response?.data?.message || "Failed to load requests");
    } finally {
      setRequestsLoading(false);
    }
  };

  // Fetch proposals received on my posts
  const fetchProposals = async () => {
    setProposalsLoading(true);
    setProposalsError("");
    try {
      const res = await requestApi.getReceivedProposals();
      const data = res?.data?.data;
      // Backend returns array, not paged
      setProposals(Array.isArray(data) ? data : data?.items || []);
      setProposalsTotalPages(1);
    } catch (err) {
      setProposalsError(err?.response?.data?.message || "Failed to load proposals");
    } finally {
      setProposalsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "requests") {
      fetchRequests();
    } else {
      fetchProposals();
    }
  }, [activeTab, requestsPage, proposalsPage]);

  const handleDeleteRequest = async (requestId) => {
    if (!confirm("Are you sure you want to delete this request?")) return;
    try {
      await requestApi.delete(requestId);
      fetchRequests();
    } catch (err) {
      console.log("Delete request failed:", err);
      alert(err?.response?.data?.message || "Failed to delete request");
    }
  };

  const handleCloseRequest = async (requestId) => {
    if (!confirm("Are you sure you want to close this request?")) return;
    try {
      await requestApi.close(requestId);
      fetchRequests();
    } catch (err) {
      console.log("Close request failed:", err);
      alert(err?.response?.data?.message || "Failed to close request");
    }
  };

  const handleAcceptProposal = async (proposalId) => {
    try {
      const res = await requestApi.acceptProposal(proposalId);
      // Navigate to chat if conversationId is returned
      const conversationId = res?.data?.data?.conversationId;
      if (conversationId) {
        navigate(`/student/messaging?conversationId=${conversationId}`);
      } else {
        fetchProposals();
        alert("Proposal accepted! You can now chat with the mentor.");
      }
    } catch (err) {
      console.log("Accept proposal failed:", err);
      alert(err?.response?.data?.message || "Failed to accept proposal");
    }
  };

  const handleRejectProposal = async (proposalId) => {
    if (!confirm("Are you sure you want to reject this proposal?")) return;
    try {
      await requestApi.rejectProposal(proposalId);
      fetchProposals();
    } catch (err) {
      console.log("Reject proposal failed:", err);
      alert(err?.response?.data?.message || "Failed to reject proposal");
    }
  };

  const handleGoToChat = (conversationId) => {
    if (conversationId) {
      navigate(`/student/messaging?conversationId=${conversationId}`);
    } else {
      navigate("/student/messaging");
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
              My Requests & Proposals
            </h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              Manage your mentor requests and received proposals
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => activeTab === "requests" ? fetchRequests() : fetchProposals()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <HiRefresh className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={() => navigate("/student/find-mentor")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white transition-colors"
            >
              <HiPlus className="w-4 h-4" />
              Find Mentor
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => { setActiveTab("requests"); setRequestsPage(1); }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === "requests"
                ? "bg-primary-600 text-white"
                : "bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              }`}
          >
            <HiDocumentText className="inline w-4 h-4 mr-1" />
            My Requests
          </button>
          <button
            onClick={() => { setActiveTab("proposals"); setProposalsPage(1); }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === "proposals"
                ? "bg-primary-600 text-white"
                : "bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              }`}
          >
            <HiPaperAirplane className="inline w-4 h-4 mr-1" />
            Received Proposals
          </button>
        </div>

        {/* Requests Tab */}
        {activeTab === "requests" && (
          <>
            {requestsError && (
              <div className="mb-4 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400">
                {requestsError}
              </div>
            )}

            {requestsLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : requests.length === 0 ? (
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-10 text-center">
                <HiDocumentText className="w-12 h-12 text-neutral-300 dark:text-neutral-600 mx-auto mb-4" />
                <p className="text-lg font-medium text-neutral-900 dark:text-white">
                  No requests yet
                </p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                  Find a mentor and send a collaboration request
                </p>
                <button
                  onClick={() => navigate("/student/find-mentor")}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white transition-colors"
                >
                  <HiPlus className="w-4 h-4" />
                  Find Mentor
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((req) => {
                  const statusConfig = REQUEST_STATUS[req.status] || REQUEST_STATUS.Open;
                  const StatusIcon = statusConfig.icon;

                  return (
                    <div
                      key={req.id}
                      className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 hover:border-primary-200 dark:hover:border-primary-800 transition-colors"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                        {/* Main Info */}
                        <div className="flex-1">
                          <h3 className="font-semibold text-neutral-900 dark:text-white">
                            {req.title}
                          </h3>
                          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2">
                            {req.description}
                          </p>

                          {/* Meta */}
                          <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-neutral-500 dark:text-neutral-400">
                            <span className="flex items-center gap-1">
                              <HiCurrencyDollar className="w-4 h-4" />
                              {formatCurrency(req.expectedBudget)}
                            </span>
                            <span className="flex items-center gap-1">
                              <HiClock className="w-4 h-4" />
                              {req.expectedHours ? `${req.expectedHours} hours` : "Not specified"}
                            </span>
                            <span>{formatDate(req.createdAt)}</span>
                          </div>
                        </div>

                        {/* Status & Actions */}
                        <div className="flex flex-col items-end gap-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusConfig.bgClass} ${statusConfig.textClass}`}>
                            {statusConfig.label}
                          </span>

                          <div className="flex items-center gap-2">
                            {req.status === "Accepted" && (
                              <button
                                onClick={() => handleGoToChat(req.conversationId)}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors"
                              >
                                <HiChat className="w-4 h-4" />
                                Chat
                              </button>
                            )}

                            {req.status === "Open" && (
                              <>
                                <button
                                  onClick={() => handleCloseRequest(req.id)}
                                  className="p-2 rounded-lg text-neutral-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
                                  title="Close request"
                                >
                                  <HiXCircle className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteRequest(req.id)}
                                  className="p-2 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                  title="Delete request"
                                >
                                  <HiTrash className="w-5 h-5" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {!requestsLoading && requestsTotalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  onClick={() => setRequestsPage(p => Math.max(1, p - 1))}
                  disabled={requestsPage <= 1}
                  className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-sm text-neutral-500">
                  Page {requestsPage} / {requestsTotalPages}
                </span>
                <button
                  onClick={() => setRequestsPage(p => Math.min(requestsTotalPages, p + 1))}
                  disabled={requestsPage >= requestsTotalPages}
                  className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

        {/* Proposals Tab */}
        {activeTab === "proposals" && (
          <>
            {proposalsError && (
              <div className="mb-4 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400">
                {proposalsError}
              </div>
            )}

            {proposalsLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : proposals.length === 0 ? (
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-10 text-center">
                <HiPaperAirplane className="w-12 h-12 text-neutral-300 dark:text-neutral-600 mx-auto mb-4" />
                <p className="text-lg font-medium text-neutral-900 dark:text-white">
                  No proposals yet
                </p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                  When mentors send proposals to your community posts, they will appear here
                </p>
                <button
                  onClick={() => navigate("/student/community")}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white transition-colors"
                >
                  Go to Community
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {proposals.map((proposal) => {
                  const statusConfig = PROPOSAL_STATUS[proposal.status] || PROPOSAL_STATUS.Pending;

                  return (
                    <div
                      key={proposal.id}
                      className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 hover:border-primary-200 dark:hover:border-primary-800 transition-colors"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                        {/* Main Info */}
                        <div className="flex-1">
                          {/* Mentor Info */}
                          <div className="flex items-center gap-3 mb-3">
                            <img
                              src={
                                normalizeAvatarUrl(proposal.mentorAvatar) ||
                                buildDefaultAvatarUrl({
                                  id: proposal.mentorId,
                                  email: proposal.mentorEmail,
                                  fullName: proposal.mentorName
                                })
                              }
                              alt={proposal.mentorName}
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = buildDefaultAvatarUrl({
                                  id: proposal.mentorId,
                                  email: proposal.mentorEmail,
                                  fullName: proposal.mentorName
                                });
                              }}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                            <div>
                              <span className="font-medium text-neutral-900 dark:text-white">
                                {proposal.mentorName}
                              </span>
                              <span className="text-xs text-neutral-400 ml-2">
                                {formatDate(proposal.createdAt)}
                              </span>
                            </div>
                          </div>

                          {/* Post Reference */}
                          {proposal.postTitle && (
                            <div className="mb-2 text-sm text-neutral-500 dark:text-neutral-400">
                              On your post: <strong className="text-neutral-700 dark:text-neutral-300">"{proposal.postTitle}"</strong>
                            </div>
                          )}

                          {/* Message */}
                          <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-3">
                            {proposal.message}
                          </p>

                          {/* Meta */}
                          <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-neutral-500 dark:text-neutral-400">
                            <span className="flex items-center gap-1 font-medium text-green-600 dark:text-green-400">
                              <HiCurrencyDollar className="w-4 h-4" />
                              {formatCurrency(proposal.price)}
                            </span>
                            {proposal.estimatedHours && (
                              <span className="flex items-center gap-1">
                                <HiClock className="w-4 h-4" />
                                {proposal.estimatedHours} hours
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Status & Actions */}
                        <div className="flex flex-col items-end gap-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusConfig.bgClass} ${statusConfig.textClass}`}>
                            {statusConfig.label}
                          </span>

                          {proposal.status === "Pending" && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleAcceptProposal(proposal.id)}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition-colors"
                              >
                                <HiCheckCircle className="w-4 h-4" />
                                Accept
                              </button>
                              <button
                                onClick={() => handleRejectProposal(proposal.id)}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                              >
                                <HiXCircle className="w-4 h-4" />
                                Reject
                              </button>
                            </div>
                          )}

                          {proposal.status === "Accepted" && (
                            <button
                              onClick={() => handleGoToChat(proposal.conversationId)}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors"
                            >
                              <HiChat className="w-4 h-4" />
                              Chat
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {!proposalsLoading && proposalsTotalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  onClick={() => setProposalsPage(p => Math.max(1, p - 1))}
                  disabled={proposalsPage <= 1}
                  className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-sm text-neutral-500">
                  Page {proposalsPage} / {proposalsTotalPages}
                </span>
                <button
                  onClick={() => setProposalsPage(p => Math.min(proposalsTotalPages, p + 1))}
                  disabled={proposalsPage >= proposalsTotalPages}
                  className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MyRequestsPage;
