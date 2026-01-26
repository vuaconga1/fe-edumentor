// src/api/studentApi.js
import axiosClient from "./axios";

const studentApi = {
  // Lấy profile user hiện tại (student / mentor / admin đều dùng chung)
  getProfile() {
    return axiosClient.get("/api/User/profile");
  },

  // Dashboard tổng hợp (nếu backend có, nếu chưa thì comment)
  getDashboard() {
    return axiosClient.get("/api/student/dashboard");
  },

  // Upcoming sessions (nếu backend có)
  getUpcomingSessions({ pageNumber = 1, pageSize = 5 } = {}) {
    return axiosClient.get("/api/student/sessions/upcoming", {
      params: { pageNumber, pageSize },
    });
  },

  // Recommended mentors (nếu backend có)
  getRecommendedMentors({ pageNumber = 1, pageSize = 5 } = {}) {
    return axiosClient.get("/api/student/mentors/recommended", {
      params: { pageNumber, pageSize },
    });
  },
};

export default studentApi;
