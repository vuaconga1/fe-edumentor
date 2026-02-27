import axiosClient from "./axios";

const userApi = {
  getAll() {
    return axiosClient.get("/api/admin/users");
  },

  create(data) {
    return axiosClient.post("/admin/users", data);
  },

  getById(userId) {
    return axiosClient.get(`/api/User/${userId}`);
  }
};

export default userApi;

