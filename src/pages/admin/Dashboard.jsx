import React, { useEffect, useMemo, useState } from "react";
import {
  HiUsers,
  HiAcademicCap,
  HiUserGroup,
  HiCurrencyDollar,
  HiArrowUp,
  HiArrowDown,
} from "react-icons/hi";

import transactionsData from "../../mock/transactions.json";
import reportsData from "../../mock/reports.json";
import adminApi from "../../api/adminApi";


const Dashboard = () => {
  // ✅ thêm state dashboard
  const [dashboardData, setDashboardData] = useState(null);

  // ✅ state users phải nằm trong component
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // ===== fetch dashboard stats =====
  // ===== fetch dashboard stats =====
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState("");

  useEffect(() => {
  async function fetchUsers() {
    try {
      setLoadingUsers(true);

      // lấy nhiều một chút để đủ tính mentor/student/recent
      const res = await adminApi.getUsers({ pageNumber: 1, pageSize: 200 });

      const data = res?.data?.data ?? res?.data;

      // backend thường trả { items: [...] }
      const list = Array.isArray(data?.items) ? data.items : (Array.isArray(data) ? data : []);
      setUsers(list);
    } catch (err) {
      console.log("Failed to fetch users", err);
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  }

  fetchUsers();
}, []);


  // ====== TÍNH STATS TỪ USERS THẬT ======
  const totalUsers = users.length;

// ====== TÍNH STATS TỪ USERS THẬT ======
const normalizeRole = (role) => {
  if (role === null || role === undefined) return "";
  const r = String(role).toLowerCase();
  if (r === "0" || r.includes("student")) return "student";
  if (r === "1" || r.includes("mentor")) return "mentor";
  if (r === "2" || r.includes("admin")) return "admin";
  return r;
};

const mentors = users.filter(
  (u) => normalizeRole(u.role) === "mentor"
).length;

const students = users.filter(
  (u) => normalizeRole(u.role) === "student"
).length;


  // ====== MOCK TRANSACTIONS/REPORTS giữ nguyên ======
  const totalRevenue = transactionsData
    .filter((t) => t.type === "deposit" && t.status === "completed")
    .reduce((sum, t) => sum + t.amount, 0);

  const pendingReports = reportsData.filter((r) => r.status === "pending").length;

 const activeUsers = users.filter((u) => u.isActive).length;


  // ====== RECENT USERS: sort theo joined/createdAt rồi lấy 5 ======
  const recentUsers = useMemo(() => {
    const toTime = (u) => {
      // ưu tiên field ngày: joined -> createdAt -> created_at
      const d = u.joined || u.createdAt || u.created_at;
      const t = d ? new Date(d).getTime() : 0;
      return Number.isFinite(t) ? t : 0;
    };

    return [...users].sort((a, b) => toTime(b) - toTime(a)).slice(0, 5);
  }, [users]);

  const recentTransactions = transactionsData.slice(0, 5);

 const totalUsersFromApi = dashboardData?.totalUsers;
const revenueFromApi = dashboardData?.totalRevenue;

// mentors/students vẫn lấy từ users list như mày đang làm (vì dashboard api không trả)
const stats = [
  {
    label: "Total Users",
    value: totalUsersFromApi ?? totalUsers,   // <- ưu tiên API, fallback users.length
    change: "+12%",
    trend: "up",
    icon: HiUsers,
  },
  {
    label: "Mentors",
    value: mentors, // <- giữ nguyên như UI cũ
    change: "+8%",
    trend: "up",
    icon: HiAcademicCap,
  },
  {
    label: "Students",
    value: students, // <- giữ nguyên như UI cũ
    change: "+15%",
    trend: "up",
    icon: HiUserGroup,
  },
  {
    label: "Revenue",
    value: `${(((revenueFromApi ?? totalRevenue) || 0) / 1000000).toFixed(1)}M`,
    change: "+22%",
    trend: "up",
    icon: HiCurrencyDollar,
  },
];


  const formatCurrency = (amount) =>
    new Intl.NumberFormat("vi-VN").format(amount) + "đ";

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusColor = (status) => {
    const s = String(status).toLowerCase();
    const colors = {
      active:
        "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400",
      inactive:
        "text-neutral-600 bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-400",
      pending:
        "text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400",
      suspended:
        "text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400",
      completed:
        "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400",
      failed: "text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400",
    };
    return colors[s] || colors.inactive;
  };

  const getTransactionTypeColor = (type) => {
    const colors = {
      deposit: "text-emerald-600",
      withdraw: "text-red-600",
      payment: "text-blue-600",
      earning: "text-emerald-600",
      refund: "text-amber-600",
    };
    return colors[type] || "text-neutral-600";
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      {dashboardLoading && (
        <div className="p-4 text-sm text-neutral-500">
          Loading dashboard metrics...
        </div>
      )}

      {dashboardError && (
        <div className="p-4 text-sm text-red-500">
          {dashboardError}
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
          Dashboard
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 text-sm">
          Overview of platform metrics and activity
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className="p-5 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  {stat.label}
                </p>
                {/* ✅ render đúng value của từng card */}
                <p className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">
                  {stat.value}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-neutral-50 dark:bg-neutral-800">
                <stat.icon className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
              </div>
            </div>

            <div className="flex items-center gap-1 mt-3">
              {stat.trend === "up" ? (
                <HiArrowUp className="w-4 h-4 text-emerald-500" />
              ) : (
                <HiArrowDown className="w-4 h-4 text-red-500" />
              )}
              <span
                className={`text-sm font-medium ${stat.trend === "up" ? "text-emerald-500" : "text-red-500"
                  }`}
              >
                {stat.change}
              </span>
              <span className="text-sm text-neutral-500 ml-1">
                vs last month
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 text-center">
          {/* ✅ activeUsers thật */}
      <p className="text-3xl font-bold text-neutral-900 dark:text-white">
  {activeUsers}
</p>
<p className="text-sm text-neutral-500">Active Users</p>

        </div>
        <div className="p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 text-center">
          {/* mock pendingReports */}
          <p className="text-3xl font-bold text-neutral-900 dark:text-white">
            {dashboardData?.reportsCount ?? 0}
          </p>
          <p className="text-sm text-neutral-500">Pending Reports</p>

        </div>
        <div className="p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 text-center">
          {/* mock pendingTransactions */}
          <p className="text-3xl font-bold text-neutral-900 dark:text-white">
            {transactionsData.filter((t) => t.status === "pending").length}
          </p>
          <p className="text-sm text-neutral-500">Pending Transactions</p>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-neutral-200 dark:border-neutral-800">
            <h2 className="font-semibold text-neutral-900 dark:text-white">
              Recent Users
            </h2>
          </div>

          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {loadingUsers ? (
              <div className="px-5 py-6 text-sm text-neutral-500">Loading...</div>
            ) : users.length === 0 ? (
              <div className="px-5 py-6 text-sm text-neutral-500">No users</div>
            ) : (
              recentUsers.map((user) => (

                <div key={user.id} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        user.avatarUrl
                          ? user.avatarUrl.startsWith("http")
                            ? user.avatarUrl
                            : `https://localhost:7082${user.avatarUrl}`
                          : "/avatar-default.jpg"
                      }
                      alt={user.fullName || user.email}
                      className="w-9 h-9 rounded-full object-cover"
                    />
                    <div>
                      <p className="text-sm font-medium text-neutral-900 dark:text-white">
                        {user.fullName || "(no name)"}
                      </p>
                      <p className="text-xs text-neutral-500">{user.email}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${user.isActive ? getStatusColor("active") : getStatusColor("inactive")
                        }`}
                    >
                      {user.isActive ? "active" : "inactive"}
                    </span>
                    <p className="text-xs text-neutral-500 mt-1">{formatDate(user.createdAt)}</p>
                  </div>
                </div>
              ))
            )}

          </div>

          <a
            href="/admin/users"
            className="block text-center py-3 text-sm text-blue-600 hover:bg-neutral-50 dark:hover:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-800"
          >
            View All Users
          </a>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-neutral-200 dark:border-neutral-800">
            <h2 className="font-semibold text-neutral-900 dark:text-white">
              Recent Transactions
            </h2>
          </div>
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {recentTransactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between px-5 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-neutral-900 dark:text-white">
                    {tx.userName}
                  </p>
                  <p className="text-xs text-neutral-500 capitalize">
                    {tx.type} • {tx.method}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-medium ${getTransactionTypeColor(tx.type)}`}>
                    {tx.type === "withdraw" || tx.type === "payment" ? "-" : "+"}
                    {formatCurrency(tx.amount)}
                  </p>
                  <span
                    className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(
                      tx.status
                    )}`}
                  >
                    {tx.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <a
            href="/admin/transactions"
            className="block text-center py-3 text-sm text-blue-600 hover:bg-neutral-50 dark:hover:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-800"
          >
            View All Transactions
          </a>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
