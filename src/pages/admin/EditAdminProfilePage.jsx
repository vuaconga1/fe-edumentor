import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { HiArrowLeft, HiCamera } from "react-icons/hi";
import { Save } from "lucide-react";
import userProfileApi from "../../api/userProfile";
import axiosClient from "../../api/axios";
import { normalizeAvatarUrl, buildDefaultAvatarUrl } from "../../utils/avatar";
import locationApi from "../../api/locationApi";

const EditAdminProfilePage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    gender: "",
    bio: "",
    city: "",
    country: "",
  });

  const [avatarPreview, setAvatarPreview] = useState(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [userId, setUserId] = useState(null);

  // Location dropdowns
  const [countries, setCountries] = useState([]);
  const [cities, setCities] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(true);

  const API_BASE = import.meta.env.VITE_API_BASE_URL;

  const toAbsoluteUrl = (url) => {
    if (!url) return null;
    if (url.startsWith("http")) return url;
    return `${API_BASE}${url}`;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // When country changes, reset city and load new cities
    if (name === "country") {
      setFormData((prev) => ({ ...prev, city: "" }));
      loadCities(value);
    }
  };

  const loadCities = async (countryName) => {
    const citiesData = await locationApi.getCitiesByCountry(countryName);
    setCities(citiesData);
  };

  const openFilePicker = () => fileInputRef.current?.click();

  const onPickAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image is too large. Max 5MB.");
      return;
    }

    setError("");
    setSuccessMsg("");

    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);

    try {
      setIsUploadingAvatar(true);

      const form = new FormData();
      form.append("file", file);

      const uploadRes = await axiosClient.post("/api/File/upload/avatar", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const avatarUrl = uploadRes?.data?.data?.fileUrls?.[0];
      if (!avatarUrl) throw new Error("Upload returned empty avatarUrl");

      await axiosClient.put("/api/User/avatar", { avatarUrl });

      setAvatarPreview(toAbsoluteUrl(avatarUrl));
      setSuccessMsg("Avatar updated successfully.");
    } catch (err) {
      console.log("Upload avatar failed:", err);
      setError(err?.response?.data?.message || "Upload avatar failed.");
    } finally {
      setIsUploadingAvatar(false);
      e.target.value = "";
    }
  };

  // Load countries on mount
  useEffect(() => {
    const loadLocations = async () => {
      setLoadingLocations(true);
      const countriesData = await locationApi.getCountries();
      setCountries(countriesData);
      setLoadingLocations(false);
    };
    loadLocations();
  }, []);

  // Load profile
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        setError("");

        const res = await userProfileApi.getAll();
        const u = res?.data?.data ?? res?.data;

        if (!u) throw new Error("No profile data");

        setUserId(u.id);
        setAvatarPreview(
          normalizeAvatarUrl(u.avatarUrl) ||
          buildDefaultAvatarUrl({
            id: u.id,
            email: u.email,
            fullName: u.fullName
          })
        );

        if (mounted) {
          setFormData({
            name: u.fullName ?? "",
            email: u.email ?? "",
            phone: u.phone ?? "",
            gender: u.gender ?? "",
            bio: u.bio ?? "",
            city: u.city ?? "",
            country: u.country ?? "",
          });

          // Load cities if country is already set
          if (u.country) {
            loadCities(u.country);
          }
        }
      } catch (e) {
        console.log("Load profile failed:", e);
        if (mounted) setError(e?.response?.data?.message || "Cannot load profile.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!formData.name.trim()) {
      setError("Full name is required.");
      return;
    }

    try {
      setIsSaving(true);

      // Admin profile: không gửi school, major
      const payload = {
        fullName: formData.name,
        phone: formData.phone || null,
        gender: formData.gender || null,
        bio: formData.bio || null,
        city: formData.city || null,
        country: formData.country || null,
      };

      await userProfileApi.updateUserProfile(payload);

      setSuccessMsg("Profile updated successfully!");

      setTimeout(() => {
        navigate("/admin/profile");
      }, 1500);
    } catch (err) {
      console.log("Save profile failed:", err);
      setError(err?.response?.data?.message || "Failed to save profile.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-6">
        <div className="text-neutral-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-4 sm:p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate("/admin/profile")}
            className="p-2.5 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-xl transition-colors"
          >
            <HiArrowLeft className="w-5 h-5 text-neutral-500 dark:text-neutral-400" />
          </button>
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white">
            Edit Profile
          </h1>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-4 p-4 rounded-2xl border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 text-red-700 dark:text-red-400">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-4 rounded-2xl border border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800 text-green-700 dark:text-green-400">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Upload */}
          <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-neutral-900 dark:text-white mb-4">
              Profile Picture
            </h2>
            <div className="flex items-center gap-4">
              <div className="relative group cursor-pointer" onClick={openFilePicker}>
                <img
                  src={avatarPreview || buildDefaultAvatarUrl({ id: userId, fullName: formData.name, email: formData.email })}
                  alt="avatar preview"
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-white dark:border-neutral-900 shadow"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = buildDefaultAvatarUrl({ id: userId, fullName: formData.name, email: formData.email });
                  }}
                />
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <HiCamera className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
                {isUploadingAvatar && (
                  <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>

              <div className="flex-1">
                <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  {isUploadingAvatar ? "Uploading..." : "Click avatar to change photo"}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  JPG, PNG or GIF. Max size 5MB.
                </p>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={onPickAvatar}
              className="hidden"
            />
          </div>

          {/* Basic Info */}
          <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-neutral-900 dark:text-white mb-4">
              Basic Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white focus:ring-2 focus:ring-neutral-500 dark:focus:ring-neutral-400 focus:border-transparent transition-all"
                  placeholder="Enter your full name"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  disabled
                  className="w-full px-4 py-2.5 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-500 dark:text-neutral-400 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all"
                  placeholder="Your phone"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Gender
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all"
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Country
                </label>
                <select
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  disabled={loadingLocations}
                  className="w-full px-4 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all cursor-pointer"
                >
                  <option value="">Select Country</option>
                  {countries.map((c) => (
                    <option key={c.code} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  City / Province
                </label>
                {cities.length > 0 ? (
                  <select
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all cursor-pointer"
                  >
                    <option value="">Select City</option>
                    {cities.map((c) => (
                      <option key={c.code} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Enter city name"
                    className="w-full px-4 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
            <button
              type="button"
              onClick={() => navigate("/admin/profile")}
              className="w-full sm:w-auto px-6 py-2.5 border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-xl font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={18} />
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditAdminProfilePage;
