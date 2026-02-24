import axiosClient from "./axios";

const aiChatApi = {
  /**
   * Send a message to AI chatbot
   * @param {string} content - Message content
   * @param {string} sessionId - Optional session ID for continuing a conversation
   */
  sendMessage(content, sessionId = null) {
    return axiosClient.post("/api/AIChat/message", {
      content,
      sessionId
    });
  },

  /**
   * Get all chat sessions for current user
   */
  getSessions() {
    return axiosClient.get("/api/AIChat/sessions");
  },

  /**
   * Get all messages in a specific session
   * @param {string} sessionId - Session ID
   */
  getSessionHistory(sessionId) {
    return axiosClient.get(`/api/AIChat/sessions/${sessionId}`);
  },

  /**
   * Delete a chat session
   * @param {string} sessionId - Session ID
   */
  deleteSession(sessionId) {
    return axiosClient.delete(`/api/AIChat/sessions/${sessionId}`);
  }
};

export default aiChatApi;
