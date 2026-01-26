// src/api/authApi.js
import axiosClient from "./axios";

// Role mapping: string -> number (for backend enum)
const roleToNumber = {
  student: 0,
  mentor: 1,
  admin: 2,
};

function mapRoleForAPI(roleString) {
  const normalized = roleString?.toLowerCase();
  return roleToNumber[normalized] ?? 0; // default Student
}

const authApi = {
  // ============ AUTH ============

  // POST /api/Auth/login
  // Body: { email, password, rememberMe }
  login(data) {
    return axiosClient.post("/api/Auth/login", {
      email: data?.email,
      password: data?.password,
      rememberMe: !!data?.rememberMe,
    });
  },

  // POST /api/Auth/register
  // Body: { email, password, confirmPassword, fullName, role }
  // role: 0=Student, 1=Mentor, 2=Admin
  register(data) {
    const payload = {
      email: data?.email,
      password: data?.password,
      confirmPassword: data?.confirmPassword,
      fullName: data?.fullName,
      role:
        typeof data?.role === "number" ? data.role : mapRoleForAPI(data?.role),
    };
    return axiosClient.post("/api/Auth/register", payload);
  },

  // POST /api/Auth/logout
  logout() {
    return axiosClient.post("/api/Auth/logout");
  },

  // POST /api/Auth/refresh-token
  // Body: { token, refreshToken }
  refreshToken({ token, refreshToken }) {
    return axiosClient.post("/api/Auth/refresh-token", { token, refreshToken });
  },

  // POST /api/Auth/change-password
  // Body: { currentPassword, newPassword, confirmNewPassword }
  changePassword({ currentPassword, newPassword, confirmNewPassword }) {
    return axiosClient.post("/api/Auth/change-password", {
      currentPassword,
      newPassword,
      confirmNewPassword,
    });
  },

  forgotPassword(email) {
    return axiosClient.post("/api/Auth/forgot-password", { email });
  },

  resetPassword({ token, email, newPassword, confirmPassword }) {
    return axiosClient.post("/api/Auth/reset-password", {
      token,
      email,
      newPassword,
      confirmPassword,
    });
  },

  // GET /api/Auth/verify-email?token=...&email=...
  verifyEmail({ token, email }) {
    return axiosClient.get("/api/Auth/verify-email", {
      params: { token, email },
    });
  },

  // POST /api/Auth/resend-verification
  // Body: { email }
  resendVerification(email) {
    return axiosClient.post("/api/Auth/resend-verification", { email });
  },
};

export default authApi;
