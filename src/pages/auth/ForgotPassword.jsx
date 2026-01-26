import { useState } from "react";
import { Link } from "react-router-dom";
import authApi from "../../api/authAPI"; // <-- thêm

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const [isLoading, setIsLoading] = useState(false); // <-- thêm
  const [error, setError] = useState(""); // <-- thêm
  const [serverMessage, setServerMessage] = useState(""); // <-- thêm (nếu backend trả message)

  const extractServerMessage = (err) => {
    const data = err?.response?.data;
    if (!data) return err?.message || "Request failed.";

    if (typeof data?.message === "string") return data.message;

    if (data?.errors && typeof data.errors === "object") {
      const firstKey = Object.keys(data.errors)[0];
      const firstMsg = Array.isArray(data.errors[firstKey])
        ? data.errors[firstKey][0]
        : String(data.errors[firstKey]);
      return firstMsg || "Validation error.";
    }

    if (typeof data?.title === "string") return data.title;

    return "Request failed.";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setServerMessage("");

    if (!email) {
      setError("Please enter your email.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await authApi.forgotPassword(email); // POST /api/Auth/forgot-password

      const data = res?.data?.data ?? res?.data;
      const msg =
        data?.message ||
        "If an account with that email exists, a password reset link has been sent.";

      setServerMessage(msg);
      setSubmitted(true);
    } catch (err) {
      setError(extractServerMessage(err));
    } finally {
      setIsLoading(false);
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
        {/* ForgotPassword Card */}
        <div className="w-full max-w-xs sm:max-w-md">
          {/* Logo */}
          <div className="flex items-center justify-center mb-8">
            <img
              src="/edumentor-logo.png"
              alt="EduMentor Logo"
              className="w-10 h-10 object-contain mr-3"
            />
            <span className="text-2xl font-bold text-white drop-shadow-lg">
              EduMentor
            </span>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-2xl p-4 sm:p-8">
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
              Forgot Your Password?
            </h2>

            {/* Error message */}
            {error && (
              <div className="text-red-500 text-center mb-4 text-sm">
                {error}
              </div>
            )}

            {submitted ? (
              <div className="text-gray-700 text-center mb-4 text-sm">
                {serverMessage ||
                  "If an account with that email exists, a password reset link has been sent."}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError("");
                    }}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-[#23272F] text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập email của bạn"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-2 px-4 text-white font-semibold rounded-lg transition ${isLoading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                    }`}
                >
                  {isLoading ? "Sending..." : "Send Reset Link"}
                </button>
              </form>
            )}

            <div className="mt-6 text-center">
              <Link to="/login" className="text-blue-600 hover:underline">
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
