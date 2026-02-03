// src/api/mentorApi.js
import axios from "axios";

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  paramsSerializer: {
    serialize: (params) => {
      const parts = [];
      Object.entries(params).forEach(([key, value]) => {
        if (value === null || value === undefined) return;
        if (Array.isArray(value)) {
          value.forEach(v => parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(v)}`));
        } else {
          parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
        }
      });
      return parts.join('&');
    }
  }
});

// attach token (nếu cần auth)
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const mentorApi = {
  // GET /api/Mentor/search
  search(params) {
    return axiosClient.get("/api/Mentor/search", { params });
  },

  // GET /api/Mentor/{mentorId}
  getById(mentorId) {
    return axiosClient.get(`/api/Mentor/${mentorId}`);
  },

  // GET /api/Mentor/{mentorId}/reviews
  getReviews(mentorId, params) {
    return axiosClient.get(`/api/Mentor/${mentorId}/reviews`, { params });
  },

  // GET /api/Mentor/{mentorId}/reviews/summary
  getReviewSummary(mentorId) {
    return axiosClient.get(`/api/Mentor/${mentorId}/reviews/summary`);
  },

  // ============ Mentor Application Flow ============

  // POST /api/Mentor/apply - Apply to become mentor
  apply(data) {
    return axiosClient.post("/api/Mentor/apply", data);
  },

  // GET /api/Mentor/application-status - Get current application status
  getApplicationStatus() {
    return axiosClient.get("/api/Mentor/application-status");
  },

  // POST /api/Mentor/confirm-switch - Confirm role switch to Mentor
  confirmSwitch() {
    return axiosClient.post("/api/Mentor/confirm-switch");
  },
};

export default mentorApi;

