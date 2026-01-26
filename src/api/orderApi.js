// src/api/orderApi.js
import axiosClient from "./axios";

/**
 * Swagger:
 * - GET  /api/Order/my-orders/student
 * - GET  /api/Order/{orderId}
 * - POST /api/Order/{orderId}/reviews
 */
const orderApi = {
  getMyOrdersStudent(params = {}) {
    return axiosClient.get("/api/Order/my-orders/student", { params });
  },

  getOrderDetail(orderId) {
    return axiosClient.get(`/api/Order/${orderId}`);
  },

  createReview(orderId, payload) {
    // payload: { rating: int, comment?: string }
    return axiosClient.post(`/api/Order/${orderId}/reviews`, payload);
  },
};

export default orderApi;
