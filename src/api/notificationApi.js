// src/api/notificationApi.js
import axiosClient from "./axios";

const notificationApi = {
  // Get notifications with pagination
  getNotifications(params = {}) {
    return axiosClient.get("/api/Notification", { params });
  },

  // Get notification summary (unread count + recent)
  getSummary() {
    return axiosClient.get("/api/Notification/summary");
  },

  // Mark notifications as read
  markAsRead(notificationIds) {
    return axiosClient.post("/api/Notification/mark-read", {
      notificationIds,
      markAll: false
    });
  },

  // Mark all notifications as read
  markAllAsRead() {
    return axiosClient.post("/api/Notification/mark-all-read");
  },

  // Delete a notification
  delete(notificationId) {
    return axiosClient.delete(`/api/Notification/${notificationId}`);
  },
};

export default notificationApi;
