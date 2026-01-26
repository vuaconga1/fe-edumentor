import axiosClient from "./axios";

const userApi = {
  getAll() {
    return axiosClient.get("/api/admin/users");
  },

  create(data) {
    return axiosClient.post("/admin/users", data);
  }
};

export default userApi;

