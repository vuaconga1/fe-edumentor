// src/api/reviewApi.js
import axiosClient from "./axios";

/**
 * Review & Report API
 * - GET /api/Mentor/{mentorId}/reviews - Get mentor reviews
 * - GET /api/Mentor/{mentorId}/reviews/summary - Get mentor review summary
 * - POST /api/User/reports - Create a report
 */
const reviewApi = {
  // Get reviews for a mentor (paginated)
  getMentorReviews(mentorId, params = {}) {
    return axiosClient.get(`/api/Mentor/${mentorId}/reviews`, { params });
  },

  // Get review summary for a mentor
  getMentorReviewSummary(mentorId) {
    return axiosClient.get(`/api/Mentor/${mentorId}/reviews/summary`);
  },

  // Create a report (for review or user)
  createReport(data) {
    // data: { reportedUserId, reviewId?, orderId?, reason, details? }
    return axiosClient.post("/api/User/reports", data);
  },
};

export default reviewApi;
