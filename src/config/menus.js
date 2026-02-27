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
  HiCreditCard,
} from "react-icons/hi";
import { Home, MessageCircle, UsersRound, Wallet, Star, Search, History, FileText } from 'lucide-react';

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
  { label: "Bank Transfers", icon: HiCreditCard, href: "/admin/bank-transfers" },
  { label: "Reviews", icon: HiStar, href: "/admin/reviews" },
  // { label: "Posts", icon: HiClipboard, href: "/admin/posts" },
  // { label: "Comments", icon: HiChat, href: "/admin/comments" },
  { label: "Reports", icon: HiClipboard, href: "/admin/reports" },
];


// MENTOR MENU
export const MENTOR_MENU = [
  { label: "Home", href: "/mentor", icon: Home },
  { label: "My Proposals", href: "/mentor/requests", icon: FileText },
  { label: "Order History", href: "/mentor/orders", icon: History },
  { label: "Community", href: "/mentor/community", icon: UsersRound },
  { label: "Messaging", href: "/mentor/messaging", icon: MessageCircle },
  { label: "My Wallet", href: "/mentor/wallet", icon: Wallet },
  { label: "Reviews", href: "/mentor/reviews", icon: Star },
];

// STUDENT MENU
export const STUDENT_MENU = [
  { label: "Home", href: "/student", icon: Home },
  { label: "Find Mentor", href: "/student/find-mentor", icon: Search },
  { label: "My Requests", href: "/student/my-requests", icon: FileText },
  { label: "Community", href: "/student/community", icon: UsersRound },
  { label: "Messaging", href: "/student/messaging", icon: MessageCircle },
  { label: "My Wallet", href: "/student/wallet", icon: Wallet },
  { label: "Order History", href: "/student/orders", icon: History },
];
