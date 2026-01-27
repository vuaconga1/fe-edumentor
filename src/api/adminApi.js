import axiosClient from "./axios";

// Role mapping: string -> number (for backend enum)
const roleToNumber = {
  'student': 0,
  'mentor': 1,
  'admin': 2
};

// Helper to convert role string to enum number
function mapRoleForAPI(roleString) {
  const normalized = roleString?.toLowerCase();
  return roleToNumber[normalized] ?? 0; // default Student
}

const adminApi = {
  // ============ USERS MANAGEMENT ============

  // Get all users with pagination and filters
  getUsers({ pageNumber = 1, pageSize = 10, role = null, isActive = null, keyword = '' } = {}) {
    const params = { pageNumber, pageSize };
    if (role !== null && role !== 'all') params.role = role;
    if (isActive !== null && isActive !== 'all') params.isActive = isActive;
    if (keyword) params.keyword = keyword;

    return axiosClient.get("/api/admin/users", { params });
  },

  // Get user detail
  getUserDetail(userId) {
    return axiosClient.get(`/api/admin/users/${userId}`);
  },

  // Activate user
  activateUser(userId) {
    return axiosClient.post(`/api/admin/users/${userId}/activate`);
  },

  // Deactivate user
  deactivateUser(userId) {
    return axiosClient.post(`/api/admin/users/${userId}/deactivate`);
  },

  // Ban user
  banUser(userId, reason = "Violated community guidelines") {
    return axiosClient.post(`/api/admin/users/${userId}/ban`, { reason });
  },

  // Verify user
  verifyUser(userId) {
    return axiosClient.post(`/api/admin/users/${userId}/verify`);
  },

  // Create user (admin)
  createUser(data) {
    const payload = {
      email: data.email,
      password: data.password,
      fullName: data.fullName,
      role: mapRoleForAPI(data.role), // Convert to number: 0=Student, 1=Mentor, 2=Admin
      phone: data.phone || null,
      gender: data.gender || null,
      school: data.school || null,
      major: data.major || null,
      bio: data.bio || null,
      city: data.city || null,
      country: data.country || null,
      isVerified: data.isVerified ?? false,
      isActive: data.isActive ?? true
    };
    return axiosClient.post("/api/admin/users", payload);
  },

  // Update user (admin)
  updateUser(userId, data) {
    const payload = {
      email: data.email,
      fullName: data.fullName,
      phone: data.phone || null,
      gender: data.gender || null,
      school: data.school || null,
      major: data.major || null,
      bio: data.bio || null,
      city: data.city || null,
      country: data.country || null,
      isVerified: data.isVerified ?? false,
      isActive: data.isActive ?? true
    };
    // Note: Backend doesn't allow updating role
    return axiosClient.put(`/api/admin/users/${userId}`, payload);
  },

  // Delete user (admin)
  deleteUser(userId) {
    return axiosClient.delete(`/api/admin/users/${userId}`);
  },

  // ============ DASHBOARD ============

  getDashboard() {
    return axiosClient.get("/api/admin/dashboard");
  },

  // Alias for backward compatibility
  getAll() {
    return this.getDashboard();
  },

  // ============ CATEGORIES ============

  getCategories() {
    return axiosClient.get("/api/admin/categories");
  },

  getCategoryDetail(categoryId) {
    return axiosClient.get(`/api/admin/categories/${categoryId}`);
  },

  createCategory(data) {
    return axiosClient.post("/api/admin/categories", data);
  },

  updateCategory(categoryId, data) {
    return axiosClient.put(`/api/admin/categories/${categoryId}`, data);
  },

  deleteCategory(categoryId) {
    return axiosClient.delete(`/api/admin/categories/${categoryId}`);
  },

  // ============ CATEGORY-HASHTAG MAPPING ============

  // Get all category-hashtag mappings (grouped by category)
  getCategoryHashtagMappings() {
    return axiosClient.get("/api/admin/category-hashtags");
  },

  // Get hashtags for a specific category
  getHashtagsByCategory(categoryId) {
    return axiosClient.get(`/api/admin/categories/${categoryId}/hashtags`);
  },

  // Add a hashtag to a category
  addCategoryHashtagMapping(categoryId, hashtagId) {
    return axiosClient.post("/api/admin/category-hashtags", { categoryId, hashtagId });
  },

  // Remove a hashtag from a category
  removeCategoryHashtagMapping(categoryId, hashtagId) {
    return axiosClient.delete("/api/admin/category-hashtags", { 
      data: { categoryId, hashtagId } 
    });
  },


  // ============ TRANSACTIONS ============

  getTransactions({ pageNumber = 1, pageSize = 10, status = null, type = null } = {}) {
    const params = { pageNumber, pageSize };
    if (status && status !== "all") params.status = status;
    if (type && type !== "all") params.type = type;

    return axiosClient.get("/api/admin/transactions", { params });
  },

  verifyTransaction(transactionId, { approve, note = null }) {
    return axiosClient.post(`/api/admin/transactions/${transactionId}/verify`, {
      approve,
      note
    });
  },

  // ============ REPORTS ============

  getReports({ pageNumber = 1, pageSize = 10, status = null } = {}) {
    const params = { pageNumber, pageSize };
    if (status !== null && status !== 'all') params.status = status;
    return axiosClient.get("/api/admin/reports", { params });
  },

  getReportDetail(reportId) {
    return axiosClient.get(`/api/admin/reports/${reportId}`);
  },

  // Handle report (unified - resolve or dismiss)
  handleReport(reportId, { status, banUser = false }) {
    return axiosClient.post(`/api/admin/reports/${reportId}/handle`, { status, banUser });
  },

  // ============ ORDERS ============

  getOrders({ pageNumber = 1, pageSize = 10, status = null, keyword = null } = {}) {
    const params = { pageNumber, pageSize };
    if (status && status !== "all") params.status = status;
    if (keyword) params.keyword = keyword;
    return axiosClient.get("/api/admin/orders", { params });
  },

  getOrderDetail(orderId) {
    return axiosClient.get(`/api/admin/orders/${orderId}`);
  },

  updateOrderStatus(orderId, { status, reason = null }) {
    return axiosClient.put(`/api/admin/orders/${orderId}/status`, { status, reason });
  },

  refundOrder(orderId, { reason, refundPercentage = 100 }) {
    return axiosClient.post(`/api/admin/orders/${orderId}/refund`, { reason, refundPercentage });
  },

  // ============ REQUESTS ============

  getRequests({ pageNumber = 1, pageSize = 10, status = null, keyword = null } = {}) {
    const params = { pageNumber, pageSize };
    if (status && status !== "all") params.status = status;
    if (keyword) params.keyword = keyword;
    return axiosClient.get("/api/admin/requests", { params });
  },

  deleteRequest(requestId, reason = "Violated policies") {
    return axiosClient.delete(`/api/admin/requests/${requestId}`, { params: { reason } });
  },

  // ============ PROPOSALS ============

  getProposals({ pageNumber = 1, pageSize = 10, status = null, keyword = null } = {}) {
    const params = { pageNumber, pageSize };
    if (status && status !== "all") params.status = status;
    if (keyword) params.keyword = keyword;
    return axiosClient.get("/api/admin/proposals", { params });
  },

  deleteProposal(proposalId, reason = "Violated policies") {
    return axiosClient.delete(`/api/admin/proposals/${proposalId}`, { params: { reason } });
  },

  // ============ HASHTAGS ============

  getHashtags({ pageNumber = 1, pageSize = 10, keyword = null } = {}) {
    const params = { pageNumber, pageSize };
    if (keyword) params.keyword = keyword;
    return axiosClient.get("/api/admin/hashtags", { params });
  },

  createHashtag(name) {
    return axiosClient.post("/api/admin/hashtags", { name });
  },

  deleteHashtag(hashtagId) {
    return axiosClient.delete(`/api/admin/hashtags/${hashtagId}`);
  },

  // ============ REVIEWS ============

  getReviews({ pageNumber = 1, pageSize = 10, keyword = null } = {}) {
    const params = { pageNumber, pageSize };
    if (keyword) params.keyword = keyword;
    return axiosClient.get("/api/admin/reviews", { params });
  },

  deleteReview(reviewId, reason = "Inappropriate content") {
    return axiosClient.delete(`/api/admin/reviews/${reviewId}`, { params: { reason } });
  },

  // ============ WALLETS ============

  getWallets({ pageNumber = 1, pageSize = 10, keyword = null } = {}) {
    const params = { pageNumber, pageSize };
    if (keyword) params.keyword = keyword;
    return axiosClient.get("/api/admin/wallets", { params });
  },

  getWalletDetail(walletId) {
    return axiosClient.get(`/api/admin/wallets/${walletId}`);
  },

  // ============ COMMUNITY POSTS ============

  getPosts({ pageNumber = 1, pageSize = 10, keyword = null } = {}) {
    const params = { pageNumber, pageSize };
    if (keyword) params.keyword = keyword;
    return axiosClient.get("/api/admin/posts", { params });
  },

  deletePost(postId, reason = "Violated policies") {
    return axiosClient.delete(`/api/admin/posts/${postId}`, { params: { reason } });
  },

  hidePost(postId, reason = "Violated policies") {
    return axiosClient.post(`/api/admin/posts/${postId}/hide`, { reason });
  },

  // ============ COMMUNITY COMMENTS ============

  getComments({ pageNumber = 1, pageSize = 10, keyword = null } = {}) {
    const params = { pageNumber, pageSize };
    if (keyword) params.keyword = keyword;
    return axiosClient.get("/api/admin/comments", { params });
  },

  deleteComment(commentId, reason = "Violated policies") {
    return axiosClient.delete(`/api/admin/comments/${commentId}`, { params: { reason } });
  },

  // ============ MENTOR APPLICATIONS ============

  getMentorApplications({ pageNumber = 1, pageSize = 10, status = null } = {}) {
    const params = { pageNumber, pageSize };
    if (status && status !== "all") params.status = status;
    return axiosClient.get("/api/admin/mentor-applications", { params });
  },

  getMentorApplicationDetail(userId) {
    return axiosClient.get(`/api/admin/mentor-applications/${userId}`);
  },

  approveMentorApplication(userId) {
    return axiosClient.post(`/api/admin/mentor-applications/${userId}/approve`);
  },

  rejectMentorApplication(userId, reason) {
    return axiosClient.post(`/api/admin/mentor-applications/${userId}/reject`, { reason });
  }
};

export default adminApi;

