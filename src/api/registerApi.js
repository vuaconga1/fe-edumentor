import axiosClient from "./axios";

const registerAPI = {
  register(data) {
    return axiosClient.post("/api/Auth/register", data);
  }
};

export default registerAPI;