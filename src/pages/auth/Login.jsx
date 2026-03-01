import React, { useState } from 'react';
import { Link, useSearchParams, useLocation } from 'react-router-dom';
import authAPI from '../../api/authAPI';
import { jwtDecode } from "jwt-decode";
import { HiEye, HiEyeOff } from "react-icons/hi";

export default function FlowbiteLogin() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  // If redirected from a protected route, go back there after login
  const fromPath = location.state?.from?.pathname;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [googleError, setGoogleError] = useState('');
  const [showResend, setShowResend] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState('');

  // Check for Google OAuth error or token from URL
  React.useEffect(() => {
    const urlError = searchParams.get('error');
    const cancelled = searchParams.get('cancelled');
    const token = searchParams.get('token');
    const refreshToken = searchParams.get('refreshToken');

    if (cancelled === 'true') {
      setGoogleError('Google login was cancelled. Please try again.');
    } else if (urlError) {
      setGoogleError(decodeURIComponent(urlError));
    }

    if (token) {
      localStorage.setItem('token', token);
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }
      // Decode and redirect
      try {
        const payload = jwtDecode(token);
        const roleRaw = payload.role || payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
        const roleNum = Number(roleRaw);
        const roleStr = String(roleRaw).toLowerCase();

        if (roleNum === 0 || roleStr === "student") {
          window.location.href = "/student";
        } else if (roleNum === 1 || roleStr === "mentor") {
          window.location.href = "/mentor";
        } else if (roleNum === 2 || roleStr === "admin") {
          window.location.href = "/admin";
        } else {
          window.location.href = "/student";
        }
      } catch {
        window.location.href = "/student";
      }
    }
  }, [searchParams]);

  const handleGoogleLogin = () => {
    setGoogleError('');
    // Redirect to backend Google OAuth endpoint
    window.location.href = `${import.meta.env.VITE_API_BASE_URL}/api/Auth/google-login`;
  };

  const handleResendVerification = async () => {
    if (!email) {
      setError('Please enter your email to resend verification');
      return;
    }
    setResendLoading(true);
    setResendSuccess('');
    try {
      await authAPI.resendVerification(email);
      setResendSuccess('Verification email has been resent! Please check your inbox.');
      setShowResend(false);
    } catch (err) {
      setError('Failed to resend verification email. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setShowResend(false);
    setResendSuccess('');

    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    try {
      const res = await authAPI.login({ email, password });

      const token =
        res.data?.data?.token ||
        res.data?.data?.accessToken ||
        res.data?.token;

      if (!token) throw new Error("No token returned from API");
      localStorage.setItem("token", token);

      // role from response or decode token
      let roleRaw = res.data?.data?.role ?? res.data?.role;
      if (roleRaw === undefined || roleRaw === null) {
        const payload = jwtDecode(token);
        roleRaw =
          payload.role ||
          payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
      }

      // normalize
      const roleNum = Number(roleRaw);
      const roleStr = String(roleRaw).toLowerCase();

      if (roleNum === 0 || roleStr === "student") {
        window.location.href = fromPath || "/student";
      } else if (roleNum === 1 || roleStr === "mentor") {
        window.location.href = fromPath || "/mentor";
      } else if (roleNum === 2 || roleStr === "admin") {
        window.location.href = fromPath || "/admin";
      } else {
        window.location.href = fromPath || "/student";
      }

    } catch (err) {
      const status = err.response?.status;
      const message = err.response?.data?.message || err.response?.data?.Message;

      if (status === 401) {
        setError("Invalid email or password");
      } else if (status === 403) {
        // Check if it's about email verification
        if (message?.toLowerCase().includes('verify')) {
          setError("Please verify your email.");
          setShowResend(true);
        } else if (message?.toLowerCase().includes('locked')) {
          setError("Account has been locked. Please contact support.");
        } else {
          setError(message || "Access denied");
        }
      } else if (message) {
        setError(message);
      } else {
        setError("Server error. Please try again later.");
      }
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('/background.png')`,
        }}
      >
        <div className="absolute inset-0 bg-black/30"></div>
      </div>

      {/* Content */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        {/* Login Card */}
        <div className="w-full max-w-xs sm:max-w-md">
          {/* Logo */}
          <div className="flex items-center justify-center mb-8">
            <a className="flex items-center gap-2 group" href="/" data-discover="true">
              <img className="h-8 sm:h-10 transition-transform group-hover:scale-105" alt="EduMentor Logo" src="/edumentor-logo.png" />
              <span className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-sky-500 bg-clip-text text-transparent">EduMentor</span>
            </a>
          </div>

          {/* Login Form Card */}
          <div className="bg-white rounded-2xl shadow-2xl p-4 sm:p-8">
            <h1 className="text-2xl font-bold text-gray-900 text-center mb-8">
              Sign in
            </h1>

            {/* Success Message */}
            {resendSuccess && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700 flex items-center">
                  <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {resendSuccess}
                </p>
              </div>
            )}

            {/* Google Login Button */}
            <div className="mb-4">
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-lg py-3 bg-white hover:bg-gray-50 transition font-medium text-gray-700 shadow-sm"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                Sign in with Google
              </button>
            </div>

            {/* Google Error Message */}
            {googleError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600 flex items-center">
                  <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  {googleError}
                </p>
              </div>
            )}

            <div className="flex items-center mb-6">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="px-3 text-gray-400 text-sm">Or</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                />
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <HiEyeOff className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <HiEye className="h-5 w-5" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              {/* Account Error Message - Below Password */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600 flex items-center justify-between">
                    <span>{error}</span>
                    {showResend && (
                      <button
                        type="button"
                        onClick={handleResendVerification}
                        disabled={resendLoading}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium underline disabled:opacity-50 ml-2 whitespace-nowrap"
                      >
                        {resendLoading ? 'Sending...' : 'Resend it'}
                      </button>
                    )}
                  </p>
                </div>
              )}

              {/* Forgot Password */}
              <div className="flex items-center justify-end">
                <Link to="/forgot-password" className="text-blue-600 hover:underline text-sm">
                  Forgot password?
                </Link>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-blue-600 text-white font-medium py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 transition"
              >
                Sign In
              </button>

              {/* Sign Up Link */}
              <div className="text-center">
                <a href="/register" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  Don't have an account? Sign up
                </a>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}