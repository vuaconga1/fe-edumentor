// src/pages/mentor/EditMentorProfilePage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { HiArrowLeft } from "react-icons/hi";
import { Save } from "lucide-react";

import userProfileApi from "../../api/userProfile";

const toNumberOrNull = (v) => {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const toIntOrNull = (v) => {
  const n = toNumberOrNull(v);
  return n === null ? null : Math.trunc(n);
};

const EditMentorProfilePage = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  // gộp “User profile” + “Mentor profile” để edit
  const [form, setForm] = useState({
    // user
    fullName: "",
    phone: "",
    gender: "",
    school: "",
    major: "",
    bio: "",
    city: "",
    country: "",
    avatarUrl: "",

    // mentorProfile
    title: "",
    hourlyRate: "",
    packagePrice: "",
    experienceYears: "",
    introduction: "",
    availabilityNote: "",

    // tags
    newHashtagsText: "", // nhập dạng: "dotnet, backend"
  });

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        setError("");

        const res = await userProfileApi.getProfile(); // GET /api/User/profile
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
          major: u.major ?? "",
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");

    try {
      // 1) update user profile (thông tin chung)
      await userProfileApi.updateUserProfile({
        fullName: form.fullName || null,
        phone: form.phone || null,
        gender: form.gender || null,
        school: form.school || null,
        major: form.major || null,
        bio: form.bio || null,
        city: form.city || null,
        country: form.country || null,
        avatarUrl: form.avatarUrl || null,
      });

      // 2) update mentor profile (đúng schema swagger)
      // UpdateMentorProfileRequest: title, hourlyRate, packagePrice, experienceYears, introduction, availabilityNote, categoryIds, hashtagIds, newHashtags :contentReference[oaicite:6]{index=6}
      const mentorPayload = {
        title: form.title || null,
        hourlyRate: toNumberOrNull(form.hourlyRate),
        packagePrice: toNumberOrNull(form.packagePrice),
        experienceYears: toIntOrNull(form.experienceYears),
        introduction: form.introduction || null,
        availabilityNote: form.availabilityNote || null,

        // chưa làm UI chọn category/hashtag id thì để null (backend nên accept)
        categoryIds: null,
        hashtagIds: null,
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
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-6">
        <div className="max-w-3xl mx-auto text-neutral-600 dark:text-neutral-300">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-4 md:p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate("/mentor/profile")}
            className="p-2.5 hover:bg-neutral-200 dark:hover:bg-gray-800 rounded-xl transition-colors"
          >
            <HiArrowLeft className="w-5 h-5 text-neutral-500 dark:text-neutral-400" />
          </button>
          <h1 className="text-xl md:text-2xl font-bold text-neutral-900 dark:text-white">
            Edit Mentor Profile
          </h1>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 border border-red-200">
            {String(error)}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* User info */}
          <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
              General Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Full name
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-gray-600 rounded-xl text-neutral-900 dark:text-white outline-none"
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
                  className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-gray-600 rounded-xl text-neutral-900 dark:text-white outline-none"
                />
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
                  className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-gray-600 rounded-xl text-neutral-900 dark:text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Major
                </label>
                <input
                  type="text"
                  name="major"
                  value={form.major}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-gray-600 rounded-xl text-neutral-900 dark:text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  City
                </label>
                <input
                  type="text"
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-gray-600 rounded-xl text-neutral-900 dark:text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Country
                </label>
                <input
                  type="text"
                  name="country"
                  value={form.country}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-gray-600 rounded-xl text-neutral-900 dark:text-white outline-none"
                />
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
                rows={4}
                className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-gray-600 rounded-xl text-neutral-900 dark:text-white outline-none resize-none"
              />
            </div>
          </div>

          {/* Mentor profile */}
          <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
              Mentor Profile
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-gray-600 rounded-xl text-neutral-900 dark:text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Experience years
                </label>
                <input
                  type="number"
                  name="experienceYears"
                  value={form.experienceYears}
                  onChange={handleChange}
                  min={0}
                  className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-gray-600 rounded-xl text-neutral-900 dark:text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Hourly rate
                </label>
                <input
                  type="number"
                  name="hourlyRate"
                  value={form.hourlyRate}
                  onChange={handleChange}
                  min={0}
                  className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-gray-600 rounded-xl text-neutral-900 dark:text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Package price
                </label>
                <input
                  type="number"
                  name="packagePrice"
                  value={form.packagePrice}
                  onChange={handleChange}
                  min={0}
                  className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-gray-600 rounded-xl text-neutral-900 dark:text-white outline-none"
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
                className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-gray-600 rounded-xl text-neutral-900 dark:text-white outline-none resize-none"
              />
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                Availability note
              </label>
              <input
                type="text"
                name="availabilityNote"
                value={form.availabilityNote}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-gray-600 rounded-xl text-neutral-900 dark:text-white outline-none"
              />
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                New hashtags (comma separated)
              </label>
              <input
                type="text"
                name="newHashtagsText"
                value={form.newHashtagsText}
                onChange={handleChange}
                placeholder="dotnet, backend"
                className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-gray-600 rounded-xl text-neutral-900 dark:text-white outline-none"
              />
              <p className="text-xs text-neutral-500 mt-1">
                Ví dụ: <b>dotnet, backend</b> → gửi lên <code>newHashtags</code> array
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate("/mentor/profile")}
              className="px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 transition"
            >
              <Save size={18} />
              {isSaving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditMentorProfilePage;
