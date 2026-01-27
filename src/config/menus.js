// src/config/menus.js
import {
  HiChartPie,
  HiUsers,
  HiClipboard,
  HiCollection,
  HiCurrencyDollar,
  HiSearch,
  HiUser,
  HiShoppingCart,
  HiTag,
  HiStar,
  HiChat,
  HiDocumentText,
  HiUserAdd,
  HiCash,
  HiLink,
} from "react-icons/hi";

// ADMIN MENU
export const ADMIN_MENU = [
  { label: "Dashboard", icon: HiChartPie, href: "/admin" },
  { label: "Users", icon: HiUsers, href: "/admin/users" },
  { label: "Mentor Applications", icon: HiUserAdd, href: "/admin/mentor-applications" },
  { label: "Categories", icon: HiCollection, href: "/admin/categories" },
  { label: "Hashtags", icon: HiTag, href: "/admin/hashtags" },
  { label: "Category-Hashtag Mapping", icon: HiLink, href: "/admin/category-hashtags" },
  { label: "Orders", icon: HiShoppingCart, href: "/admin/orders" },
  { label: "Requests", icon: HiDocumentText, href: "/admin/requests" },
  { label: "Proposals", icon: HiChat, href: "/admin/proposals" },
  { label: "Transactions", icon: HiCurrencyDollar, href: "/admin/transactions" },
  { label: "Wallets", icon: HiCash, href: "/admin/wallets" },
  { label: "Reviews", icon: HiStar, href: "/admin/reviews" },
  { label: "Posts", icon: HiClipboard, href: "/admin/posts" },
  { label: "Comments", icon: HiChat, href: "/admin/comments" },
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
  { label: "Dashboard", icon: HiChartPie, href: "/student" },
  { label: "Find Mentor", icon: HiSearch, href: "/student/find-mentor" },
  { label: "My Orders", icon: HiClipboard, href: "/student/orders" },
  { label: "My Wallet", icon: HiCurrencyDollar, href: "/student/wallet" },
  { label: "Profile", icon: HiUser, href: "/student/profile" },
];
