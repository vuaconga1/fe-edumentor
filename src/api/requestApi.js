// src/api/requestApi.js
import axiosClient from "./axios";

const requestApi = {
  // ============ REQUESTS (Direct booking) ============

  // Get all requests with filters
  getRequests(params = {}) {
    return axiosClient.get("/api/Request", { params });
  },

  // Get request detail by ID
  getById(requestId) {
    return axiosClient.get(`/api/Request/${requestId}`);
  },

  // Get current user's requests (students see their sent, mentors see received)
  getMyRequests(pageNumber = 1, pageSize = 10) {
    return axiosClient.get("/api/Request/my-requests", {
      params: { pageNumber, pageSize }
    });
  },

  // Get requests sent to me (for mentors)
  getReceivedRequests(pageNumber = 1, pageSize = 10) {
    return axiosClient.get("/api/Request/received", {
      params: { pageNumber, pageSize }
    });
  },

  // Create a new request (students only) - sends to a specific mentor
  create(data) {
    // data: { mentorId, title, description, categoryId?, expectedBudget?, expectedHours? }
    return axiosClient.post("/api/Request", data);
  },

  // Update a request
  update(requestId, data) {
    return axiosClient.put(`/api/Request/${requestId}`, data);
  },

  // Delete a request (student only)
  delete(requestId) {
    return axiosClient.delete(`/api/Request/${requestId}`);
  },

  // Close a request (student only)
  close(requestId) {
    return axiosClient.post(`/api/Request/${requestId}/close`);
  },

  // Accept a request (mentor only) - opens chat
  acceptRequest(requestId) {
    return axiosClient.post(`/api/Request/${requestId}/accept`);
  },

  // Reject a request (mentor only)
  rejectRequest(requestId, reason = null) {
    return axiosClient.post(`/api/Request/${requestId}/reject`, { reason });
  },

  // ============ PROPOSALS (Community posts) ============

  // Get proposal by ID
  getProposalById(proposalId) {
    return axiosClient.get(`/api/Proposal/${proposalId}`);
  },

  // Get proposals for a community post (student views proposals on their post)
  getProposalsByPost(postId) {
    return axiosClient.get(`/api/Community/posts/${postId}/proposals`);
  },

  // Get proposals sent by current mentor
  getMyProposals() {
    return axiosClient.get("/api/Community/proposals/my-proposals");
  },

  // Get proposals received on my posts (for students)
  getReceivedProposals() {
    return axiosClient.get("/api/Community/proposals/received");
  },

  // Create a new proposal (mentors only) - on a community post
  createProposal(postId, data) {
    // data: { price, estimatedHours?, message }
    return axiosClient.post(`/api/Community/posts/${postId}/proposals`, data);
  },

  // Update a proposal
  updateProposal(proposalId, data) {
    return axiosClient.put(`/api/Proposal/${proposalId}`, data);
  },

  // Cancel a proposal (mentor only)
  cancelProposal(proposalId) {
    return axiosClient.post(`/api/Proposal/${proposalId}/cancel`);
  },

  // Accept a proposal (student only) - fixed endpoint
  acceptProposal(proposalId) {
    return axiosClient.post(`/api/Proposal/${proposalId}/accept`);
  },

  // Reject a proposal (student only) - fixed endpoint
  rejectProposal(proposalId, reason = null) {
    return axiosClient.post(`/api/Proposal/${proposalId}/reject`, { reason });
  },
};

export default requestApi;
