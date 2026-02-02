import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { HiEye, HiEyeOff } from "react-icons/hi";
import authApi from "../../api/authAPI";

export default function ResetPassword() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [tokenValid, setTokenValid] = useState(true);
    const [showPasswords, setShowPasswords] = useState({
        password: false,
        confirm: false
    });

    const token = searchParams.get("token");
    const email = searchParams.get("email");

    useEffect(() => {
        if (!token || !email) {
            setTokenValid(false);
            setError("Invalid reset link. Please request a new password reset.");
        }
    }, [token, email]);

    const toggleShowPassword = (field) => {
        setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
    };

    const getPasswordStrength = (pwd) => {
        if (!pwd) return { strength: 0, label: '', color: 'bg-gray-200' };

        let strength = 0;
        if (pwd.length >= 8) strength++;
        if (/[a-z]/.test(pwd)) strength++;
        if (/[A-Z]/.test(pwd)) strength++;
        if (/\d/.test(pwd)) strength++;
        if (/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) strength++;

        if (strength <= 2) return { strength, label: 'Weak', color: 'bg-red-500' };
        if (strength <= 3) return { strength, label: 'Fair', color: 'bg-yellow-500' };
        if (strength <= 4) return { strength, label: 'Good', color: 'bg-blue-500' };
        return { strength, label: 'Strong', color: 'bg-green-500' };
    };

    const passwordStrength = getPasswordStrength(password);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (password.length < 8) {
            setError("Password must be at least 8 characters.");
            return;
        }

        // Password complexity validation
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);

        if (!hasUpperCase || !hasLowerCase || !hasNumber) {
            setError("Password must contain at least one uppercase letter, one lowercase letter, and one number.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setIsLoading(true);
        try {
            await authApi.resetPassword({
                token,
                email,
                newPassword: password,
                confirmPassword
            });
            setSuccess(true);
            setTimeout(() => {
                navigate("/login");
            }, 3000);
        } catch (err) {
            const message = err?.response?.data?.message || err?.response?.data?.Message || "Failed to reset password. The link may have expired.";
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo - Centered */}
                <div className="flex items-center justify-center mb-8">
                    <img
                        src="/edumentor-logo.png"
                        alt="EduMentor Logo"
                        className="w-12 h-12 object-contain mr-3"
                    />
                    <span className="text-3xl font-normal text-gray-700">
                        EduMentor
                    </span>
                </div>

                {/* Form Card */}
                <div className="bg-white border border-gray-200 rounded-lg p-10 shadow-sm">
                    {success ? (
                        <div className="text-center">
                            <div className="w-14 h-14 mx-auto mb-5 bg-green-50 rounded-full flex items-center justify-center">
                                <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-semibold text-gray-900 mb-2">
                                Password Reset Successful
                            </h2>
                            <p className="text-gray-500 text-sm mb-4">
                                Your password has been updated. Redirecting to login...
                            </p>
                            <Link
                                to="/login"
                                className="inline-block w-full bg-white text-blue-600 font-medium py-3 px-6 rounded-md border-2 border-blue-600 hover:bg-blue-50 transition-colors"
                            >
                                Continue to Login
                            </Link>
                        </div>
                    ) : !tokenValid ? (
                        <div className="text-center">
                            <div className="w-14 h-14 mx-auto mb-5 bg-red-50 rounded-full flex items-center justify-center">
                                <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-semibold text-gray-900 mb-2">
                                Invalid Reset Link
                            </h2>
                            <p className="text-gray-500 text-sm mb-6">
                                {error}
                            </p>
                            <Link
                                to="/forgot-password"
                                className="inline-block w-full bg-white text-blue-600 font-medium py-3 px-6 rounded-md border-2 border-blue-600 hover:bg-blue-50 transition-colors"
                            >
                                Request New Reset Link
                            </Link>
                        </div>
                    ) : (
                        <>
                            <h2 className="text-2xl font-semibold text-gray-900 text-center mb-2">
                                Reset Your Password
                            </h2>
                            <p className="text-gray-500 text-sm text-center mb-8">
                                Enter your new password below.
                            </p>

                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg p-3 mb-6">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div>
                                    <label className="block text-gray-700 text-sm mb-2">
                                        New Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPasswords.password ? "text" : "password"}
                                            required
                                            value={password}
                                            onChange={(e) => {
                                                setPassword(e.target.value);
                                                if (error) setError("");
                                            }}
                                            className="w-full px-4 py-3 pr-12 rounded-lg border border-gray-300 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Enter new password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => toggleShowPassword('password')}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                        >
                                            {showPasswords.password ? <HiEyeOff className="w-5 h-5" /> : <HiEye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                    {/* Password Strength Indicator */}
                                    {password && (
                                        <div className="mt-2">
                                            <div className="flex gap-1 mb-1">
                                                {[1, 2, 3, 4, 5].map((level) => (
                                                    <div
                                                        key={level}
                                                        className={`h-1.5 flex-1 rounded-full transition-colors ${
                                                            level <= passwordStrength.strength
                                                                ? passwordStrength.color
                                                                : 'bg-gray-200'
                                                        }`}
                                                    />
                                                ))}
                                            </div>
                                            <p className={`text-xs ${
                                                passwordStrength.strength <= 2 ? 'text-red-500' :
                                                passwordStrength.strength <= 3 ? 'text-yellow-500' :
                                                passwordStrength.strength <= 4 ? 'text-blue-500' : 'text-green-500'
                                            }`}>
                                                {passwordStrength.label}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-gray-700 text-sm mb-2">
                                        Confirm Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPasswords.confirm ? "text" : "password"}
                                            required
                                            value={confirmPassword}
                                            onChange={(e) => {
                                                setConfirmPassword(e.target.value);
                                                if (error) setError("");
                                            }}
                                            className="w-full px-4 py-3 pr-12 rounded-lg border border-gray-300 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Confirm new password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => toggleShowPassword('confirm')}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                        >
                                            {showPasswords.confirm ? <HiEyeOff className="w-5 h-5" /> : <HiEye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className={`w-full py-3 px-4 font-medium rounded-lg transition ${isLoading
                                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                        : "bg-white text-blue-600 border-2 border-blue-600 hover:bg-blue-50"
                                        }`}
                                >
                                    {isLoading ? "Resetting..." : "Reset Password"}
                                </button>
                            </form>

                            <div className="mt-6 text-center">
                                <Link to="/login" className="text-blue-600 hover:underline text-sm">
                                    Back to Login
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
