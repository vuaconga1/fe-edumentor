// src/pages/mentor/MentorHome.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import orderApi from "../../api/orderApi";
import requestApi from "../../api/requestApi";
import walletApi from "../../api/walletApi";
import { normalizeAvatarUrl, buildDefaultAvatarUrl } from "../../utils/avatar";

const MentorHome = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingRequests: 0,
    walletBalance: 0,
    escrowBalance: 0,
    sentProposals: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentRequests, setRecentRequests] = useState([]);
  const [myProposals, setMyProposals] = useState([]);

  const formatCurrency = (amount) => {
    if (!amount) return "0";
    return new Intl.NumberFormat("vi-VN").format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusStyle = (status) => {
    const s = String(status);
    const styles = {
      Open: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
      Accepted: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
      Rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      Closed: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400",
      Pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
      InProgress: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      Completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
      Cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    };
    return styles[s] || "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400";
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [ordersRes, requestsRes, walletRes, proposalsRes] = await Promise.all([
          orderApi.getMyOrdersMentor({ pageNumber: 1, pageSize: 5 }),
          requestApi.getReceivedRequests(1, 5),
          walletApi.getWallet(),
          requestApi.getMyProposals().catch(() => ({ data: { data: [] } })),
        ]);

        const orders = ordersRes?.data?.data?.items || [];
        const requests = requestsRes?.data?.data?.items || [];
        const wallet = walletRes?.data?.data;
        const proposals = proposalsRes?.data?.data?.items || proposalsRes?.data?.data || [];

        setRecentOrders(orders);
        setRecentRequests(requests);
        setMyProposals(Array.isArray(proposals) ? proposals : []);
        setStats({
          totalOrders: ordersRes?.data?.data?.totalCount || orders.length,
          pendingRequests: requests.filter(r => r.status === "Open").length,
          walletBalance: wallet?.balance || 0,
          escrowBalance: wallet?.escrowBalance || 0,
          sentProposals: (Array.isArray(proposals) ? proposals : []).filter(p => p.status === "Pending" || p.status === "Open").length,
        });
      } catch (err) {
        console.log("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-48"></div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-neutral-200 dark:bg-neutral-700 rounded-xl"></div>
            ))}
          </div>
          <div className="h-64 bg-neutral-200 dark:bg-neutral-700 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">Dashboard</h1>
        <p className="text-neutral-500 dark:text-neutral-400 mt-1">Welcome back! Here's your overview.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-5 cursor-pointer hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors"
          onClick={() => navigate("/mentor/orders")}
        >
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">Total Orders</p>
          <p className="text-2xl font-semibold text-neutral-900 dark:text-white">{stats.totalOrders}</p>
        </div>

        <div 
          className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-5 cursor-pointer hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors"
          onClick={() => navigate("/mentor/requests")}
        >
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">Pending Requests</p>
          <p className="text-2xl font-semibold text-neutral-900 dark:text-white">{stats.pendingRequests}</p>
        </div>

        <div 
          className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-5 cursor-pointer hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors"
          onClick={() => navigate("/mentor/wallet")}
        >
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">Available Balance</p>
          <p className="text-2xl font-semibold text-neutral-900 dark:text-white">{formatCurrency(stats.walletBalance)} đ</p>
        </div>

        <div 
          className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-5 cursor-pointer hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors"
          onClick={() => navigate("/mentor/wallet")}
        >
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">In Escrow</p>
          <p className="text-2xl font-semibold text-neutral-900 dark:text-white">{formatCurrency(stats.escrowBalance)} đ</p>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 dark:border-neutral-800">
            <h2 className="font-semibold text-neutral-900 dark:text-white">Recent Orders</h2>
            <button 
              onClick={() => navigate("/mentor/orders")}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              View all
            </button>
          </div>
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {recentOrders.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
                No orders yet
              </div>
            ) : (
              recentOrders.slice(0, 4).map(order => (
                <div key={order.id} className="px-5 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                  <div className="flex items-center gap-3">
                    <img
                      src={normalizeAvatarUrl(order.studentAvatar) || buildDefaultAvatarUrl({ fullName: order.studentName })}
                      alt=""
                      className="w-9 h-9 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">{order.studentName || "Student"}</p>
                      <p className="text-xs text-neutral-500">{formatDate(order.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${getStatusStyle(order.status)}`}>
                        {order.status}
                      </span>
                      <p className="text-xs text-neutral-500 mt-1">{formatCurrency(order.totalPrice)} đ</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Incoming Requests */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 dark:border-neutral-800">
            <h2 className="font-semibold text-neutral-900 dark:text-white">Incoming Requests</h2>
            <button 
              onClick={() => navigate("/mentor/requests")}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              View all
            </button>
          </div>
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {recentRequests.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
                No requests yet
              </div>
            ) : (
              recentRequests.slice(0, 4).map(request => (
                <div key={request.id} className="px-5 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">{request.title}</p>
                      <p className="text-xs text-neutral-500 mt-1">
                        From: {request.studentName || "Student"} • {formatDate(request.createdAt)}
                      </p>
                    </div>
                    <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full whitespace-nowrap ${getStatusStyle(request.status)}`}>
                      {request.status === "Open" ? "Pending" : request.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* My Proposals */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 dark:border-neutral-800">
          <h2 className="font-semibold text-neutral-900 dark:text-white">My Proposals</h2>
          <button 
            onClick={() => navigate("/mentor/community")}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            View all
          </button>
        </div>
        <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {myProposals.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
              No proposals yet. Browse the community to find posts and send proposals!
            </div>
          ) : (
            myProposals.slice(0, 5).map(proposal => (
              <div key={proposal.id} className="px-5 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                <div className="flex items-center gap-3">
                  <img
                    src={normalizeAvatarUrl(proposal.studentAvatar || proposal.posterAvatar) || buildDefaultAvatarUrl({ fullName: proposal.studentName || proposal.posterName })}
                    alt=""
                    className="w-9 h-9 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                      {proposal.postTitle || proposal.title || "Community Post"}
                    </p>
                    <p className="text-xs text-neutral-500 mt-0.5 truncate">
                      {proposal.message || proposal.content || "No message"}
                    </p>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      To: {proposal.studentName || proposal.posterName || "Student"} • {formatDate(proposal.createdAt)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${getStatusStyle(proposal.status)}`}>
                      {proposal.status}
                    </span>
                    {proposal.price != null && (
                      <p className="text-xs text-neutral-500 mt-1">{formatCurrency(proposal.price)} đ</p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-5">
        <h2 className="font-semibold text-neutral-900 dark:text-white mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => navigate("/mentor/requests")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            View Requests
          </button>
          <button
            onClick={() => navigate("/mentor/community")}
            className="px-4 py-2 border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors text-sm"
          >
            Browse Community
          </button>
          <button
            onClick={() => navigate("/mentor/profile")}
            className="px-4 py-2 border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors text-sm"
          >
            Edit Profile
          </button>
        </div>
      </div>
    </div>
  );
};

export default MentorHome;
