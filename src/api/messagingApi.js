import axiosClient from "./axios";

const messagingApi = {
  // 1) Lấy danh sách conversations của user hiện tại
  getConversations() {
    return axiosClient.get("/api/messaging/conversations");
  },

  // 2) Lấy messages của 1 conversation (paging optional)
  getMessages(conversationId, { pageNumber = 1, pageSize = 30 } = {}) {
    return axiosClient.get(`/api/messaging/conversations/${conversationId}/messages`, {
      params: { pageNumber, pageSize },
    });
  },

  // 3) Tạo mới hoặc lấy conversation đã tồn tại giữa currentUser và mentorId
  // Backend nên implement: "find existing 1-1 convo, nếu chưa có thì create"
  ensureConversation(mentorId) {
    return axiosClient.post("/api/messaging/conversations/ensure", { mentorId });
  },

  // 4) Gửi message
  sendMessage(conversationId, content) {
    return axiosClient.post(`/api/messaging/conversations/${conversationId}/messages`, {
      content,
    });
  },
};

export default messagingApi;
