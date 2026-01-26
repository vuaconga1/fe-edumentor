// src/config/menus.js
import {
  HiChartPie,
  HiUsers,
  HiClipboard,
  HiCollection,
  HiCurrencyDollar,
  HiSearch,
  HiUser,
} from "react-icons/hi";

// ADMIN MENU
export const ADMIN_MENU = [
  { label: "Dashboard", icon: HiChartPie, href: "/admin" },
  { label: "Users", icon: HiUsers, href: "/admin/users" },
  { label: "Transactions", icon: HiCurrencyDollar, href: "/admin/transactions" },
  { label: "Reports", icon: HiClipboard, href: "/admin/reports" },
];

// MENTOR MENU
export const MENTOR_MENU = [
  { label: "Dashboard", icon: HiChartPie, href: "/mentor" },
  { label: "Assigned Jobs", icon: HiCollection, href: "/mentor/jobs" },
  { label: "Earnings", icon: HiCurrencyDollar, href: "/mentor/earnings" },
  { label: "Profile", icon: HiUser, href: "/mentor/profile" },
];

// STUDENT MENU
export const STUDENT_MENU = [
  { label: "Find Mentor", icon: HiSearch, href: "/student/find" },
  { label: "My Requests", icon: HiClipboard, href: "/student/requests" },
  { label: "Payments", icon: HiCurrencyDollar, href: "/student/payments" },
  { label: "Profile", icon: HiUser, href: "/student/profile" },
];
