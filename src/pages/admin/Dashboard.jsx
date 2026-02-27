import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  HiUsers,
  HiAcademicCap,
  HiUserGroup,
  HiCurrencyDollar,
} from "react-icons/hi";

import adminApi from "../../api/adminApi";
import { normalizeAvatarUrl, buildDefaultAvatarUrl } from "../../utils/avatar";

const Dashboard = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [pendingApplications, setPendingApplications] = useState([]);
  const [loadingApplications, setLoadingApplications] = useState(true);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoadingUsers(true);
        setLoadingApplications(true);
        setLoadingTransactions(true);

        const [usersRes, appsRes, txRes, dashRes] = await Promise.all([
          adminApi.getUsers({ pageNumber: 1, pageSize: 200 }),
          adminApi.getMentorApplications({ pageNumber: 1, pageSize: 5, status: "Pending" }),
          adminApi.getTransactions({ pageNumber: 1, pageSize: 5 }),
          adminApi.getDashboard().catch(() => null),
        ]);

        // Users
        const userData = usersRes?.data?.data ?? usersRes?.data;
        const list = Array.isArray(userData?.items) ? userData.items : (Array.isArray(userData) ? userData : []);
        setUsers(list);

        // Pending applications
        const appsData = appsRes?.data?.data ?? appsRes?.data;
        const appsList = Array.isArray(appsData?.items) ? appsData.items : (Array.isArray(appsData) ? appsData : []);
        setPendingApplications(appsList);

        // Transactions
        const txData = txRes?.data?.data ?? txRes?.data;
        const txList = Array.isArray(txData?.items) ? txData.items : (Array.isArray(txData) ? txData : []);
        setRecentTransactions(txList);

        // Dashboard stats
        if (dashRes?.data?.data) setDashboardData(dashRes.data.data);

      } catch (err) {
        console.log("Failed to fetch dashboard data", err);
      } finally {
        setLoadingUsers(false);
        setLoadingApplications(false);
        setLoadingTransactions(false);
      }
    }

    fetchData();
  }, []);

  // ====== STATS ======
  const normalizeRole = (role) => {
    if (role === null || role === undefined) return "";
    const r = String(role).toLowerCase();
    if (r === "0" || r.includes("student")) return "student";
    if (r === "1" || r.includes("mentor")) return "mentor";
    if (r === "2" || r.includes("admin")) return "admin";
    return r;
  };

  const totalUsers = dashboardData?.totalUsers ?? users.length;
  const mentors = dashboardData?.totalMentors ?? users.filter((u) => normalizeRole(u.role) === "mentor").length;
  const students = dashboardData?.totalStudents ?? users.filter((u) => normalizeRole(u.role) === "student").length;
  const totalRevenue = dashboardData?.totalRevenue || 0;
  const pendingAppsCount = dashboardData?.pendingApplications ?? pendingApplications.length;

  const recentUsers = useMemo(() => {
    const toTime = (u) => {
      const d = u.joined || u.createdAt || u.created_at;
      const t = d ? new Date(d).getTime() : 0;
      return Number.isFinite(t) ? t : 0;
    };
    return [...users].sort((a, b) => toTime(b) - toTime(a)).slice(0, 5);
  }, [users]);

  const stats = [
    { label: "Total Users", value: totalUsers, icon: HiUsers, onClick: () => navigate("/admin/users") },
    { label: "Mentors", value: mentors, icon: HiAcademicCap, onClick: () => navigate("/admin/users") },
    { label: "Students", value: students, icon: HiUserGroup, onClick: () => navigate("/admin/users") },
    { label: "Revenue", value: `${((totalRevenue || 0) / 1000000).toFixed(1)}M đ`, icon: HiCurrencyDollar, onClick: () => navigate("/admin/transactions") },
  ];

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("vi-VN").format(amount) + " đ";

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusStyle = (status) => {
    const s = String(status).toLowerCase();
    const styles = {
      active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
      inactive: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400",
      pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
      approved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
      rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
      failed: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    };
    return styles[s] || styles.inactive;
  };

  const getTransactionTypeColor = (type) => {
    const t = String(type).toLowerCase();
    const colors = {
      deposit: "text-emerald-600",
      withdraw: "text-red-600",
      payment: "text-blue-600",
      earning: "text-emerald-600",
      refund: "text-amber-600",
    };
    return colors[t] || "text-neutral-600";
  };

  const isLoading = loadingUsers && loadingApplications;

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-48"></div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-neutral-200 dark:bg-neutral-700 rounded-xl"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-neutral-200 dark:bg-neutral-700 rounded-xl"></div>
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
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">
          Dashboard
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 mt-1">
          Overview of platform metrics and activity
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className="p-5 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 cursor-pointer hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors"
            onClick={stat.onClick}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  {stat.label}
                </p>
                <p className="text-2xl font-semibold text-neutral-900 dark:text-white mt-1">
                  {stat.value}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-neutral-50 dark:bg-neutral-800">
                <stat.icon className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          className="p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 text-center cursor-pointer hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors"
          onClick={() => navigate("/admin/users")}
        >
          <p className="text-3xl font-semibold text-neutral-900 dark:text-white">{totalUsers}</p>
          <p className="text-sm text-neutral-500 mt-1">Total Users</p>
        </div>
        <div
          className="p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 text-center cursor-pointer hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors"
          onClick={() => navigate("/admin/mentor-applications")}
        >
          <p className="text-3xl font-semibold text-amber-600 dark:text-amber-400">{pendingAppsCount}</p>
          <p className="text-sm text-neutral-500 mt-1">Pending Applications</p>
        </div>
        <div
          className="p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 text-center cursor-pointer hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors"
          onClick={() => navigate("/admin/reports")}
        >
          <p className="text-3xl font-semibold text-neutral-900 dark:text-white">{dashboardData?.reportsCount ?? 0}</p>
          <p className="text-sm text-neutral-500 mt-1">Pending Reports</p>
        </div>
      </div>

      {/* Pending Mentor Applications */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 dark:border-neutral-800">
          <h2 className="font-semibold text-neutral-900 dark:text-white">
            Pending Mentor Applications
          </h2>
          <button
            onClick={() => navigate("/admin/mentor-applications")}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            View all
          </button>
        </div>
        <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {loadingApplications ? (
            <div className="px-5 py-8 text-center text-sm text-neutral-500">Loading...</div>
          ) : pendingApplications.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
              No pending applications
            </div>
          ) : (
            pendingApplications.slice(0, 5).map((app) => (
              <div
                key={app.userId || app.id}
                className="flex items-center justify-between px-5 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 cursor-pointer"
                onClick={() => navigate("/admin/mentor-applications")}
              >
                <div className="flex items-center gap-3">
                  <img
                    src={
                      normalizeAvatarUrl(app.avatarUrl) ||
                      buildDefaultAvatarUrl({ id: app.userId, email: app.email, fullName: app.fullName })
                    }
                    alt={app.fullName || app.email}
                    className="w-9 h-9 rounded-full object-cover"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = buildDefaultAvatarUrl({
                        id: app.userId, email: app.email, fullName: app.fullName
                      });
                    }}
                  />
                  <div>
                    <p className="text-sm font-medium text-neutral-900 dark:text-white">
                      {app.fullName || "(no name)"}
                    </p>
                    <p className="text-xs text-neutral-500">{app.email}</p>
                  </div>
                </div>
                <div className="text-right flex items-center gap-3">
                  {app.aiScore != null && (
                    <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                      AI: {app.aiScore}
                    </span>
                  )}
                  <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${getStatusStyle("pending")}`}>
                    Pending
                  </span>
                  <p className="text-xs text-neutral-500">{formatDate(app.appliedAt || app.createdAt)}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 dark:border-neutral-800">
            <h2 className="font-semibold text-neutral-900 dark:text-white">
              Recent Users
            </h2>
            <button
              onClick={() => navigate("/admin/users")}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              View all
            </button>
          </div>

          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {loadingUsers ? (
              <div className="px-5 py-8 text-center text-sm text-neutral-500">Loading...</div>
            ) : users.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-neutral-500">No users</div>
            ) : (
              recentUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between px-5 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        normalizeAvatarUrl(user.avatarUrl) ||
                        buildDefaultAvatarUrl({ id: user.id, email: user.email, fullName: user.fullName })
                      }
                      alt={user.fullName || user.email}
                      className="w-9 h-9 rounded-full object-cover"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = buildDefaultAvatarUrl({ id: user.id, email: user.email, fullName: user.fullName });
                      }}
                    />
                    <div>
                      <p className="text-sm font-medium text-neutral-900 dark:text-white">
                        {user.fullName || "(no name)"}
                      </p>
                      <p className="text-xs text-neutral-500">{user.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${user.isActive ? getStatusStyle("active") : getStatusStyle("inactive")}`}>
                      {user.isActive ? "Active" : "Inactive"}
                    </span>
                    <p className="text-xs text-neutral-500 mt-1">{formatDate(user.createdAt)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 dark:border-neutral-800">
            <h2 className="font-semibold text-neutral-900 dark:text-white">
              Recent Transactions
            </h2>
            <button
              onClick={() => navigate("/admin/transactions")}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              View all
            </button>
          </div>
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {loadingTransactions ? (
              <div className="px-5 py-8 text-center text-sm text-neutral-500">Loading...</div>
            ) : recentTransactions.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
                No transactions yet
              </div>
            ) : (
              recentTransactions.slice(0, 5).map((tx) => (
                <div key={tx.id} className="flex items-center justify-between px-5 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                  <div>
                    <p className="text-sm font-medium text-neutral-900 dark:text-white">
                      {tx.userName || tx.userFullName || "User"}
                    </p>
                    <p className="text-xs text-neutral-500 capitalize">
                      {tx.type} {tx.method ? `• ${tx.method}` : ""} • {formatDate(tx.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${getTransactionTypeColor(tx.type)}`}>
                      {String(tx.type).toLowerCase() === "withdraw" || String(tx.type).toLowerCase() === "payment" ? "-" : "+"}
                      {formatCurrency(tx.amount)}
                    </p>
                    <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${getStatusStyle(tx.status)}`}>
                      {tx.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
