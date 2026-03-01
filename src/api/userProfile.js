import axiosClient from "./axios";

const userProfileApi = {  getProfile() {
    return axiosClient.get("/api/User/profile");
  },

  // nếu ProfilePage đang gọi getAll() thì giữ luôn cho khỏi gãy
  getAll() {
    return axiosClient.get("/api/User/profile");
  },

  updateUserProfile(payload) {
    return axiosClient.put("/api/User/profile", payload);
  },

  // nếu chỗ khác đang gọi updateProfile thì giữ luôn
  updateProfile(payload) {
    return axiosClient.put("/api/User/profile", payload);
  },

  updateMentorProfile(payload) {
    return axiosClient.put("/api/User/mentor-profile", payload);
  },
};

export default userProfileApi;