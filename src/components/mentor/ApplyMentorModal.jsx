import React, { useState } from "react";
import { HiX, HiUpload, HiTrash, HiCheck } from "react-icons/hi";
import axios from "axios";
import mentorApi from "../../api/mentorApi";
import { toast } from "react-toastify";

// Helper to upload files directly since we don't have a dedicated fileApi yet
const uploadCertifications = async (files) => {
    const formData = new FormData();
    files.forEach((file) => {
        formData.append("files", file);
    });

    const response = await axios.post(
        `${import.meta.env.VITE_API_URL || "https://localhost:7082"}/api/File/upload/certifications`,
        formData,
        {
            headers: {
                "Content-Type": "multipart/form-data",
                // Authorization header is usually needed, trying to get it from localStorage if managed there
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
    return response.data;
};

export default function ApplyMentorModal({ isOpen, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        specialization: "",
        experienceYears: 0,
        introduction: "",
        portfolioUrl: "",
        applicationNote: "",
    });
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files);
        if (files.length + selectedFiles.length > 2) {
            setError("Maximum 2 files allowed.");
            return;
        }

        // Allowed file extensions
        const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'];
        
        // Validate file type and size
        const maxSize = 20 * 1024 * 1024; // 20MB
        
        for (let file of selectedFiles) {
            // Check file extension
            const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
            if (!allowedExtensions.includes(fileExtension)) {
                setError(`File ${file.name} has invalid format. Allowed: PDF, JPG, PNG, DOC, DOCX`);
                return;
            }
            
            // Check file size
            if (file.size > maxSize) {
                setError(`File ${file.name} is too large (>20MB)`);
                return;
            }
        }

        setFiles((prev) => [...prev, ...selectedFiles]);
        setError("");
    };

    const removeFile = (index) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (files.length === 0) {
            setError("Please upload at least one certification file.");
            return;
        }
        if (formData.introduction.length < 50) {
            setError("Introduction must be at least 50 characters.");
            return;
        }

        setLoading(true);
        setError("");

        try {
            // 1. Upload files
            const uploadRes = await uploadCertifications(files);
            const uploadedUrls = uploadRes.data.fileUrls; // Adjust based on API response structure

            if (!uploadedUrls || uploadedUrls.length === 0) {
                throw new Error("File upload failed");
            }

            // 2. Submit application
            const payload = {
                ...formData,
                experienceYears: parseInt(formData.experienceYears),
                certificationUrls: uploadedUrls.join(","),
            };

            await mentorApi.apply(payload);

            toast.success("Application submitted successfully!", {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                theme: "light",
            });
            if (onSuccess) onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            setError(
                err.response?.data?.message ||
                err.message ||
                "Failed to submit application. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
                    <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Apply to become a Mentor</h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                    >
                        <HiX className="w-5 h-5" />
                    </button>
                </div>

                {/* content */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="p-4 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Specialization */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                Specialization <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="specialization"
                                value={formData.specialization}
                                onChange={handleChange}
                                required
                                placeholder="e.g. Web Development, Data Science"
                                className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
                            />
                        </div>

                        {/* Experience Years */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                Years of Experience <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                name="experienceYears"
                                value={formData.experienceYears}
                                onChange={handleChange}
                                required
                                min="0"
                                max="50"
                                className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
                            />
                        </div>
                    </div>

                    {/* Portfolio URL */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            Portfolio / LinkedIn URL <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="url"
                            name="portfolioUrl"
                            value={formData.portfolioUrl}
                            onChange={handleChange}
                            required
                            placeholder="https://..."
                            className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
                        />
                    </div>

                    {/* Introduction */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            Introduction (min 50 chars) <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            name="introduction"
                            value={formData.introduction}
                            onChange={handleChange}
                            required
                            rows={4}
                            placeholder="Tell us about yourself and why you want to be a mentor..."
                            className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white resize-none"
                        />
                        <p className="text-xs text-neutral-500 text-right">
                            {formData.introduction.length}/50 characters
                        </p>
                    </div>

                    {/* File Upload */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            Certifications / CV (Max 2 files, 20MB each) <span className="text-red-500">*</span>
                        </label>

                        <div className="border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-xl p-6 text-center hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer relative group">
                            <input
                                type="file"
                                multiple
                                onChange={handleFileChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                            />
                            <div className="flex flex-col items-center gap-2">
                                <div className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-full text-primary-600">
                                    <HiUpload className="w-6 h-6" />
                                </div>
                                <p className="text-sm font-medium text-neutral-900 dark:text-white">
                                    Click to upload or drag and drop
                                </p>
                                <p className="text-xs text-neutral-500">
                                    PDF, Word, or Images (max 20MB)
                                </p>
                            </div>
                        </div>

                        {/* File List */}
                        {files.length > 0 && (
                            <div className="space-y-2 mt-2">
                                {files.map((file, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="p-2 bg-white dark:bg-neutral-700 rounded-lg text-neutral-500">
                                                <HiCheck className="w-4 h-4 text-emerald-500" />
                                            </div>
                                            <div className="truncate">
                                                <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                                                    {file.name}
                                                </p>
                                                <p className="text-xs text-neutral-500">
                                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeFile(index)}
                                            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-neutral-400 hover:text-red-500 rounded-lg transition-colors"
                                        >
                                            <HiTrash className="w-5 h-5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Note */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            Note for Reviewer (Optional)
                        </label>
                        <textarea
                            name="applicationNote"
                            value={formData.applicationNote}
                            onChange={handleChange}
                            rows={2}
                            className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white resize-none"
                        />
                    </div>

                    {/* Footer */}
                    <div className="sticky bottom-0 z-10 pt-4 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-5 py-2.5 font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                "Submit Application"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
