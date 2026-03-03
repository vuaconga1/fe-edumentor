// src/api/communityApi.js
import axiosClient from "./axios";
// ^ dùng axios instance của project mày (có interceptor token)

const communityApi = {
  // Feed (For You) + search + filter + paging
  getPosts(params = {}) {
    return axiosClient.get("/api/Community/posts", { params });
  },

  // Following tab
  getFollowingPosts(params = {}) {
    return axiosClient.get("/api/Community/posts/following", { params });
  },

  // Recent (sidebar/trending)
  getRecent() {
    return axiosClient.get("/api/Community/posts/recent");
  },

  // Trending hashtags with post counts
  getTrendingHashtags(count = 10) {
    return axiosClient.get("/api/Community/trending-hashtags", { params: { count } });
  },

  // My Posts
  getMyPosts(params = {}) {
    return axiosClient.get("/api/Community/posts/my-posts", { params });
  },

  // Posts by a specific user
  getUserPosts(userId, params = {}) {
    return axiosClient.get("/api/Community/posts", {
      params: { ...params, authorId: userId }
    });
  },

  // Post detail
  getPostDetail(postId) {
    return axiosClient.get(`/api/Community/posts/${postId}`);
  },

  // Create post (CreatePostDto)
  createPost(payload) {
    return axiosClient.post("/api/Community/posts", payload);
  },

  // Update post (UpdatePostDto)
  updatePost(postId, payload) {
    return axiosClient.put(`/api/Community/posts/${postId}`, payload);
  },

  deletePost(postId) {
    return axiosClient.delete(`/api/Community/posts/${postId}`);
  },

  // Comments
  getComments(postId, pageNumber = 1, pageSize = 10) {
    return axiosClient.get(`/api/Community/posts/${postId}/comments`, {
      params: { pageNumber, pageSize }
    });
  },

  createComment(postId, payload) {
    return axiosClient.post(`/api/Community/posts/${postId}/comments`, payload);
  },

  deleteComment(commentId) {
    return axiosClient.delete(`/api/Community/comments/${commentId}`);
  },

  // Proposals
  sendProposal(postId, payload) {
    return axiosClient.post(`/api/Community/posts/${postId}/proposals`, payload);
  },

  getProposalsByPost(postId) {
    return axiosClient.get(`/api/Community/posts/${postId}/proposals`);
  },

  acceptProposal(proposalId) {
    return axiosClient.post(`/api/Community/proposals/${proposalId}/accept`);
  },

  rejectProposal(proposalId) {
    return axiosClient.post(`/api/Community/proposals/${proposalId}/reject`);
  },

  getMyProposals() {
    return axiosClient.get("/api/Community/proposals/my-proposals");
  },

  getReceivedProposals() {
    return axiosClient.get("/api/Community/proposals/received");
  },

  // Follow
  followUser(userId) {
    return axiosClient.post(`/api/Community/follow/${userId}`);
  },

  unfollowUser(userId) {
    return axiosClient.delete(`/api/Community/follow/${userId}`);
  },

  isFollowing(userId) {
    return axiosClient.get(`/api/Community/follow/${userId}/status`);
  },

  // Get followers list for a user
  getFollowers(userId) {
    return axiosClient.get(`/api/Community/follow/${userId}/followers`);
  },

  // Get following list for a user
  getFollowing(userId) {
    return axiosClient.get(`/api/Community/follow/${userId}/following`);
  },

  // ========== Categories & Hashtags ==========

  // Get all categories
  getCategories() {
    return axiosClient.get("/api/Category");
  },

  // Get hashtags by category
  getHashtagsByCategory(categoryId) {
    return axiosClient.get(`/api/Category/${categoryId}/hashtags`);
  },

  // Search/get all hashtags
  getHashtags(keyword = "") {
    return axiosClient.get("/api/hashtags", { params: { keyword } });
  },

  // ========== File Upload ==========

  // Upload files for community post (max 2 files)
  uploadPostFiles(files) {
    const formData = new FormData();
    files.forEach(file => formData.append("files", file));
    return axiosClient.post("/api/File/upload/community-post", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
  },
};

export default communityApi;
