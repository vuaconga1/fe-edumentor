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
    return axiosClient.get("/api/Admin/categories");
  },

  getCategoryDetail(categoryId) {
    return axiosClient.get(`/api/Admin/categories/${categoryId}`);
  },

  createCategory(data) {
    return axiosClient.post("/api/Admin/categories", data);
  },

  updateCategory(categoryId, data) {
    return axiosClient.put(`/api/Admin/categories/${categoryId}`, data);
  },

  deleteCategory(categoryId) {
    return axiosClient.delete(`/api/Admin/categories/${categoryId}`);
  },


  // ============ TRANSACTIONS ============

  getTransactions({ pageNumber = 1, pageSize = 10, status = null, type = null } = {}) {
    const params = { pageNumber, pageSize };
    if (status && status !== "all") params.status = status;
    if (type && type !== "all") params.type = type;

    return axiosClient.get("/api/admin/transactions", { params });
  },

  getTransactionDetail(transactionId) {
    return axiosClient.get(`/api/admin/transactions/${transactionId}`);
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

  resolveReport(reportId, resolution) {
    return axiosClient.post(`/api/admin/reports/${reportId}/resolve`, { resolution });
  },

  rejectReport(reportId, reason) {
    return axiosClient.post(`/api/admin/reports/${reportId}/reject`, { reason });
  }
};

export default adminApi;
