import axios from "axios";

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL, // .NET API base URL
  headers: {
    "Content-Type": "application/json",
  }
});

// Interceptor (optional nhưng nên có)
axiosClient.interceptors.request.use(
  config => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  error => Promise.reject(error)
);

export default axiosClient;
