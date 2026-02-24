import React, { useState, useEffect, useRef } from "react";
import { HiX, HiUpload, HiTrash, HiCheck, HiChevronDown, HiLightBulb, HiCheckCircle, HiExclamationCircle, HiXCircle } from "react-icons/hi";
import axios from "axios";
import mentorApi from "../../api/mentorApi";
import axiosClient from "../../api/axios";
import { toast } from "react-toastify";

// Helper to upload files directly since we don't have a dedicated fileApi yet
const uploadCertifications = async (files) => {
    const formData = new FormData();
    files.forEach((file) => {
        formData.append("files", file);
    });

    const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/File/upload/certifications`,
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
        categoryIds: [],
        hashtagIds: [],
    });
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showGuidelines, setShowGuidelines] = useState(true); // Show guidelines by default

    // Dropdown states
    const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
    const [hashtagDropdownOpen, setHashtagDropdownOpen] = useState(false);
    const categoryDropdownRef = useRef(null);
    const hashtagDropdownRef = useRef(null);

    // Categories and hashtags from API
    const [categories, setCategories] = useState([]);
    const [hashtags, setHashtags] = useState([]);
    const [categoryHashtagMap, setCategoryHashtagMap] = useState({}); // Map category ID to hashtag IDs
    const [loadingData, setLoadingData] = useState(false);

    // Fetch categories, hashtags and their mappings when modal opens
    useEffect(() => {
        if (!isOpen) return;

        const fetchData = async () => {
            setLoadingData(true);
            try {
                const [catRes, hashRes, mapRes] = await Promise.all([
                    axiosClient.get("/api/Admin/categories"),
                    axiosClient.get("/api/Admin/hashtags"),
                    axiosClient.get("/api/Admin/category-hashtags"),
                ]);
                
                const categoriesData = catRes?.data?.data || [];
                const hashtagsData = hashRes?.data?.data?.items || [];
                const mappingsData = mapRes?.data?.data || [];
                
                setCategories(categoriesData);
                setHashtags(hashtagsData);
                
                // Build map: categoryId -> [hashtagIds]
                const map = {};
                mappingsData.forEach(mapping => {
                    if (!map[mapping.categoryId]) {
                        map[mapping.categoryId] = [];
                    }
                    // mapping.hashtags is an array of hashtag objects
                    if (mapping.hashtags && Array.isArray(mapping.hashtags)) {
                        mapping.hashtags.forEach(hashtag => {
                            map[mapping.categoryId].push(hashtag.id);
                        });
                    }
                });
                setCategoryHashtagMap(map);
            } catch (err) {
                console.error("Failed to fetch categories/hashtags:", err);
            } finally {
                setLoadingData(false);
            }
        };
        fetchData();
    }, [isOpen]);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) {
                setCategoryDropdownOpen(false);
            }
            if (hashtagDropdownRef.current && !hashtagDropdownRef.current.contains(event.target)) {
                setHashtagDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (!isOpen) return null;

    // Filter hashtags based on selected categories
    const availableHashtags = formData.categoryIds.length > 0
        ? hashtags.filter(tag => {
            // Check if this hashtag belongs to any selected category
            const belongs = formData.categoryIds.some(catId => {
                const hashtagIds = categoryHashtagMap[catId] || [];
                return hashtagIds.includes(tag.id);
            });
            return belongs;
        })
        : [];

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const toggleCategory = (catId) => {
        setFormData((prev) => {
            const isSelected = prev.categoryIds.includes(catId);
            
            // Check max limit when adding
            if (!isSelected && prev.categoryIds.length >= 5) {
                setError("You can select maximum 5 categories");
                setTimeout(() => setError(""), 3000);
                return prev;
            }
            
            const newCategoryIds = isSelected
                ? prev.categoryIds.filter(id => id !== catId)
                : [...prev.categoryIds, catId];
            
            // Filter out hashtags that don't belong to newly selected categories
            const validHashtagIds = newCategoryIds.length > 0
                ? prev.hashtagIds.filter(hashId => 
                    newCategoryIds.some(id => categoryHashtagMap[id]?.includes(hashId))
                )
                : [];
            
            return {
                ...prev,
                categoryIds: newCategoryIds,
                hashtagIds: validHashtagIds,
            };
        });
    };

    const toggleHashtag = (hashId) => {
        setFormData((prev) => {
            const isSelected = prev.hashtagIds.includes(hashId);
            
            // Check max limit
            if (!isSelected && prev.hashtagIds.length >= 5) {
                setError("You can select maximum 5 hashtags");
                setTimeout(() => setError(""), 3000);
                return prev;
            }
            
            return {
                ...prev,
                hashtagIds: isSelected
                    ? prev.hashtagIds.filter(id => id !== hashId)
                    : [...prev.hashtagIds, hashId],
            };
        });
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
        if (formData.categoryIds.length === 0) {
            setError("Please select at least one category.");
            return;
        }

        setLoading(true);
        setError("");

        try {
            // 1. Upload files
            const uploadRes = await uploadCertifications(files);
            console.log("Upload response:", uploadRes);
            // uploadCertifications returns response.data, so uploadRes is the API response body
            // API response structure: { success, message, data: { fileUrls: [...] } }
            const uploadedUrls = uploadRes?.data?.fileUrls || uploadRes?.fileUrls;
            console.log("Extracted fileUrls:", uploadedUrls);

            if (!uploadedUrls || uploadedUrls.length === 0) {
                throw new Error("File upload failed - no URLs returned");
            }

            // 2. Submit application
            const payload = {
                specialization: formData.specialization,
                experienceYears: parseInt(formData.experienceYears, 10),
                introduction: formData.introduction,
                portfolioUrl: formData.portfolioUrl,
                certificationUrls: uploadedUrls.join(","),
                applicationNote: formData.applicationNote || "",
                categoryIds: formData.categoryIds.map(id => typeof id === 'string' ? parseInt(id, 10) : id),
                hashtagIds: formData.hashtagIds.length > 0 
                    ? formData.hashtagIds.map(id => typeof id === 'string' ? parseInt(id, 10) : id) 
                    : [],
            };

            console.log("Submitting payload:", payload);
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

                    {/* AI Evaluation Guidelines */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl overflow-hidden">
                        <button
                            type="button"
                            onClick={() => setShowGuidelines(!showGuidelines)}
                            className="w-full px-4 py-3 flex items-center justify-between hover:bg-blue-100/50 dark:hover:bg-blue-900/30 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <HiLightBulb className="w-5 h-5 text-yellow-500" />
                                <span className="font-semibold text-blue-900 dark:text-blue-100">
                                    AI Evaluation Guidelines - How to get approved faster
                                </span>
                            </div>
                            <HiChevronDown className={`w-5 h-5 text-blue-600 dark:text-blue-400 transition-transform duration-200 ${showGuidelines ? 'rotate-180' : ''}`} />
                        </button>
                        
                        {showGuidelines && (
                            <div className="px-4 py-4 space-y-4 border-t border-blue-200 dark:border-blue-800">
                                <p className="text-sm text-blue-900 dark:text-blue-100 font-medium">
                                    Your application will be automatically reviewed by AI. Here's how to increase your approval chances:
                                </p>
                                
                                {/* Score Legend */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div className="flex items-start gap-2 p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                        <HiCheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-xs font-bold text-green-900 dark:text-green-100">Score ≥ 80%</p>
                                            <p className="text-xs text-green-700 dark:text-green-300">Auto-Approved</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2 p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                                        <HiExclamationCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-xs font-bold text-yellow-900 dark:text-yellow-100">Score 40-79%</p>
                                            <p className="text-xs text-yellow-700 dark:text-yellow-300">Manual Review</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2 p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                                        <HiXCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-xs font-bold text-red-900 dark:text-red-100">Score &lt; 40%</p>
                                            <p className="text-xs text-red-700 dark:text-red-300">Auto-Rejected</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Evaluation Criteria */}
                                <div className="bg-white dark:bg-neutral-800 rounded-lg p-4 space-y-3">
                                    <h4 className="text-sm font-bold text-neutral-900 dark:text-white">AI evaluates 4 key areas (100 points total):</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                                        <div className="flex items-start gap-2">
                                            <span className="font-bold text-blue-600 dark:text-blue-400 flex-shrink-0">25%</span>
                                            <div>
                                                <p className="font-semibold text-neutral-900 dark:text-white">Experience Level</p>
                                                <p className="text-neutral-600 dark:text-neutral-400">Years & relevance of experience</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <span className="font-bold text-blue-600 dark:text-blue-400 flex-shrink-0">25%</span>
                                            <div>
                                                <p className="font-semibold text-neutral-900 dark:text-white">Introduction Quality</p>
                                                <p className="text-neutral-600 dark:text-neutral-400">Clarity, professionalism, passion</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <span className="font-bold text-blue-600 dark:text-blue-400 flex-shrink-0">25%</span>
                                            <div>
                                                <p className="font-semibold text-neutral-900 dark:text-white">Portfolio Quality</p>
                                                <p className="text-neutral-600 dark:text-neutral-400">GitHub/LinkedIn/Website quality</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <span className="font-bold text-blue-600 dark:text-blue-400 flex-shrink-0">25%</span>
                                            <div>
                                                <p className="font-semibold text-neutral-900 dark:text-white">Overall Fit</p>
                                                <p className="text-neutral-600 dark:text-neutral-400">Alignment with mentor role</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Tips */}
                                <div className="bg-white dark:bg-neutral-800 rounded-lg p-4 space-y-2">
                                    <h4 className="text-sm font-bold text-green-600 dark:text-green-400 flex items-center gap-2">
                                        Tips for High Score (80%+):
                                    </h4>
                                    <ul className="text-xs space-y-1.5 text-neutral-700 dark:text-neutral-300">
                                        <li className="flex items-start gap-2">
                                            <span className="text-green-600 dark:text-green-400 flex-shrink-0">✓</span>
                                            <span><strong>3+ years experience</strong> in your field (5+ is ideal)</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-green-600 dark:text-green-400 flex-shrink-0">✓</span>
                                            <span><strong>Introduction: 150-300 words</strong> - Highlight achievements, teaching passion, specific expertise</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-green-600 dark:text-green-400 flex-shrink-0">✓</span>
                                            <span><strong>Active GitHub</strong> (10+ repos, contributions) or well-maintained LinkedIn profile</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-green-600 dark:text-green-400 flex-shrink-0">✓</span>
                                            <span><strong>Professional certifications</strong> (AWS, Google Cloud, Microsoft, etc.) in <strong>PDF format</strong></span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-green-600 dark:text-green-400 flex-shrink-0">✓</span>
                                            <span><strong>Quality CV</strong> - Professional format, clear structure (ATS-friendly)</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-green-600 dark:text-green-400 flex-shrink-0">✓</span>
                                            <span><strong>Accurate categories & hashtags</strong> matching your expertise</span>
                                        </li>
                                    </ul>
                                </div>

                                {/* File Format Tips */}
                                <div className="bg-white dark:bg-neutral-800 rounded-lg p-4 space-y-2">
                                    <h4 className="text-sm font-bold text-blue-600 dark:text-blue-400">Best File Formats for AI:</h4>
                                    <div className="text-xs space-y-1.5 text-neutral-700 dark:text-neutral-300">
                                        <p><strong className="text-green-600 dark:text-green-400">Recommended:</strong> PDF (best for AI reading), JPG/PNG (for scanned certificates)</p>
                                        <p><strong className="text-yellow-600 dark:text-yellow-400">Acceptable:</strong> DOC/DOCX (less optimal)</p>
                                        <p><strong className="text-red-600 dark:text-red-400">Avoid:</strong> Low-quality images, blurry scans, unrelated files</p>
                                    </div>
                                </div>

                                {/* Red Flags */}
                                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 space-y-2 border border-red-200 dark:border-red-800">
                                    <h4 className="text-sm font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
                                        Common Red Flags (Low Score):
                                    </h4>
                                    <ul className="text-xs space-y-1.5 text-red-700 dark:text-red-300">
                                        <li className="flex items-start gap-2">
                                            <span className="flex-shrink-0">✗</span>
                                            <span>&lt; 1 year experience or unclear background</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="flex-shrink-0">✗</span>
                                            <span>Very short introduction (1-2 sentences) or many grammar errors</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="flex-shrink-0">✗</span>
                                            <span>Empty GitHub, broken links, or no real portfolio</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="flex-shrink-0">✗</span>
                                            <span>Unrelated files, blurry scans, or no certifications</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="flex-shrink-0">✗</span>
                                            <span>Inconsistent information (claim 10 years but empty portfolio)</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        )}
                    </div>

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
                            <p className={`text-xs ${formData.experienceYears >= 3 ? 'text-green-600 dark:text-green-400 font-medium' : 'text-neutral-500'}`}>
                                {formData.experienceYears >= 3 ? 'Great! 3+ years increases approval chance' : '3+ years recommended for higher AI score'}
                            </p>
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

                    {/* Categories */}
                    <div className="space-y-2" ref={categoryDropdownRef}>
                        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            Categories / Expertise Areas <span className="text-red-500">*</span>
                        </label>
                        <p className="text-xs text-neutral-500 mb-2">
                            Select the categories you can mentor in. Students will be matched based on these.
                        </p>
                        {loadingData ? (
                            <div className="text-sm text-neutral-500">Loading categories...</div>
                        ) : (
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                                    className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white text-left flex items-center justify-between"
                                >
                                    <span className="text-sm">
                                        {formData.categoryIds.length === 0 
                                            ? "Select categories..." 
                                            : `${formData.categoryIds.length}/5 selected`}
                                    </span>
                                    <HiChevronDown className={`w-5 h-5 text-neutral-500 dark:text-neutral-400 transition-transform duration-200 ${categoryDropdownOpen ? 'rotate-180' : ''}`} />
                                </button>
                                
                                {categoryDropdownOpen && (
                                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                                        {categories.map((cat) => (
                                            <label
                                                key={cat.id}
                                                className="flex items-center px-4 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 cursor-pointer"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={formData.categoryIds.includes(cat.id)}
                                                    onChange={() => toggleCategory(cat.id)}
                                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                                />
                                                <span className="ml-3 text-sm text-neutral-700 dark:text-neutral-300">
                                                    {cat.name}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                        {formData.categoryIds.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-xs text-blue-600 dark:text-blue-400">
                                    {formData.categoryIds.length}/5 categories selected
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {formData.categoryIds.map(catId => {
                                        const cat = categories.find(c => c.id === catId);
                                        return cat ? (
                                            <span
                                                key={catId}
                                                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full"
                                            >
                                                {cat.name}
                                                <button
                                                    type="button"
                                                    onClick={() => toggleCategory(catId)}
                                                    className="hover:text-blue-900 dark:hover:text-blue-200"
                                                >
                                                    ×
                                                </button>
                                            </span>
                                        ) : null;
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Hashtags */}
                    <div className="space-y-2" ref={hashtagDropdownRef}>
                        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            Hashtags / Specific Skills (Optional)
                        </label>
                        <p className="text-xs text-neutral-500 mb-2">
                            {formData.categoryIds.length > 0 
                                ? "Select specific skills related to your chosen categories (max 5)."
                                : "Please select categories first to see available hashtags."}
                        </p>
                        {loadingData ? (
                            <div className="text-sm text-neutral-500">Loading hashtags...</div>
                        ) : formData.categoryIds.length === 0 ? (
                            <div className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-center">
                                <p className="text-sm text-neutral-500">Select categories first</p>
                            </div>
                        ) : (
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setHashtagDropdownOpen(!hashtagDropdownOpen)}
                                    disabled={availableHashtags.length === 0}
                                    className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white text-left flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <span className="text-sm">
                                        {formData.hashtagIds.length === 0 
                                            ? "Select hashtags..." 
                                            : `${formData.hashtagIds.length}/5 selected`}
                                    </span>
                                    <HiChevronDown className={`w-5 h-5 text-neutral-500 dark:text-neutral-400 transition-transform duration-200 ${hashtagDropdownOpen ? 'rotate-180' : ''}`} />
                                </button>
                                
                                {hashtagDropdownOpen && availableHashtags.length > 0 && (
                                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                                        {availableHashtags.map((tag) => (
                                            <label
                                                key={tag.id}
                                                className={`flex items-center px-4 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 cursor-pointer ${
                                                    formData.hashtagIds.length >= 5 && !formData.hashtagIds.includes(tag.id) 
                                                        ? 'opacity-50 cursor-not-allowed' 
                                                        : ''
                                                }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={formData.hashtagIds.includes(tag.id)}
                                                    onChange={() => toggleHashtag(tag.id)}
                                                    disabled={formData.hashtagIds.length >= 5 && !formData.hashtagIds.includes(tag.id)}
                                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                                />
                                                <span className="ml-3 text-sm text-neutral-700 dark:text-neutral-300">
                                                    #{tag.name}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                        {formData.hashtagIds.length > 0 && (
                            <div className="space-y-2">
                                <p className={`text-xs ${formData.hashtagIds.length >= 5 ? 'text-orange-600 font-medium' : 'text-blue-600 dark:text-blue-400'}`}>
                                    {formData.hashtagIds.length}/5 hashtags selected {formData.hashtagIds.length >= 5 && "(Maximum reached)"}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {formData.hashtagIds.map(hashId => {
                                        const tag = hashtags.find(h => h.id === hashId);
                                        return tag ? (
                                            <span
                                                key={hashId}
                                                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full"
                                            >
                                                #{tag.name}
                                                <button
                                                    type="button"
                                                    onClick={() => toggleHashtag(hashId)}
                                                    className="hover:text-blue-900 dark:hover:text-blue-200"
                                                >
                                                    ×
                                                </button>
                                            </span>
                                        ) : null;
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Introduction */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            Introduction (min 50 chars, recommend 150-300 words) <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            name="introduction"
                            value={formData.introduction}
                            onChange={handleChange}
                            required
                            rows={5}
                            placeholder="Tell us about your experience, achievements, teaching philosophy, and why you want to mentor. Be specific and professional. Example: 'I'm a Senior Software Engineer with 7 years in full-stack development. I've mentored 50+ junior developers and published technical articles with 100k+ views...'"
                            className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white resize-none"
                        />
                        <p className={`text-xs text-right ${formData.introduction.length >= 150 ? 'text-green-600 dark:text-green-400 font-medium' : 'text-neutral-500'}`}>
                            {formData.introduction.length} characters {formData.introduction.length >= 150 && '✓ Great length!'}
                        </p>
                    </div>

                    {/* File Upload */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            Certifications / CV (Max 2 files, 20MB each) <span className="text-red-500">*</span>
                        </label>
                        <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                            Best formats: PDF (recommended), JPG/PNG for certificates. Upload professional certifications for higher AI score!
                        </p>

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
                                    PDF (best), JPG, PNG, Word • Max 20MB per file
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
