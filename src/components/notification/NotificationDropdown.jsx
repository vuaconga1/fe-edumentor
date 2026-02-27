// src/components/notification/NotificationDropdown.jsx
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { HiBell } from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';
import notificationApi from '../../api/notificationApi';
import { useAuth } from '../../context/AuthContext';
import { startChatHub, on, isConnected } from '../../signalr/chatHub';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

const NotificationDropdown = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  // Fetch notifications summary
  const fetchSummary = useCallback(async () => {
    try {
      const res = await notificationApi.getSummary();
      const data = res?.data?.data;
      setUnreadCount(data?.totalUnread || 0);
      setNotifications(data?.recentNotifications || []);
    } catch (err) {
      console.log("Fetch notification summary failed:", err);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
    // Poll every 30 seconds as fallback
    const interval = setInterval(fetchSummary, 30000);
    return () => clearInterval(interval);
  }, [fetchSummary]);

  // Real-time notification via SignalR
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    // Auto-connect hub if not connected
    if (!isConnected()) {
      startChatHub(API_BASE, token).catch(() => {});
    }

    const cleanup = on('NewNotification', (payload) => {
      const notif = payload?.notification;
      if (notif) {
        setNotifications(prev => [notif, ...prev].slice(0, 10));
      }
      if (payload?.totalUnread != null) {
        setUnreadCount(payload.totalUnread);
      } else {
        setUnreadCount(prev => prev + 1);
      }
    });

    return cleanup;
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

  // Get base route based on user role
  const getBaseRoute = () => {
    const role = user?.role;
    if (role === 'Mentor' || role === 1 || role === '1') return '/mentor';
    if (role === 'Student' || role === 2 || role === '2') return '/student';
    if (window.location.pathname.startsWith('/mentor')) return '/mentor';
    return '/student';
  };

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }

    const data = notification.data ? JSON.parse(notification.data) : {};
    const baseRoute = getBaseRoute();
    const isMentor = baseRoute === '/mentor';
    
    // NotificationType enum: 0=System, 1=RequestCreated, 2=RequestAssigned, 3=RequestAccepted,
    // 4=RequestRejected, 5=ProposalCreated, 6=NewProposal, 7=ProposalAccepted, 8=ProposalRejected,
    // 9=OrderStarted, 10=OrderCompleted, 11=OrderDisputed, 12=WalletTransaction, 
    // 13=RelevantPost, 14=NewComment, 15=NewFollower
    const type = notification.type;
    
    // Request related (1, 2, 3, 4)
    if (type === 1 || type === 2 || type === 3 || type === 4 ||
        type === "RequestCreated" || type === "RequestAssigned" || 
        type === "RequestAccepted" || type === "RequestRejected") {
      navigate(isMentor ? "/mentor/requests" : "/student/my-requests");
    }
    // Proposal related (5, 6, 7, 8)
    else if (type === 5 || type === 6 || type === 7 || type === 8 || 
             type === "ProposalCreated" || type === "NewProposal" || 
             type === "ProposalAccepted" || type === "ProposalRejected") {
      navigate(isMentor ? "/mentor/requests" : "/student/my-requests");
    }
    // Order related (9, 10, 11)
    else if (type === 9 || type === 10 || type === 11 || 
             type === "OrderStarted" || type === "OrderCompleted" || type === "OrderDisputed") {
      navigate(`${baseRoute}/orders`);
    }
    // Wallet (12)
    else if (type === 12 || type === "WalletTransaction") {
      navigate(`${baseRoute}/wallet`);
    }
    // Community Post (13)
    else if (type === 13 || type === "RelevantPost") {
      if (data.postId) {
        navigate(`${baseRoute}/community?postId=${data.postId}`);
      } else {
        navigate(`${baseRoute}/community`);
      }
    }
    // New Comment (14)
    else if (type === 14 || type === "NewComment") {
      if (data.postId) {
        navigate(`${baseRoute}/community?postId=${data.postId}`);
      } else {
        navigate(`${baseRoute}/community`);
      }
    }
    // New Follower (15)
    else if (type === 15 || type === "NewFollower") {
      navigate(`${baseRoute}/profile`);
    }
    // System or unknown - go to profile
    else {
      navigate(`${baseRoute}/profile`);
    }
    
    setIsOpen(false);
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return "";
    // Ensure the date is parsed as UTC - append 'Z' if not present
    let utcString = dateString;
    if (!dateString.endsWith('Z') && !dateString.includes('+')) {
      utcString = dateString + 'Z';
    }
    const now = new Date();
    const date = new Date(utcString);
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
        <div className="absolute right-1/2 translate-x-1/2 sm:right-0 sm:translate-x-0 mt-2 w-[calc(100vw-2rem)] sm:w-96 max-w-96 bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden z-50">
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
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`flex items-start gap-3 px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer transition-colors ${
                    !notification.isRead ? "bg-primary-50/50 dark:bg-primary-900/10" : ""
                  }`}
                >
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
              ))
            )}
          </div>

    
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
