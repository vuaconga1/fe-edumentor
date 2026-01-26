// src/api/communityApi.js
import axiosClient from "./axios";
// ^ dùng axios instance của project mày (có interceptor token)

const communityApi = {
  // Feed (For You) + search + filter + paging
  getPosts(params = {}) {
    return axiosClient.get("/api/Community/posts", { params });
  },

  // Recent (sidebar/trending)
  getRecent() {
    return axiosClient.get("/api/Community/posts/recent");
  },

  // My Posts
  getMyPosts(params = {}) {
    return axiosClient.get("/api/Community/posts/my-posts", { params });
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
  getComments(postId) {
    return axiosClient.get(`/api/Community/posts/${postId}/comments`);
  },

  createComment(postId, payload) {
    return axiosClient.post(`/api/Community/posts/${postId}/comments`, payload);
  },

  deleteComment(commentId) {
    return axiosClient.delete(`/api/Community/comments/${commentId}`);
  },
};

export default communityApi;
