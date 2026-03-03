import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiEye, HiEyeOff, HiCheckCircle, HiShieldCheck, HiX } from 'react-icons/hi';
import authApi from "../../api/authApi";
import { useUIContext } from '../../hooks/useUIContext';
import { stopChatHub } from '../../signalr/chatHub';

const ChangePasswordModal = () => {
    const { isChangePasswordOpen, closeChangePasswordModal } = useUIContext();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });
    const [errors, setErrors] = useState({});
    const [apiError, setApiError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    // Reset state when closing/opening usually handled by mounting/unmounting or useEffect
    // For simplicity, we keep state but reset on success/close if needed.

    if (!isChangePasswordOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
        if (apiError) setApiError("");
    };

    const toggleShowPassword = (field) => {
        setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.currentPassword) newErrors.currentPassword = 'Please enter your current password';
        if (!formData.newPassword) {
            newErrors.newPassword = 'Please enter a new password';
        } else if (formData.newPassword.length < 8) {
            newErrors.newPassword = 'Password must be at least 8 characters';
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.newPassword)) {
            newErrors.newPassword = 'Password must contain uppercase, lowercase, and number';
        }
        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your new password';
        } else if (formData.newPassword !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setApiError("");
        if (!validateForm()) return;

        setIsLoading(true);
        try {
            const res = await authApi.changePassword({
                currentPassword: formData.currentPassword,
                newPassword: formData.newPassword,
                confirmNewPassword: formData.confirmPassword,
            });

            const data = res?.data?.data ?? res?.data;
            const ok = (typeof data?.success === "boolean") ? data.success : true;

            if (!ok) {
                setApiError(data?.message || "Change password failed.");
                return;
            }

            setSuccess(true);
            setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });

            // Auto logout after 2 seconds
            setTimeout(async () => {
                setSuccess(false);
                closeChangePasswordModal();

                // Clear tokens and redirect to login
                try { await stopChatHub(); } catch {}
                localStorage.removeItem("token");
                localStorage.removeItem("refreshToken");
                navigate("/login");
            }, 2000);

        } catch (err) {
            const data = err?.response?.data;
            const msg = data?.message || err?.message || "Change password failed.";
            setApiError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const getPasswordStrength = (password) => {
        if (!password) return { strength: 0, label: '', color: '' };
        let strength = 0;
        if (password.length >= 8) strength++;
        if (/[a-z]/.test(password)) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/\d/.test(password)) strength++;
        if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;

        if (strength <= 2) return { strength, label: 'Weak', color: 'bg-red-500' };
        if (strength <= 3) return { strength, label: 'Fair', color: 'bg-yellow-500' };
        if (strength <= 4) return { strength, label: 'Good', color: 'bg-blue-500' };
        return { strength, label: 'Strong', color: 'bg-green-500' };
    };

    const passwordStrength = getPasswordStrength(formData.newPassword);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-neutral-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-200">

                {/* Close Button */}
                <button
                    onClick={closeChangePasswordModal}
                    className="absolute top-4 right-4 p-2 text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors z-10"
                >
                    <HiX size={20} />
                </button>

                <div className="p-6 md:p-8">
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">Change Password</h2>
                        <p className="text-neutral-500 dark:text-neutral-400 text-sm">Update your password to keep your account secure</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {success && (
                            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400 text-sm">
                                <HiCheckCircle className="w-5 h-5 flex-shrink-0" />
                                <span>Password changed! Logging out in 2s...</span>
                            </div>
                        )}

                        {apiError && !success && (
                            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                                {apiError}
                            </div>
                        )}

                        {/* Current Password */}
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Current Password</label>
                            <div className="relative">
                                <input
                                    type={showPasswords.current ? 'text' : 'password'}
                                    name="currentPassword"
                                    value={formData.currentPassword}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-2.5 pr-10 bg-neutral-50 dark:bg-neutral-800 border ${errors.currentPassword ? 'border-red-500' : 'border-neutral-200 dark:border-neutral-700'
                                        } rounded-xl text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all`}
                                />
                                <button type="button" onClick={() => toggleShowPassword('current')} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">
                                    {showPasswords.current ? <HiEyeOff /> : <HiEye />}
                                </button>
                            </div>
                            {errors.currentPassword && <p className="mt-1 text-xs text-red-500">{errors.currentPassword}</p>}
                        </div>

                        {/* New Password */}
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">New Password</label>
                            <div className="relative">
                                <input
                                    type={showPasswords.new ? 'text' : 'password'}
                                    name="newPassword"
                                    value={formData.newPassword}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-2.5 pr-10 bg-neutral-50 dark:bg-neutral-800 border ${errors.newPassword ? 'border-red-500' : 'border-neutral-200 dark:border-neutral-700'
                                        } rounded-xl text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all`}
                                />
                                <button type="button" onClick={() => toggleShowPassword('new')} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">
                                    {showPasswords.new ? <HiEyeOff /> : <HiEye />}
                                </button>
                            </div>
                            {errors.newPassword && <p className="mt-1 text-xs text-red-500">{errors.newPassword}</p>}

                            {/* Strength Bar */}
                            {formData.newPassword && (
                                <div className="mt-2 flex gap-1 h-1">
                                    {[1, 2, 3, 4, 5].map((level) => (
                                        <div key={level} className={`flex-1 rounded-full ${level <= passwordStrength.strength ? passwordStrength.color : 'bg-neutral-200 dark:bg-neutral-700'
                                            }`} />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Confirm Password</label>
                            <div className="relative">
                                <input
                                    type={showPasswords.confirm ? 'text' : 'password'}
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-2.5 pr-10 bg-neutral-50 dark:bg-neutral-800 border ${errors.confirmPassword ? 'border-red-500' : 'border-neutral-200 dark:border-neutral-700'
                                        } rounded-xl text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all`}
                                />
                                <button type="button" onClick={() => toggleShowPassword('confirm')} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">
                                    {showPasswords.confirm ? <HiEyeOff /> : <HiEye />}
                                </button>
                            </div>
                            {errors.confirmPassword && <p className="mt-1 text-xs text-red-500">{errors.confirmPassword}</p>}
                        </div>

                        <div className="pt-2 flex gap-3">
                            <button
                                type="button"
                                onClick={closeChangePasswordModal}
                                className="flex-1 py-2.5 rounded-xl font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading || success}
                                className="flex-1 py-2.5 rounded-xl font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {isLoading ? 'Updating...' : 'Update Password'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ChangePasswordModal;
