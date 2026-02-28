import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { HiMail, HiLocationMarker, HiPhone, HiStar, HiTag } from "react-icons/hi";
import { Edit2, Award, Briefcase, DollarSign, FolderOpen, Clock, Globe, Users } from "lucide-react";
import userProfileApi from "../../api/userProfile";
import communityApi from "../../api/communityApi";
import { normalizeAvatarUrl, buildDefaultAvatarUrl } from "../../utils/avatar";
import FollowersModal from "../../components/profile/FollowersModal";

const MentorProfilePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState(null);

  // Followers/Following State
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const utc = dateString.endsWith('Z') ? dateString : dateString + 'Z';
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

  const fetchFollowData = async (userId) => {
    try {
      const [followersRes, followingRes] = await Promise.all([
        communityApi.getFollowers(userId),
        communityApi.getFollowing(userId),
      ]);
      
      if (followersRes.data?.success) {
        setFollowersCount(followersRes.data.data.count);
        setFollowers(followersRes.data.data.users.map(u => ({
          id: u.id,
          name: u.fullName,
          avatar: normalizeAvatarUrl(u.avatarUrl) || buildDefaultAvatarUrl({ id: u.id, fullName: u.fullName }),
          role: u.isMentor ? 'mentor' : 'student'
        })));
      }
      
      if (followingRes.data?.success) {
        setFollowingCount(followingRes.data.data.count);
        setFollowing(followingRes.data.data.users.map(u => ({
          id: u.id,
          name: u.fullName,
          avatar: normalizeAvatarUrl(u.avatarUrl) || buildDefaultAvatarUrl({ id: u.id, fullName: u.fullName }),
          role: u.isMentor ? 'mentor' : 'student'
        })));
      }
    } catch (err) {
      console.error("Failed to fetch follow data", err);
    }
  };

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        setError("");

        const res = await userProfileApi.getAll();
        const u = res?.data?.data;
        if (!u) throw new Error("No user profile data");

        // Fetch followers/following data
        if (u.id) {
          fetchFollowData(u.id);
        }

        const mp = u.mentorProfile || {};

        const mapped = {
          // User Profile
          name: u.fullName || "Mentor",
          email: u.email || "",
          phone: u.phone || "",
          gender: u.gender || "",
          school: u.school || "",
          bio: u.bio || "",
          city: u.city || "",
          country: u.country || "",
          location: [u.city, u.country].filter(Boolean).join(", "),
          avatarSeed: { id: u.id, email: u.email, fullName: u.fullName },
          avatar:
            normalizeAvatarUrl(u.avatarUrl) ||
            buildDefaultAvatarUrl({ id: u.id, email: u.email, fullName: u.fullName }),
          joinedAt: u.createdAt,

          // Mentor Profile
          title: mp.title || "",
          hourlyRate: mp.hourlyRate || 0,
          packagePrice: mp.packagePrice || 0,
          experienceYears: mp.experienceYears || 0,
          introduction: mp.introduction || "",
          availabilityNote: mp.availabilityNote || "",
          ratingAvg: mp.ratingAvg || 0,
          ratingCount: mp.ratingCount || 0,
          specialization: mp.specialization || "",
          portfolioUrl: mp.portfolioUrl || "",
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
  }, []);

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
        <div className="text-red-500">{error || "Cannot load profile"}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {error && (
          <div className="mb-4 p-4 rounded-2xl border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Main Layout - 3 columns on xl screens */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left Column - Profile Card */}
          <div className="xl:col-span-1 space-y-6">
            {/* Profile Card */}
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
                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                  {p.title || p.specialization || "Mentor"}
                </p>

                {/* Rating */}
                {p.ratingCount > 0 && (
                  <button
                    onClick={() => navigate("/mentor/reviews")}
                    className="flex items-center gap-1.5 mt-2 hover:opacity-80 transition-opacity cursor-pointer"
                    title="View my reviews"
                  >
                    <HiStar className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                      {p.ratingAvg.toFixed(1)}
                    </span>
                    <span className="text-xs text-blue-600 dark:text-blue-400 underline">
                      ({p.ratingCount} reviews)
                    </span>
                  </button>
                )}

                {/* Followers/Following Stats */}
                <div className="flex justify-center gap-6 mt-4">
                  <button
                    onClick={() => setShowFollowersModal(true)}
                    className="flex flex-col items-center px-3 py-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  >
                    <span className="text-lg font-bold text-neutral-900 dark:text-white">{followersCount}</span>
                    <span className="text-xs text-neutral-500">Followers</span>
                  </button>
                  <button
                    onClick={() => setShowFollowingModal(true)}
                    className="flex flex-col items-center px-3 py-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  >
                    <span className="text-lg font-bold text-neutral-900 dark:text-white">{followingCount}</span>
                    <span className="text-xs text-neutral-500">Following</span>
                  </button>
                </div>

                <button
                  onClick={() => navigate("/mentor/profile/edit")}
                  className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium shadow transition-colors"
                >
                  <Edit2 size={16} />
                  Edit Profile
                </button>
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
              {(p.school || p.gender || p.experienceYears > 0) && (
                <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                  <h3 className="text-xs text-neutral-400 uppercase tracking-wider font-semibold mb-3">
                    Additional Info
                  </h3>
                  <div className="space-y-2">
                    {p.school && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-neutral-500">School</span>
                        <span className="text-neutral-900 dark:text-white font-medium">{p.school}</span>
                      </div>
                    )}
                    {p.gender && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-neutral-500">Gender</span>
                        <span className="text-neutral-900 dark:text-white font-medium">{p.gender}</span>
                      </div>
                    )}
                    {p.experienceYears > 0 && (
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

          {/* Right Column - Details (2/3 width on xl) */}
          <div className="xl:col-span-2 space-y-6">
            {/* Pricing Card */}
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

            {/* About & Introduction */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm p-5">
                <h2 className="text-sm font-semibold text-neutral-900 dark:text-white mb-3">
                  About
                </h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  {p.bio || "No bio yet."}
                </p>
              </div>

              <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm p-5">
                <h2 className="text-sm font-semibold text-neutral-900 dark:text-white mb-3">
                  Professional Introduction
                </h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  {p.introduction || "No introduction yet."}
                </p>
              </div>
            </div>

            {/* Categories & Hashtags */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm p-5">
              <h2 className="text-sm font-semibold text-neutral-900 dark:text-white mb-4">
                Categories & Skills
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Categories */}
                <div>
                  <span className="text-xs text-neutral-400 uppercase tracking-wider font-semibold flex items-center gap-1.5 mb-3">
                    <FolderOpen className="w-3.5 h-3.5" />
                    Categories
                  </span>
                  {p.categories && p.categories.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {p.categories.map((cat) => (
                        <span
                          key={cat.id}
                          className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        >
                          {cat.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">No categories selected</p>
                  )}
                </div>

                {/* Hashtags */}
                <div>
                  <span className="text-xs text-neutral-400 uppercase tracking-wider font-semibold flex items-center gap-1.5 mb-3">
                    <HiTag className="w-3.5 h-3.5" />
                    Skills
                  </span>
                  {p.hashtags && p.hashtags.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {p.hashtags.map((tag) => (
                        <span
                          key={tag.id}
                          className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        >
                          #{tag.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">No skills selected</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Followers Modal */}
      <FollowersModal
        isOpen={showFollowersModal}
        onClose={() => setShowFollowersModal(false)}
        followers={followers}
        title="Followers"
      />

      {/* Following Modal */}
      <FollowersModal
        isOpen={showFollowingModal}
        onClose={() => setShowFollowingModal(false)}
        followers={following}
        title="Following"
      />
    </div>
  );
};

export default MentorProfilePage;
