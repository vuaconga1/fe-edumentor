// src/components/notification/NotificationDropdown.jsx
import React, { useEffect, useState, useRef } from 'react';
import { HiBell, HiCheck, HiTrash, HiExternalLink } from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';
import notificationApi from '../../api/notificationApi';

const NOTIFICATION_ICONS = {
  System: "🔔",
  RequestCreated: "📝",
  RequestAssigned: "✅",
  ProposalCreated: "📨",
  ProposalAccepted: "🎉",
  OrderStarted: "🚀",
  OrderCompleted: "✅",
  OrderDisputed: "⚠️",
  WalletTransaction: "💰",
  RelevantPost: "📢",
};

const NOTIFICATION_COLORS = {
  System: "gray",
  RequestCreated: "blue",
  RequestAssigned: "blue",
  ProposalCreated: "purple",
  ProposalAccepted: "green",
  OrderStarted: "blue",
  OrderCompleted: "green",
  OrderDisputed: "red",
  WalletTransaction: "orange",
  RelevantPost: "indigo",
};

const NotificationDropdown = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  // Fetch notifications summary
  const fetchSummary = async () => {
    try {
      const res = await notificationApi.getSummary();
      const data = res?.data?.data;
      setUnreadCount(data?.totalUnread || 0);
      setNotifications(data?.recentNotifications || []);
    } catch (err) {
      console.log("Fetch notification summary failed:", err);
    }
  };

  useEffect(() => {
    fetchSummary();
    // Poll every 30 seconds
    const interval = setInterval(fetchSummary, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationApi.markAsRead([notificationId]);
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.log("Mark as read failed:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.log("Mark all as read failed:", err);
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }

    // Navigate based on notification type
    const data = notification.data ? JSON.parse(notification.data) : {};
    switch (notification.type) {
      case "RequestCreated":
      case "RequestAccepted":
      case "RequestRejected":
        navigate("/mentor/requests");
        break;
      case "ProposalCreated":
      case "ProposalAccepted":
      case "ProposalRejected":
        navigate("/student/my-requests");
        break;
      case "OrderStarted":
      case "OrderCompleted":
        navigate("/student/orders");
        break;
      case "WalletTransaction":
        navigate("/student/wallet");
        break;
      default:
        break;
    }
    setIsOpen(false);
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return "";
    const now = new Date();
    const date = new Date(dateString);
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;
    return date.toLocaleDateString("en-US");
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
      >
        <HiBell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
            <h3 className="font-semibold text-neutral-900 dark:text-white">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center">
                <HiBell className="w-10 h-10 text-neutral-300 dark:text-neutral-600 mx-auto mb-2" />
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  No new notifications
                </p>
              </div>
            ) : (
              notifications.map((notification) => {
                const icon = NOTIFICATION_ICONS[notification.type] || "🔔";
                const color = NOTIFICATION_COLORS[notification.type] || "gray";

                return (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`flex items-start gap-3 px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer transition-colors ${
                      !notification.isRead ? "bg-primary-50/50 dark:bg-primary-900/10" : ""
                    }`}
                  >
                    <span className="text-xl flex-shrink-0">{icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!notification.isRead ? "font-medium" : ""} text-neutral-900 dark:text-white`}>
                        {notification.title}
                      </p>
                      {notification.body && (
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-2">
                          {notification.body}
                        </p>
                      )}
                      <p className="text-xs text-neutral-400 mt-1">
                        {formatTimeAgo(notification.createdAt)}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <span className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 mt-2"></span>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-neutral-200 dark:border-neutral-800">
              <button
                onClick={() => { navigate("/notifications"); setIsOpen(false); }}
                className="w-full text-center text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
