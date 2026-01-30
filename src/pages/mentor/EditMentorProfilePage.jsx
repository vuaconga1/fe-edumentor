// src/pages/mentor/EditMentorProfilePage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { HiArrowLeft, HiTag, HiChevronDown } from "react-icons/hi";
import { Save, FolderOpen, Loader2 } from "lucide-react";
import { HiCamera } from "react-icons/hi";
import userProfileApi from "../../api/userProfile";
import axiosClient from "../../api/axios";
import { normalizeAvatarUrl, buildDefaultAvatarUrl } from "../../utils/avatar";
import locationApi from "../../api/locationApi";

const EditMentorProfilePage = () => {
  const toNumberOrNull = (v) => {
    if (v === "" || v === null || v === undefined) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };
  const fileInputRef = useRef(null);
  const categoryDropdownRef = useRef(null);
  const hashtagDropdownRef = useRef(null);
  const [avatarPreview, setAvatarPreview] = useState("/avatar-default.jpg");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [hashtagDropdownOpen, setHashtagDropdownOpen] = useState(false);

  const API_BASE = import.meta.env.VITE_API_BASE_URL;
  const toAbsoluteUrl = (url) => {
    if (!url) return "/avatar-default.jpg";
    if (url.startsWith("http")) return url;
    return `${API_BASE}${url}`;
  };

  const openFilePicker = () => fileInputRef.current?.click();

  const toIntOrNull = (v) => {
    const n = toNumberOrNull(v);
    return n === null ? null : Math.trunc(n);
  };
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    gender: "",
    school: "",
    bio: "",
    city: "",
    country: "",
    avatarUrl: "",
    title: "",
    hourlyRate: "",
    packagePrice: "",
    experienceYears: "",
    introduction: "",
    availabilityNote: "",
    newHashtagsText: "",
  });

  const [avatarSeed, setAvatarSeed] = useState({
    id: null,
    email: "",
    fullName: ""
  });

  const [allCategories, setAllCategories] = useState([]);
  const [allHashtags, setAllHashtags] = useState([]);
  const [loadingCatHash, setLoadingCatHash] = useState(false);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [selectedHashtagIds, setSelectedHashtagIds] = useState([]);

  // Location dropdowns
  const [countries, setCountries] = useState([]);
  const [cities, setCities] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(true);

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
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const loadCities = async (countryName) => {
    const citiesData = await locationApi.getCitiesByCountry(countryName);
    setCities(citiesData);
  };

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        setError("");

        const res = await userProfileApi.getProfile();
        const u = res?.data?.data;
        if (!u) throw new Error("No profile data");

        const mp = u.mentorProfile ?? {};

        if (!mounted) return;
        setForm((prev) => ({
          ...prev,
          fullName: u.fullName ?? "",
          phone: u.phone ?? "",
          gender: u.gender ?? "",
          school: u.school ?? "",
          bio: u.bio ?? "",
          city: u.city ?? "",
          country: u.country ?? "",
          avatarUrl: u.avatarUrl ?? "",
          title: mp.title ?? "",
          hourlyRate: mp.hourlyRate ?? "",
          packagePrice: mp.packagePrice ?? "",
          experienceYears: mp.experienceYears ?? "",
          introduction: mp.introduction ?? "",
          availabilityNote: mp.availabilityNote ?? "",
        }));
        setAvatarSeed({
          id: u.id,
          email: u.email,
          fullName: u.fullName
        });

        if (mp.categories && mp.categories.length > 0) {
          setSelectedCategoryIds(mp.categories.map(c => c.id));
        }
        if (mp.hashtags && mp.hashtags.length > 0) {
          setSelectedHashtagIds(mp.hashtags.map(h => h.id));
        }

        // Load cities nếu đã có country
        if (u.country) {
          loadCities(u.country);
        }

        setAvatarPreview(
          normalizeAvatarUrl(u.avatarUrl) ||
          buildDefaultAvatarUrl({
            id: u.id,
            email: u.email,
            fullName: u.fullName
          })
        );

      } catch (e) {
        console.log("Load profile failed:", e);
        setError("Load profile failed. Check console/network.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const fetchCatHash = async () => {
      try {
        setLoadingCatHash(true);
        const [catRes, hashRes] = await Promise.all([
          axiosClient.get("/api/Admin/categories"),
          axiosClient.get("/api/Admin/hashtags"),
        ]);
        setAllCategories(catRes?.data?.data || []);
        setAllHashtags(hashRes?.data?.data?.items || []);
      } catch (err) {
        console.log("Fetch categories/hashtags failed:", err);
      } finally {
        setLoadingCatHash(false);
      }
    };
    fetchCatHash();
  }, []);

  const toggleCategory = (catId) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(catId)
        ? prev.filter((id) => id !== catId)
        : [...prev, catId]
    );
  };

  const toggleHashtag = (hashId) => {
    setSelectedHashtagIds((prev) =>
      prev.includes(hashId)
        ? prev.filter((id) => id !== hashId)
        : [...prev, hashId]
    );
  };

  const newHashtags = useMemo(() => {
    const raw = form.newHashtagsText.trim();
    if (!raw) return null;
    const arr = raw
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
    return arr.length ? arr : null;
  }, [form.newHashtagsText]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    // Khi đổi country, reset city và load cities mới
    if (name === "country") {
      setForm((prev) => ({ ...prev, city: "" }));
      loadCities(value);
    }
  };

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

    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);

    try {
      setIsUploadingAvatar(true);

      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await axiosClient.post("/api/File/upload/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const avatarUrl = uploadRes?.data?.data?.fileUrls?.[0];
      if (!avatarUrl) throw new Error("Upload returned empty avatarUrl");

      await axiosClient.put("/api/User/avatar", { avatarUrl });

      setForm((prev) => ({ ...prev, avatarUrl }));
      setAvatarPreview(
        normalizeAvatarUrl(avatarUrl) ||
        buildDefaultAvatarUrl(avatarSeed)
      );

    } catch (err) {
      console.log("Upload avatar failed:", err);
      setError(err?.response?.data?.message || "Upload avatar failed.");
      setAvatarPreview(
        normalizeAvatarUrl(form.avatarUrl) ||
        buildDefaultAvatarUrl(avatarSeed)
      );

    } finally {
      setIsUploadingAvatar(false);
      e.target.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");

    try {
      await userProfileApi.updateUserProfile({
        fullName: form.fullName || null,
        phone: form.phone || null,
        gender: form.gender || null,
        school: form.school || null,
        bio: form.bio || null,
        city: form.city || null,
        country: form.country || null,
        avatarUrl: form.avatarUrl || null,
      });

      const mentorPayload = {
        title: form.title || null,
        hourlyRate: toNumberOrNull(form.hourlyRate),
        packagePrice: toNumberOrNull(form.packagePrice),
        experienceYears: toIntOrNull(form.experienceYears),
        introduction: form.introduction || null,
        availabilityNote: form.availabilityNote || null,
        categoryIds: selectedCategoryIds.length > 0 ? selectedCategoryIds : null,
        hashtagIds: selectedHashtagIds.length > 0 ? selectedHashtagIds : null,
        newHashtags,
      };

      await userProfileApi.updateMentorProfile(mentorPayload);

      navigate("/mentor/profile");
    } catch (err) {
      console.log("Save profile failed:", err);
      const apiMsg =
        err?.response?.data?.message ||
        err?.response?.data?.title ||
        err?.message ||
        "Save failed";
      setError(apiMsg);
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
            onClick={() => navigate("/mentor/profile")}
            className="p-2.5 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-xl transition-colors"
          >
            <HiArrowLeft className="w-5 h-5 text-neutral-500 dark:text-neutral-400" />
          </button>
          <h1 className="text-xl md:text-2xl font-bold text-neutral-900 dark:text-white">
            Edit Mentor Profile
          </h1>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
            {String(error)}
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
                      className="w-28 h-28 rounded-full object-cover border-4 border-white dark:border-neutral-800 shadow-lg"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = buildDefaultAvatarUrl(avatarSeed);
                      }}
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
                  <h3 className="font-medium text-neutral-900 dark:text-white mt-3">
                    {form.fullName}
                  </h3>
                  {isUploadingAvatar && (
                    <div className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Uploading...
                    </div>
                  )}
                </div>
              </div>

              {/* Pricing Section */}
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm p-5">
                <h2 className="text-sm font-semibold text-neutral-900 dark:text-white mb-4">
                  Pricing
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                      Hourly Rate (VND)
                    </label>
                    <input
                      type="number"
                      name="hourlyRate"
                      value={form.hourlyRate}
                      onChange={handleChange}
                      min={0}
                      placeholder="100000"
                      className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                      Package Price (VND)
                    </label>
                    <input
                      type="number"
                      name="packagePrice"
                      value={form.packagePrice}
                      onChange={handleChange}
                      min={0}
                      placeholder="500000"
                      className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Forms */}
            <div className="xl:col-span-2 space-y-6">
              {/* General Information */}
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm p-5">
                <h2 className="text-sm font-semibold text-neutral-900 dark:text-white mb-4">
                  General Information
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={form.fullName}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                      Phone
                    </label>
                    <input
                      type="text"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                      Gender
                    </label>
                    <select
                      name="gender"
                      value={form.gender}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                      School
                    </label>
                    <input
                      type="text"
                      name="school"
                      value={form.school}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                      Country
                    </label>
                    <select
                      name="country"
                      value={form.country}
                      onChange={handleChange}
                      disabled={loadingLocations}
                      className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
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
                        value={form.city}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
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
                        value={form.city}
                        onChange={handleChange}
                        placeholder="Enter city name"
                        className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    )}
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Bio
                  </label>
                  <textarea
                    name="bio"
                    value={form.bio}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Tell us about yourself..."
                    className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white outline-none resize-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Mentor Profile */}
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm p-5">
                <h2 className="text-sm font-semibold text-neutral-900 dark:text-white mb-4">
                  Mentor Profile
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                      Title / Position
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={form.title}
                      onChange={handleChange}
                      placeholder="e.g. Senior Developer, Tech Lead"
                      className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                      Experience (years)
                    </label>
                    <input
                      type="number"
                      name="experienceYears"
                      value={form.experienceYears}
                      onChange={handleChange}
                      min={0}
                      placeholder="5"
                      className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Introduction
                  </label>
                  <textarea
                    name="introduction"
                    value={form.introduction}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Describe your expertise and what you can help students with..."
                    className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white outline-none resize-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Availability Note
                  </label>
                  <input
                    type="text"
                    name="availabilityNote"
                    value={form.availabilityNote}
                    onChange={handleChange}
                    placeholder="e.g. Available weekday evenings, 6PM - 10PM"
                    className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Categories & Hashtags */}
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm p-5">
                <h2 className="text-sm font-semibold text-neutral-900 dark:text-white mb-4">
                  Categories & Skills
                </h2>

                {loadingCatHash ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                    <span className="ml-2 text-neutral-500">Loading...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Categories Dropdown */}
                    <div ref={categoryDropdownRef}>
                      <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2 flex items-center gap-2">
                        <FolderOpen className="w-4 h-4 text-blue-600" />
                        Categories <span className="text-red-500">*</span>
                      </label>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">
                        Select categories that represent your expertise
                      </p>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                          className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl text-left flex items-center justify-between focus:ring-2 focus:ring-blue-500"
                        >
                          <span className="text-sm text-neutral-700 dark:text-neutral-300">
                            {selectedCategoryIds.length === 0
                              ? "Select categories..."
                              : `${selectedCategoryIds.length} selected`}
                          </span>
                          <HiChevronDown className={`w-5 h-5 text-neutral-500 dark:text-neutral-400 transition-transform duration-200 ${categoryDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {categoryDropdownOpen && (
                          <div className="absolute z-20 w-full mt-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                            {allCategories.map((cat) => (
                              <label
                                key={cat.id}
                                className="flex items-center px-4 py-2.5 hover:bg-neutral-100 dark:hover:bg-neutral-700 cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedCategoryIds.includes(cat.id)}
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

                      {/* Selected Categories */}
                      {selectedCategoryIds.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {selectedCategoryIds.map(catId => {
                            const cat = allCategories.find(c => c.id === catId);
                            return cat ? (
                              <span
                                key={catId}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg"
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
                      )}
                    </div>

                    {/* Hashtags Dropdown */}
                    <div ref={hashtagDropdownRef}>
                      <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2 flex items-center gap-2">
                        <HiTag className="w-4 h-4 text-emerald-600" />
                        Skills (Hashtags)
                      </label>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">
                        Select specific skills or topics (optional)
                      </p>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setHashtagDropdownOpen(!hashtagDropdownOpen)}
                          className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl text-left flex items-center justify-between focus:ring-2 focus:ring-emerald-500"
                        >
                          <span className="text-sm text-neutral-700 dark:text-neutral-300">
                            {selectedHashtagIds.length === 0
                              ? "Select skills..."
                              : `${selectedHashtagIds.length} selected`}
                          </span>
                          <HiChevronDown className={`w-5 h-5 text-neutral-500 dark:text-neutral-400 transition-transform duration-200 ${hashtagDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {hashtagDropdownOpen && (
                          <div className="absolute z-20 w-full mt-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                            {allHashtags.map((tag) => (
                              <label
                                key={tag.id}
                                className="flex items-center px-4 py-2.5 hover:bg-neutral-100 dark:hover:bg-neutral-700 cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedHashtagIds.includes(tag.id)}
                                  onChange={() => toggleHashtag(tag.id)}
                                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                                />
                                <span className="ml-3 text-sm text-neutral-700 dark:text-neutral-300">
                                  #{tag.name}
                                </span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Selected Hashtags */}
                      {selectedHashtagIds.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {selectedHashtagIds.map(tagId => {
                            const tag = allHashtags.find(h => h.id === tagId);
                            return tag ? (
                              <span
                                key={tagId}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-lg"
                              >
                                #{tag.name}
                                <button
                                  type="button"
                                  onClick={() => toggleHashtag(tagId)}
                                  className="hover:text-emerald-900 dark:hover:text-emerald-200"
                                >
                                  ×
                                </button>
                              </span>
                            ) : null;
                          })}
                        </div>
                      )}
                    </div>

                    {/* New hashtags (optional) - Full width */}
                    <div className="lg:col-span-2">
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                        Add New Skills (comma separated)
                      </label>
                      <input
                        type="text"
                        name="newHashtagsText"
                        value={form.newHashtagsText}
                        onChange={handleChange}
                        placeholder="reactjs, nodejs, typescript"
                        className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-neutral-500 mt-1">
                        Add new skills if your skill is not listed in the dropdown
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => navigate("/mentor/profile")}
                  className="px-5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition font-medium"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 transition font-medium shadow"
                >
                  <Save size={18} />
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

export default EditMentorProfilePage;
