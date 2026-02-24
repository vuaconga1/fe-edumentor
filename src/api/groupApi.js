import axiosClient from "./axios";

const base = "/api/Group";

const groupApi = {
  // ============ GROUPS ============

  // Create a new group
  // Swagger: POST /api/Group  body: { name, description }
  createGroup(data) {
    const payload = {
      name: data?.name?.trim() || "",
      description: (data?.description ?? "").toString().trim()
    };
    return axiosClient.post(base, payload);
  },

  // Join a group using invite code
  // Swagger: POST /api/Group/join/{inviteCode}
  joinGroup(inviteCode) {
    return axiosClient.post(`${base}/join/${encodeURIComponent(inviteCode)}`);
  },

  // Get group details
  // Swagger: GET /api/Group/{groupId}
  getGroup(groupId) {
    return axiosClient.get(`${base}/${groupId}`);
  },

  // Get all groups for current user
  // Swagger: GET /api/Group/my-groups
  getMyGroups() {
    return axiosClient.get(`${base}/my-groups`);
  },

  // Get messages for a group
  // Swagger: GET /api/Group/{groupId}/messages?pageNumber=&pageSize=
  getGroupMessages(groupId, { pageNumber = 1, pageSize = 50 } = {}) {
    return axiosClient.get(`${base}/${groupId}/messages`, {
      params: { pageNumber, pageSize }
    });
  },

  // Leave a group
  // Swagger: POST /api/Group/{groupId}/leave
  leaveGroup(groupId) {
    return axiosClient.post(`${base}/${groupId}/leave`);
  },

  // Add member to group (by admin)
  // Swagger: POST /api/Group/{groupId}/members/{userId}
  addMember(groupId, userId) {
    return axiosClient.post(`${base}/${groupId}/members/${userId}`);
  },

  // Send message to group
  // Swagger: POST /api/Group/{groupId}/messages
  sendMessage(groupId, content, messageType = 0) {
    // MessageType: 0 = Text, 1 = File, 2 = Image, 3 = System
    return axiosClient.post(`${base}/${groupId}/messages`, {
      content,
      messageType
    });
  }
};

export default groupApi;
