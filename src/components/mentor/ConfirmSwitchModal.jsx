import React, { useState } from "react";
import { HiCheck, HiX, HiSparkles } from "react-icons/hi";
import mentorApi from "../../api/mentorApi";
import { useNavigate } from "react-router-dom";
import { stopChatHub } from "../../signalr/chatHub";

export default function ConfirmSwitchModal({ isOpen, onClose, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const navigate = useNavigate();

    const handleLoginRedirect = async () => {
        // Logout user and redirect to login page
        try { await stopChatHub(); } catch {}
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
    };

    const handleConfirm = async () => {
        setLoading(true);
        try {
            await mentorApi.confirmSwitch();

            // Call onSuccess callback to refresh user data context
            if (onSuccess) onSuccess();

            // Show success modal instead of toast
            setShowSuccess(true);

        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || "Failed to switch role");
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    // Success Modal (similar to VerifyEmail style)
    if (showSuccess) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 p-10 shadow-sm">
                    <div className="text-center">
                        <div className="w-14 h-14 mx-auto mb-5 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                            <svg className="w-7 h-7 text-green-600 dark:text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h1 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
                            Successfully Switched to Mentor
                        </h1>
                        <p className="text-neutral-500 dark:text-neutral-400 text-sm mb-6">
                            Your account has been converted to Mentor role. We will log you out now. Please login again to access your mentor dashboard.
                        </p>
                        <button
                            onClick={handleLoginRedirect}
                            className="inline-block w-full bg-white dark:bg-neutral-800 text-primary-600 dark:text-primary-400 font-medium py-3 px-6 rounded-md border-2 border-primary-600 dark:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                        >
                            Continue to Login
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Confirmation Modal
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl shadow-xl overflow-hidden">
                <div className="p-8">
                    {/* Icon */}
                    <div className="flex justify-center mb-6">
                        <div className="p-4 bg-primary-100 dark:bg-primary-900/20 rounded-full">
                            <HiSparkles className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                        </div>
                    </div>

                    {/* Title & Desc */}
                    <div className="text-center space-y-3 mb-8">
                        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
                            Become a Mentor
                        </h2>
                        <p className="text-neutral-500 dark:text-neutral-400">
                            Congratulations! Your application has been approved. Confirm below to switch your account to Mentor role.
                        </p>
                    </div>

                    {/* Benefits */}
                    <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-4 mb-8 border border-neutral-100 dark:border-neutral-800">
                        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-3">
                            What happens next?
                        </h3>
                        <ul className="space-y-2">
                            {[
                                "Access to Mentor Dashboard",
                                "Create and manage your schedule",
                                "Receive booking requests from students",
                                "Build your reputation and earn"
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                                    <HiCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-3 font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors"
                        >
                            Not now
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={loading}
                            className="flex-[2] px-4 py-3 font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Confirming...
                                </>
                            ) : (
                                "Switch to Mentor"
                            )}
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}
