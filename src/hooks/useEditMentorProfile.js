// src/hooks/useEditMentorProfile.js
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import userProfileApi from "../api/userProfile";
import axiosClient from "../api/axios";
import { normalizeAvatarUrl, buildDefaultAvatarUrl } from "../utils/avatar";
import locationApi from "../api/locationApi";

const toNumberOrNull = (v) => {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const toIntOrNull = (v) => {
  const n = toNumberOrNull(v);
  return n === null ? null : Math.trunc(n);
};

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export function useEditMentorProfile() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const categoryDropdownRef = useRef(null);
  const hashtagDropdownRef = useRef(null);

  const [avatarPreview, setAvatarPreview] = useState("/avatar-default.jpg");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [hashtagDropdownOpen, setHashtagDropdownOpen] = useState(false);

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

  const [avatarSeed, setAvatarSeed] = useState({ id: null, email: "", fullName: "" });

  const [allCategories, setAllCategories] = useState([]);
  const [allHashtags, setAllHashtags] = useState([]);
  const [loadingCatHash, setLoadingCatHash] = useState(false);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [selectedHashtagIds, setSelectedHashtagIds] = useState([]);

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
    locationApi.getCountries().then((data) => {
      setCountries(data);
      setLoadingLocations(false);
    });
  }, []);

  const loadCities = async (countryName) => {
    const citiesData = await locationApi.getCitiesByCountry(countryName);
    setCities(citiesData);
  };

  // Load profile data
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
        setAvatarSeed({ id: u.id, email: u.email, fullName: u.fullName });
        if (mp.categories?.length > 0) setSelectedCategoryIds(mp.categories.map((c) => c.id));
        if (mp.hashtags?.length > 0) setSelectedHashtagIds(mp.hashtags.map((h) => h.id));
        if (u.country) loadCities(u.country);
        setAvatarPreview(
          normalizeAvatarUrl(u.avatarUrl) ||
          buildDefaultAvatarUrl({ id: u.id, email: u.email, fullName: u.fullName })
        );
      } catch {
        setError("Load profile failed. Check console/network.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Load categories & hashtags
  useEffect(() => {
    const fetchCatHash = async () => {
      try {
        setLoadingCatHash(true);
        const [catRes, hashRes] = await Promise.all([
          axiosClient.get("/api/Category"),
          axiosClient.get("/api/hashtags"),
        ]);
        const parentCats = catRes?.data?.data || [];
        const flattenedCats = [];
        parentCats.forEach((parent) => {
          flattenedCats.push(parent);
          parent.children?.forEach((child) => flattenedCats.push({ ...child, parentId: parent.id }));
        });
        setAllCategories(flattenedCats);
        setAllHashtags(hashRes?.data?.data || []);
      } catch {
        // silently fail
      } finally {
        setLoadingCatHash(false);
      }
    };
    fetchCatHash();
  }, []);

  // Reload hashtags when categories change
  useEffect(() => {
    if (selectedCategoryIds.length === 0) return;
    const loadHashtagsByCategories = async (categoryIds) => {
      try {
        const collected = [];
        const seenIds = new Set();
        for (const catId of categoryIds) {
          const res = await axiosClient.get(`/api/Category/${catId}/hashtags`);
          res?.data?.data?.hashtags?.forEach((h) => {
            if (!seenIds.has(h.id)) { seenIds.add(h.id); collected.push(h); }
          });
        }
        setAllHashtags(collected);
      } catch {
        // silently fail
      }
    };
    loadHashtagsByCategories(selectedCategoryIds);
  }, [selectedCategoryIds]);

  const newHashtags = useMemo(() => {
    const raw = form.newHashtagsText.trim();
    if (!raw) return null;
    const arr = raw.split(",").map((x) => x.trim()).filter(Boolean);
    return arr.length ? arr : null;
  }, [form.newHashtagsText]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "country") {
      setForm((prev) => ({ ...prev, city: "", country: value }));
      loadCities(value);
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const toggleCategory = (catId) => {
    setSelectedCategoryIds((prev) => {
      if (prev.includes(catId)) {
        setSelectedHashtagIds([]);
        return prev.filter((id) => id !== catId);
      }
      return [...prev, catId];
    });
  };

  const toggleHashtag = (hashId) => {
    setSelectedHashtagIds((prev) =>
      prev.includes(hashId) ? prev.filter((id) => id !== hashId) : [...prev, hashId]
    );
  };

  const onPickAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Please choose an image file."); return; }
    if (file.size > 5 * 1024 * 1024) { setError("Image is too large. Max 5MB."); return; }
    setError("");
    setAvatarPreview(URL.createObjectURL(file));
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
      setAvatarPreview(normalizeAvatarUrl(avatarUrl) || buildDefaultAvatarUrl(avatarSeed));
    } catch (err) {
      setError(err?.response?.data?.message || "Upload avatar failed.");
      setAvatarPreview(normalizeAvatarUrl(form.avatarUrl) || buildDefaultAvatarUrl(avatarSeed));
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
      await userProfileApi.updateMentorProfile({
        title: form.title || null,
        hourlyRate: toNumberOrNull(form.hourlyRate),
        packagePrice: toNumberOrNull(form.packagePrice),
        experienceYears: toIntOrNull(form.experienceYears),
        introduction: form.introduction || null,
        availabilityNote: form.availabilityNote || null,
        categoryIds: selectedCategoryIds.length > 0 ? selectedCategoryIds : null,
        hashtagIds: selectedHashtagIds.length > 0 ? selectedHashtagIds : null,
        newHashtags,
      });
      navigate("/mentor/profile");
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        err?.response?.data?.title ||
        err?.message ||
        "Save failed"
      );
    } finally {
      setIsSaving(false);
    }
  };

  return {
    // refs
    fileInputRef, categoryDropdownRef, hashtagDropdownRef,
    // avatar
    avatarPreview, avatarSeed, isUploadingAvatar,
    onPickAvatar,
    openFilePicker: () => fileInputRef.current?.click(),
    // state
    loading, isSaving, error,
    form, handleChange,
    // location
    countries, cities, loadingLocations,
    // categories & hashtags
    allCategories, allHashtags, loadingCatHash,
    selectedCategoryIds, selectedHashtagIds,
    toggleCategory, toggleHashtag,
    // dropdown state
    categoryDropdownOpen, setCategoryDropdownOpen,
    hashtagDropdownOpen, setHashtagDropdownOpen,
    // submit
    handleSubmit,
    navigate,
    // helpers
    API_BASE,
  };
}
