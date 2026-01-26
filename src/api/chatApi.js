import axiosClient from "./axios";

const chatApi = {
  getConversations() {
    return axiosClient.get("/api/Chat/conversations");
  },

  // IMPORTANT: swagger requires participantId
  ensureConversation(participantId, { requestId = null, orderId = null } = {}) {
    return axiosClient.post("/api/Chat/conversations", {
      participantId,
      requestId,
      orderId,
    });
  },

  getMessages(conversationId, { pageNumber = 1, pageSize = 30 } = {}) {
    return axiosClient.get(`/api/Chat/conversations/${conversationId}/messages`, {
      params: { pageNumber, pageSize },
    });
  },

  sendMessage(conversationId, content) {
    return axiosClient.post(`/api/Chat/conversations/${conversationId}/messages`, {
      content,
    });
  },
};

export default chatApi;