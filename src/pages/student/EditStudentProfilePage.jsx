import { useNavigate } from "react-router-dom";
import { HiArrowLeft, HiCamera, HiX, HiPlus } from "react-icons/hi";
import { Save } from "lucide-react";
import studentData from "../../mock/studentProfile.json";
import userProfileApi from "../../api/userProfile";
import React, { useState, useEffect, useRef } from "react";
import axiosClient from "../../api/axios";
import { normalizeAvatarUrl, buildDefaultAvatarUrl } from "../../utils/avatar";
const EditStudentProfilePage = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]); // [{id,name}]
  const [selectedCategoryId, setSelectedCategoryId] = useState("");

  const [formData, setFormData] = useState({
    // UI fields
    name: studentData.name,
    title: studentData.title,
    email: studentData.email,
    phone: studentData.phone || "",
    location: studentData.location || "",
    bio: studentData.bio,
    education: studentData.otherInfo.education,
    languages: studentData.otherInfo.languages,
    interests: studentData.interests,
    learningGoals: studentData.learningGoals,
    interestCategoryIds: [], // ✅ lưu id
  });

  const [newLanguage, setNewLanguage] = useState("");
  const [newInterest, setNewInterest] = useState("");
  const [newGoal, setNewGoal] = useState("");
  const fileInputRef = useRef(null);
  const [avatarPreview, setAvatarPreview] = useState("/avatar-default.jpg");
  const [selectedAvatarFile, setSelectedAvatarFile] = useState(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [loadingBasic, setLoadingBasic] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const addItem = (field, value, setter) => {
    if (value.trim()) {
      setFormData((prev) => ({
        ...prev,
        [field]: [...prev[field], value.trim()],
      }));
      setter("");
    }
  };
  const addInterestCategory = () => {
    const idNum = Number(selectedCategoryId);
    if (!idNum) return;

    setFormData((prev) => {
      if (prev.interestCategoryIds.includes(idNum)) return prev;
      return { ...prev, interestCategoryIds: [...prev.interestCategoryIds, idNum] };
    });

    setSelectedCategoryId("");
  };

  const removeInterestCategory = (idNum) => {
    setFormData((prev) => ({
      ...prev,
      interestCategoryIds: prev.interestCategoryIds.filter((x) => x !== idNum),
    }));
  };

  const removeItem = (field, index) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };
  const API_BASE = import.meta.env.VITE_API_BASE_URL; // ví dụ https://localhost:7082

  const toAbsoluteUrl = (url) => {
    if (!url) return "/avatar-default.jpg";
    if (url.startsWith("http")) return url;
    return `${API_BASE}${url}`; // "/uploads/..." -> "https://localhost:7082/uploads/..."
  };
  const openFilePicker = () => fileInputRef.current?.click();

  const onPickAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // validate
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      // backend avatar upload limit 5MB :contentReference[oaicite:1]{index=1}
      setError("Image is too large. Max 5MB.");
      return;
    }

    setError("");
    setSuccessMsg("");

    // preview ngay
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);
    setSelectedAvatarFile?.(file); // nếu mày có state này thì giữ, không có thì xoá dòng này

    try {
      setIsUploadingAvatar(true);

      // 1) upload file -> lấy url
      const form = new FormData();
      form.append("file", file);

      const uploadRes = await axiosClient.post("/api/File/upload/avatar", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const avatarUrl = uploadRes?.data?.data?.fileUrls?.[0];
      if (!avatarUrl) throw new Error("Upload returned empty avatarUrl");

      // 2) lưu url vào DB user_profile
      const saveRes = await axiosClient.put("/api/User/avatar", { avatarUrl });
      await axiosClient.put("/api/User/profile", {
        fullName: formData.name,
        phone: formData.phone,
        // ...
        categoryIds: formData.interestCategoryIds, // ✅ thêm field này
      });

      // update preview theo url thật (từ server)
      setAvatarPreview(toAbsoluteUrl(avatarUrl));

      setSuccessMsg(saveRes?.data?.message || "Avatar updated successfully.");
    } catch (err) {
      console.log("Upload avatar failed:", err);
      setError(err?.response?.data?.message || "Upload avatar failed.");
    } finally {
      setIsUploadingAvatar(false);

      // reset input để chọn lại cùng 1 file vẫn trigger onChange
      e.target.value = "";
    }
  };


  // Load basic info from GET /api/User/profile
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoadingBasic(true);
        setError("");

        const res = await userProfileApi.getAll(); // GET /api/User/profile
        const u = res?.data?.data ?? res?.data;

        setAvatarPreview(
          normalizeAvatarUrl(u.avatarUrl) ||
          buildDefaultAvatarUrl({
            id: u.id,
            email: u.email,
            fullName: u.fullName
          })
        );

        if (!u) throw new Error("No profile data");

        // Title = major (theo yêu cầu trước)
        // Location = city + country
        const location = [u.city, u.country].filter(Boolean).join(", ");

        if (mounted) {
          setFormData((prev) => ({
            ...prev,
            name: u.fullName ?? prev.name,
            title: u.major ?? prev.title,
            email: u.email ?? prev.email,
            phone: u.phone ?? prev.phone,
            location: location || prev.location,
            bio: u.bio ?? prev.bio,
          }));
        }
      } catch (e) {
        console.log("Load basic info failed:", e);
        if (mounted) setError(e?.response?.data?.message || "Cannot load profile.");
      } finally {
        if (mounted) setLoadingBasic(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);
  useEffect(() => {
    (async () => {
      try {
        const res = await axiosClient.get("/api/Admin/categories");
        const raw = res?.data?.data ?? [];

        // flatten tree (nếu categories có children)
        const flat = [];
        const walk = (arr) => {
          (arr || []).forEach((c) => {
            flat.push({ id: c.id, name: c.name });
            if (c.children?.length) walk(c.children);
          });
        };
        walk(raw);

        setCategories(flat);
      } catch (e) {
        console.log("Fetch categories failed", e);
      }
    })();
  }, []);

  // Helper: split "City, Country"
  const splitLocation = (locationStr) => {
    const raw = (locationStr || "").trim();
    if (!raw) return { city: null, country: null };

    const parts = raw.split(",").map((x) => x.trim()).filter(Boolean);
    if (parts.length === 0) return { city: null, country: null };
    if (parts.length === 1) return { city: parts[0], country: null };

    return {
      city: parts[0],
      country: parts.slice(1).join(", "),
    };
  };

  // Submit -> PUT /api/User/profile
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setIsSaving(true);
      setError("");
      setSuccessMsg("");

      const { city, country } = splitLocation(formData.location);

      // ✅ payload backend basic fields
      // NOTE: email thường không cho update ở profile -> không gửi email
      const payload = {
        fullName: formData.name,
        phone: formData.phone || null,
        major: formData.title || null, // title = major
        bio: formData.bio || null,
        city,
        country,
      };

      const res = await userProfileApi.updateProfile(payload);
      const msg =
        res?.data?.message ||
        res?.data?.data?.message ||
        "Update profile successfully";

      setSuccessMsg(msg);

      // về profile
      setTimeout(() => navigate("/student/profile"), 700);
    } catch (e) {
      console.log("Update profile failed:", e);
      setError(e?.response?.data?.message || "Update failed.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-4 md:p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate("/student/profile")}
            className="p-2.5 hover:bg-neutral-200 dark:hover:bg-gray-800 rounded-xl transition-colors"
          >
            <HiArrowLeft className="w-5 h-5 text-neutral-500 dark:text-neutral-400" />
          </button>
          <h1 className="text-xl md:text-2xl font-bold text-neutral-900 dark:text-white">
            Edit Profile
          </h1>

          {loadingBasic && (
            <span className="ml-auto text-sm text-neutral-500">Loading...</span>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-3 rounded-xl border border-green-200 bg-green-50 text-green-700 text-sm">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Section */}
          <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm p-6">
            <div className="flex items-center gap-6">
              <div className="relative">
                <img
                  src={avatarPreview}
                  alt="avatar"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = buildDefaultAvatarUrl({
                      id: user?.id,
                      email: formData.email,
                      fullName: formData.name
                    });
                  }}

                  className="w-24 h-24 rounded-full object-cover border-2 border-neutral-200 dark:border-neutral-800"
                />


                {/* input file ẩn */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onPickAvatar}
                />

                <button
                  type="button"
                  onClick={openFilePicker}
                  disabled={isUploadingAvatar}
                  className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-lg disabled:opacity-60"
                  title="Change avatar"
                >
                  <HiCamera className="w-4 h-4" />
                </button>
              </div>

              <div>
                <h3 className="font-medium text-neutral-900 dark:text-white">
                  {formData.name}
                </h3>
                {isUploadingAvatar && (
                  <div className="text-xs text-neutral-500 mt-1">Uploading...</div>
                )}
              </div>
            </div>
          </div>


          {/* Basic Info */}
          <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
              Basic Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-gray-600 rounded-xl text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g., Computer Science Student"
                  className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-gray-600 rounded-xl text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  readOnly
                  className="w-full px-4 py-2.5 bg-neutral-100 dark:bg-neutral-800/50 border border-neutral-200 dark:border-gray-600 rounded-xl text-neutral-500 dark:text-neutral-400 outline-none cursor-not-allowed"
                  title="Email thường không cho update ở profile"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-gray-600 rounded-xl text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g., Hanoi, Vietnam"
                  className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-gray-600 rounded-xl text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* About */}
          <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
              About
            </h2>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows={4}
              placeholder="Tell us about yourself..."
              className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-gray-600 rounded-xl text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
            />
          </div>
          {/* Interests */}
          <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
              Interests
            </h2>

            {/* chips */}
            <div className="flex flex-wrap gap-2 mb-3">
              {formData.interestCategoryIds.map((id) => {
                const name = categories.find((c) => c.id === id)?.name || `#${id}`;
                return (
                  <span
                    key={id}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full text-sm border border-blue-200 dark:border-blue-800"
                  >
                    {name}
                    <button
                      type="button"
                      onClick={() => removeInterestCategory(id)}
                      className="hover:text-red-500"
                    >
                      <HiX className="w-3.5 h-3.5" />
                    </button>
                  </span>
                );
              })}
            </div>

            {/* dropdown + add */}
            <div className="flex gap-2">
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className="flex-1 px-4 py-2 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-gray-600 rounded-xl text-neutral-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select category...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={addInterestCategory}
                disabled={!selectedCategoryId}
                className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors disabled:opacity-60"
                title="Add interest"
              >
                <HiPlus className="w-5 h-5" />
              </button>
            </div>
          </div>


          {/* Learning Goals */}
          <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
              Learning Goals
            </h2>
            <div className="space-y-2 mb-3">
              {formData.learningGoals.map((goal, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl"
                >
                  <span className="flex-1 text-neutral-700 dark:text-neutral-300 text-sm">
                    {goal}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeItem("learningGoals", index)}
                    className="p-1 hover:text-red-500"
                  >
                    <HiX className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
                placeholder="Add a learning goal..."
                className="flex-1 px-4 py-2 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-gray-600 rounded-xl text-neutral-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500"
                onKeyDown={(e) =>
                  e.key === "Enter" &&
                  (e.preventDefault(),
                    addItem("learningGoals", newGoal, setNewGoal))
                }
              />
              <button
                type="button"
                onClick={() => addItem("learningGoals", newGoal, setNewGoal)}
                className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
              >
                <HiPlus className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => navigate("/student/profile")}
              className="px-6 py-2.5 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-gray-800 rounded-xl font-medium transition-colors"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold flex items-center gap-2 transition-all shadow-lg shadow-blue-500/30 active:scale-95 disabled:opacity-50"
            >
              <Save size={16} />
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditStudentProfilePage;
