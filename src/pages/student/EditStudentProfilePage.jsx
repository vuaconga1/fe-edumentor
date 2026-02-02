import { useNavigate } from "react-router-dom";
import { HiArrowLeft, HiCamera } from "react-icons/hi";
import { Save } from "lucide-react";
import userProfileApi from "../../api/userProfile";
import React, { useState, useEffect, useRef } from "react";
import axiosClient from "../../api/axios";
import { normalizeAvatarUrl, buildDefaultAvatarUrl } from "../../utils/avatar";
import locationApi from "../../api/locationApi";

const EditStudentProfilePage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    gender: "",
    school: "",
    major: "",
    bio: "",
    city: "",
    country: "",
  });

  const [avatarPreview, setAvatarPreview] = useState("/avatar-default.jpg");
  const [avatarSeed, setAvatarSeed] = useState(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Location dropdowns
  const [countries, setCountries] = useState([]);
  const [cities, setCities] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(true);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Khi đổi country, reset city và load cities mới
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

      setAvatarPreview(normalizeAvatarUrl(avatarUrl));
      setSuccessMsg("Avatar updated successfully.");
    } catch (err) {
      console.log("Upload avatar failed:", err);
      setError(err?.response?.data?.message || "Upload avatar failed.");
    } finally {
      setIsUploadingAvatar(false);
      e.target.value = "";
    }
  };

  // Load countries và cities on mount
  useEffect(() => {
    const loadLocations = async () => {
      setLoadingLocations(true);
      const countriesData = await locationApi.getCountries();
      setCountries(countriesData);
      setLoadingLocations(false);
    };
    loadLocations();
  }, []);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        setError("");

        const res = await userProfileApi.getAll();
        const u = res?.data?.data ?? res?.data;

        if (!u) throw new Error("No profile data");

        setAvatarSeed({ id: u.id, email: u.email, fullName: u.fullName });
        setAvatarPreview(
          normalizeAvatarUrl(u.avatarUrl) ||
          buildDefaultAvatarUrl({ id: u.id, email: u.email, fullName: u.fullName })
        );

        if (mounted) {
          setFormData({
            name: u.fullName || "",
            email: u.email || "",
            phone: u.phone || "",
            gender: u.gender || "",
            school: u.school || "",
            major: u.major || "",
            bio: u.bio || "",
            city: u.city || "",
            country: u.country || "",
          });

          // Load cities nếu đã có country
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

    try {
      setIsSaving(true);
      setError("");
      setSuccessMsg("");

      const payload = {
        fullName: formData.name,
        phone: formData.phone || null,
        gender: formData.gender || null,
        school: formData.school || null,
        major: formData.major || null,
        bio: formData.bio || null,
        city: formData.city || null,
        country: formData.country || null,
      };

      const res = await userProfileApi.updateProfile(payload);
      const msg = res?.data?.message || "Profile updated successfully";

      setSuccessMsg(msg);
      setTimeout(() => navigate("/student/profile"), 700);
    } catch (e) {
      console.log("Update profile failed:", e);
      setError(e?.response?.data?.message || "Update failed.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate("/student/profile")}
            className="p-2.5 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-xl transition-colors"
          >
            <HiArrowLeft className="w-5 h-5 text-neutral-500 dark:text-neutral-400" />
          </button>
          <h1 className="text-xl md:text-2xl font-bold text-neutral-900 dark:text-white">
            Edit Profile
          </h1>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-3 rounded-xl border border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800 text-green-700 dark:text-green-400 text-sm">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Left Column - Avatar & Quick Info */}
            <div className="xl:col-span-1 space-y-6">
              {/* Avatar Section */}
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm p-5">
                <h2 className="text-sm font-semibold text-neutral-900 dark:text-white mb-4">
                  Profile Photo
                </h2>
                <div className="flex flex-col items-center">
                  <div className="relative">
                    <img
                      src={avatarPreview}
                      alt="avatar"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = buildDefaultAvatarUrl(avatarSeed || { email: formData.email, fullName: formData.name });
                      }}
                      className="w-28 h-28 rounded-full object-cover border-4 border-white dark:border-neutral-800 shadow-lg"
                    />
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
                      className="absolute bottom-0 right-0 p-2.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-lg disabled:opacity-60"
                      title="Change avatar"
                    >
                      <HiCamera className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-neutral-500 mt-3 text-center">
                    Click the camera icon to change photo
                  </p>
                  {isUploadingAvatar && (
                    <div className="text-xs text-blue-600 mt-2">Uploading...</div>
                  )}
                </div>
              </div>

              {/* Basic Info - Left Column */}
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm p-5">
                <h2 className="text-sm font-semibold text-neutral-900 dark:text-white mb-4">
                  Basic Information
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
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
                      readOnly
                      className="w-full px-4 py-2.5 bg-neutral-100 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-500 dark:text-neutral-400 outline-none cursor-not-allowed"
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
                      placeholder="Your phone"
                      className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                      Gender
                    </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all cursor-pointer"
                    >
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Location - Left Column */}
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm p-5">
                <h2 className="text-sm font-semibold text-neutral-900 dark:text-white mb-4">
                  Location
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                      Country
                    </label>
                    <select
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      disabled={loadingLocations}
                      className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all cursor-pointer"
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
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                      City / Province
                    </label>
                    {cities.length > 0 ? (
                      <select
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all cursor-pointer"
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
                        className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Content */}
            <div className="xl:col-span-2 space-y-6">
              {/* Education Info */}
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm p-5">
                <h2 className="text-sm font-semibold text-neutral-900 dark:text-white mb-4">
                  Education
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                      School
                    </label>
                    <input
                      type="text"
                      name="school"
                      value={formData.school}
                      onChange={handleChange}
                      placeholder="e.g., FPT University"
                      className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                      Major
                    </label>
                    <input
                      type="text"
                      name="major"
                      value={formData.major}
                      onChange={handleChange}
                      placeholder="e.g., Computer Science"
                      className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* About */}
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm p-5">
                <h2 className="text-sm font-semibold text-neutral-900 dark:text-white mb-4">
                  About
                </h2>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows={5}
                  placeholder="Tell us about yourself..."
                  className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => navigate("/student/profile")}
                  className="w-full sm:w-auto px-6 py-2.5 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl font-medium transition-colors"
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/30 active:scale-95 disabled:opacity-50"
                >
                  <Save size={16} />
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditStudentProfilePage;
