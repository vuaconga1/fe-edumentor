// src/pages/common/UserProfilePage.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { HiMail, HiLocationMarker, HiPhone, HiStar, HiArrowLeft, HiCheckCircle, HiTag } from "react-icons/hi";
import { FolderOpen, Clock, Globe, GraduationCap, BookOpen } from "lucide-react";
import userApi from "../../api/userApi";
import requestApi from "../../api/requestApi";
import { normalizeAvatarUrl, buildDefaultAvatarUrl } from "../../utils/avatar";
import { useAuth } from "../../context/AuthContext";
import BookRequestModal from "../../components/request/BookRequestModal";

const UserProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState(null);
  const [showBookModal, setShowBookModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const utc = dateString.endsWith("Z") ? dateString : dateString + "Z";
    return new Date(utc).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return "Not set";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        setError("");

        const res = await userApi.getById(id);
        const u = res?.data?.data;
        if (!u) throw new Error("No user data");

        const isMentor = u.role === 1 || u.role === "Mentor";
        const mp = u.mentorProfile || {};

        const mapped = {
          id: u.id,
          name: u.fullName || "User",
          email: u.email || "",
          phone: u.phone || "",
          gender: u.gender || "",
          school: u.school || "",
          major: u.major || "",
          bio: u.bio || "",
          city: u.city || "",
          country: u.country || "",
          location: [u.city, u.country].filter(Boolean).join(", "),
          avatarSeed: { id: u.id, email: u.email, fullName: u.fullName },
          avatar:
            normalizeAvatarUrl(u.avatarUrl) ||
            buildDefaultAvatarUrl({ id: u.id, email: u.email, fullName: u.fullName }),
          joinedAt: u.createdAt,
          isMentor,
          role: isMentor ? "Mentor" : "Student",

          // Mentor-specific fields
          title: mp.title || "",
          hourlyRate: mp.hourlyRate || 0,
          packagePrice: mp.packagePrice || 0,
          experienceYears: mp.experienceYears || 0,
          introduction: mp.introduction || "",
          availabilityNote: mp.availabilityNote || "",
          ratingAvg: mp.ratingAvg || 0,
          ratingCount: mp.ratingCount || 0,
          categories: mp.categories || [],
          hashtags: mp.hashtags || [],
        };

        if (mounted) setProfile(mapped);
      } catch (e) {
        console.log("Fetch profile failed:", e);
        if (mounted) {
          setError(e?.response?.data?.message || "Failed to load profile");
          setProfile(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => (mounted = false);
  }, [id]);

  const isOwnProfile = currentUser?.id === profile?.id;
  const isCurrentUserStudent = currentUser?.role === "Student" || currentUser?.role === 0;

  const isPendingStatus = (status) => {
    if (typeof status === "number") return status === 0;
    const normalized = String(status || "").toLowerCase();
    return normalized === "open" || normalized === "pending" || normalized === "processing";
  };

  const handleBook = async () => {
    if (!profile?.id) return;
    try {
      let page = 1;
      let totalPages = 1;
      let hasPending = false;
      do {
        const res = await requestApi.getMyRequests(page, 50);
        const data = res?.data?.data;
        const items = data?.items || [];
        totalPages = data?.totalPages || 1;
        hasPending = items.some(
          (req) => req?.mentorId === profile.id && isPendingStatus(req?.status)
        );
        if (hasPending) break;
        page += 1;
      } while (page <= totalPages && page <= 5);

      if (hasPending) {
        alert("You already have a pending request with this mentor. Please wait for accept/reject.");
        return;
      }
      setShowBookModal(true);
    } catch (err) {
      console.log("Check pending request failed:", err);
      setShowBookModal(true);
    }
  };

  const handleBookSuccess = () => {
    setSuccessMessage("Request sent successfully! The mentor will respond soon.");
    setTimeout(() => setSuccessMessage(""), 5000);
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      const basePath = currentUser?.role === "Mentor" || currentUser?.role === 1 ? "/mentor" : "/student";
      navigate(`${basePath}/community`);
    }
  };

  if (loading && !profile) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  const p = profile;

  if (!p) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 mb-6 transition-colors"
          >
            <HiArrowLeft className="w-4 h-4" />
            Go Back
          </button>
          <div className="text-red-500">{error || "Cannot load profile"}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 mb-6 transition-colors"
        >
          <HiArrowLeft className="w-4 h-4" />
          Go Back
        </button>

        {error && (
          <div className="mb-4 p-4 rounded-2xl border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Main Layout */}
        <div className={`grid grid-cols-1 ${p.isMentor ? "xl:grid-cols-3" : "xl:grid-cols-3"} gap-6`}>
          {/* Left Column - Profile Card */}
          <div className="xl:col-span-1 space-y-6">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm p-5">
              <div className="flex flex-col items-center text-center">
                <img
                  src={p.avatar}
                  alt="avatar"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = buildDefaultAvatarUrl(p.avatarSeed || { email: p.email, fullName: p.name });
                  }}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-white dark:border-neutral-800 shadow-lg"
                />

                <h1 className="text-xl font-bold text-neutral-900 dark:text-white mt-4">
                  {p.name}
                </h1>

                {/* Role Badge */}
                <span className={`mt-1 inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                  p.isMentor 
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                }`}>
                  {p.isMentor ? "Mentor" : "Student"}
                </span>

                {p.isMentor && p.title && (
                  <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mt-1">
                    {p.title}
                  </p>
                )}

                {/* Rating (mentors only) */}
                {p.isMentor && p.ratingCount > 0 && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <HiStar className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                      {Number(p.ratingAvg).toFixed(1)}
                    </span>
                    <span className="text-xs text-neutral-500">
                      ({p.ratingCount} reviews)
                    </span>
                  </div>
                )}

                {/* Book button (only if viewing a mentor's profile as a student) */}
                {p.isMentor && isCurrentUserStudent && !isOwnProfile && (
                  <button
                    onClick={handleBook}
                    className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium shadow transition-colors"
                  >
                    Book
                  </button>
                )}
              </div>

              {/* Contact Info */}
              <div className="mt-6 pt-5 border-t border-neutral-200 dark:border-neutral-800 space-y-3">
                <div className="flex items-center gap-3 text-sm text-neutral-600 dark:text-neutral-400">
                  <HiMail className="w-4 h-4 text-neutral-400" />
                  <span className="truncate">{p.email}</span>
                </div>
                {p.phone && (
                  <div className="flex items-center gap-3 text-sm text-neutral-600 dark:text-neutral-400">
                    <HiPhone className="w-4 h-4 text-neutral-400" />
                    <span>{p.phone}</span>
                  </div>
                )}
                {p.location && (
                  <div className="flex items-center gap-3 text-sm text-neutral-600 dark:text-neutral-400">
                    <HiLocationMarker className="w-4 h-4 text-neutral-400" />
                    <span>{p.location}</span>
                  </div>
                )}
                {p.joinedAt && (
                  <div className="flex items-center gap-3 text-sm text-neutral-600 dark:text-neutral-400">
                    <Clock className="w-4 h-4 text-neutral-400" />
                    <span>Joined {formatDate(p.joinedAt)}</span>
                  </div>
                )}
              </div>

              {/* Additional Info */}
              {(p.school || p.major || p.gender || (p.isMentor && p.experienceYears > 0)) && (
                <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                  <h3 className="text-xs text-neutral-400 uppercase tracking-wider font-semibold mb-3">
                    Additional Info
                  </h3>
                  <div className="space-y-2">
                    {p.school && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-neutral-500 flex items-center gap-1.5">
                          <GraduationCap className="w-3.5 h-3.5" /> School
                        </span>
                        <span className="text-neutral-900 dark:text-white font-medium">{p.school}</span>
                      </div>
                    )}
                    {p.major && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-neutral-500 flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5" /> Major
                        </span>
                        <span className="text-neutral-900 dark:text-white font-medium">{p.major}</span>
                      </div>
                    )}
                    {p.gender && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-neutral-500">Gender</span>
                        <span className="text-neutral-900 dark:text-white font-medium">{p.gender}</span>
                      </div>
                    )}
                    {p.isMentor && p.experienceYears > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-neutral-500">Experience</span>
                        <span className="text-neutral-900 dark:text-white font-medium">
                          {p.experienceYears} {p.experienceYears === 1 ? "year" : "years"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Details */}
          <div className="xl:col-span-2 space-y-6">
            {/* About */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm p-5">
              <h2 className="text-sm font-semibold text-neutral-900 dark:text-white mb-3">
                About
              </h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                {p.bio || "No bio yet."}
              </p>
            </div>

            {/* Mentor-specific sections */}
            {p.isMentor && (
              <>
                {/* Pricing */}
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm p-5">
                  <h2 className="text-sm font-semibold text-neutral-900 dark:text-white mb-4">
                    Pricing
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="border border-neutral-200 dark:border-neutral-700 rounded-xl p-4">
                      <span className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">
                        Hourly Rate
                      </span>
                      <p className="text-lg font-semibold text-neutral-900 dark:text-white mt-1">
                        {formatCurrency(p.hourlyRate)}
                      </p>
                    </div>
                    {p.packagePrice > 0 && (
                      <div className="border border-neutral-200 dark:border-neutral-700 rounded-xl p-4">
                        <span className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">
                          Package Price
                        </span>
                        <p className="text-lg font-semibold text-neutral-900 dark:text-white mt-1">
                          {formatCurrency(p.packagePrice)}
                        </p>
                      </div>
                    )}
                  </div>
                  {p.availabilityNote && (
                    <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                      <span className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">
                        Availability
                      </span>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                        {p.availabilityNote}
                      </p>
                    </div>
                  )}
                </div>

                {/* Introduction */}
                {p.introduction && (
                  <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm p-5">
                    <h2 className="text-sm font-semibold text-neutral-900 dark:text-white mb-3">
                      Professional Introduction
                    </h2>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                      {p.introduction}
                    </p>
                  </div>
                )}

                {/* Categories & Hashtags */}
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm p-5">
                  <h2 className="text-sm font-semibold text-neutral-900 dark:text-white mb-4">
                    Categories & Skills
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <span className="text-xs text-neutral-400 uppercase tracking-wider font-semibold flex items-center gap-1.5 mb-3">
                        <FolderOpen className="w-3.5 h-3.5" />
                        Categories
                      </span>
                      {p.categories && p.categories.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {p.categories.map((cat, idx) => (
                            <span
                              key={cat.id || idx}
                              className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                            >
                              {cat.name || cat}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">No categories selected</p>
                      )}
                    </div>
                    <div>
                      <span className="text-xs text-neutral-400 uppercase tracking-wider font-semibold flex items-center gap-1.5 mb-3">
                        <HiTag className="w-3.5 h-3.5" />
                        Skills
                      </span>
                      {p.hashtags && p.hashtags.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {p.hashtags.map((tag, idx) => (
                            <span
                              key={tag.id || idx}
                              className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                            >
                              #{tag.name || tag}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">No skills selected</p>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-green-500 text-white shadow-lg animate-in slide-in-from-bottom-4">
            <HiCheckCircle className="w-5 h-5" />
            {successMessage}
          </div>
        )}

        {/* Book Request Modal (only for mentors) */}
        {p.isMentor && (
          <BookRequestModal
            isOpen={showBookModal}
            onClose={() => setShowBookModal(false)}
            mentor={p}
            onSuccess={handleBookSuccess}
          />
        )}
      </div>
    </div>
  );
};

export default UserProfilePage;
