import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  HiUser,
  HiAcademicCap,
  HiCalendar,
  HiClock,
  HiMail,
  HiLocationMarker,
  HiBookOpen,
  HiLightBulb,
  HiCheckCircle,
} from "react-icons/hi";
import { Edit2, Users, BookOpen, Star } from "lucide-react";
import FollowersModal from "../../components/profile/FollowersModal";
import userProfileApi from "../../api/userProfile";
import axiosClient from "../../api/axios";
import studentData from "../../mock/studentProfile.json";
import { normalizeAvatarUrl, buildDefaultAvatarUrl } from "../../utils/avatar";
import mentorApi from "../../api/mentorApi";
import MentorApplicationBanner from "../../components/mentor/MentorApplicationBanner";
import ApplyMentorModal from "../../components/mentor/ApplyMentorModal";
import ConfirmSwitchModal from "../../components/mentor/ConfirmSwitchModal";

// ✅ fallback ONLY khi backend chưa có field


const StudentProfilePage = () => {
  const navigate = useNavigate();
  const [isFollowersModalOpen, setIsFollowersModalOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ✅ profile thật từ DB
  const [profile, setProfile] = useState(null);

  // Mentor Application State
  const [mentorStatus, setMentorStatus] = useState(null);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);



  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatFollowers = (count) => {
    if (!count) return "0";
    if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
    return String(count);
  };

  // ====== Categories -> map id => name (for Interests) ======


  const mapInterestsToNames = (raw, categoryMap) => {
    if (!Array.isArray(raw)) return [];

    return raw
      .map((x) => {
        if (x == null) return null;

        // interest is id number
        if (typeof x === "number") return categoryMap.get(x) || `#${x}`;

        // interest is string already
        if (typeof x === "string") return x;

        // interest is object: {id, name}
        if (typeof x === "object") {
          const id = x.id ?? x.categoryId ?? x.value;
          const name = x.name ?? x.label;
          if (name) return name;
          if (id != null) return categoryMap.get(Number(id)) || `#${id}`;
        }

        return null;
      })
      .filter(Boolean);
  };
  const API_BASE = import.meta.env.VITE_API_BASE_URL; // ví dụ https://localhost:7082


  const toAbsoluteUrl = (url) => {
    if (!url) return "/avatar-default.jpg";
    if (url.startsWith("http")) return url;
    return `${API_BASE}${url}`;
  };

  const fetchMentorStatus = async () => {
    try {
      const res = await mentorApi.getApplicationStatus();
      if (res.data?.success) {
        setMentorStatus(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch mentor status", err);
    }
  };



  // ✅ gọi API lấy profile thật + categories để map interests
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        setError("");

        const [profileRes, categoriesRes] = await Promise.all([
          userProfileApi.getAll(),                 // /api/User/profile
          axiosClient.get("/api/Admin/categories") // lấy list category để hiển thị name
        ]);

        const u = profileRes?.data?.data;
        if (!u) throw new Error("No user profile data");

        // Fetch mentor application status
        fetchMentorStatus();

        const categories = categoriesRes?.data?.data ?? [];
        const interests = (categories || []).map(c => c.name).filter(Boolean);

        const mapped = {
          name: u.fullName || "Unknown",
          title: "Student",
          email: u.email || "",
          phone: u.phone || "",
          gender: u.gender || "",
          school: u.school || "",
          major: u.major || "",
          bio: u.bio || "",
          location: [u.city, u.country].filter(Boolean).join(", "),
          avatarSeed: { id: u.id, email: u.email, fullName: u.fullName },
          avatar:
            normalizeAvatarUrl(u.avatarUrl) ||
            buildDefaultAvatarUrl({ id: u.id, email: u.email, fullName: u.fullName }),

          joinedAt: u.createdAt,

          // stats nếu backend chưa có -> để 0 (không dùng mock)
          stats: {
            sessionsCompleted: u.sessionsCompleted ?? 0,
            hoursLearned: u.hoursLearned ?? 0,
            rating: u.rating ?? 0,
            followers: u.followers ?? 0,
          },

          interests, // ✅ lấy name từ categories API
          completedCourses: u.completedCourses ?? [],
          followersList: u.followersList ?? [],
          languages: u.languages ?? [],
          education: u.education ?? "",
        };

        if (mounted) setProfile(mapped);
      } catch (e) {
        console.log("Fetch student profile failed:", e);
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


  const currentRank = useMemo(() => {
    // giữ nguyên logic rank của mày (hoặc làm theo rating)
    return {
      gradient: "from-gray-300 via-gray-100 to-gray-400",
      label: "Silver",
      labelBg: "bg-gray-400",
    };
  }, []);

  if (loading && !profile) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-6">
        <div className="text-neutral-500">Loading profile.</div>
      </div>
    );
  }

  // fallback cuối nếu lỗi
  const p = profile ?? {
    ...studentData,
    name: studentData.name,
    title: studentData.title,
    email: studentData.email,
    location: studentData.location,
    avatar: studentData.avatar,
    stats: studentData.stats,
    bio: studentData.bio,
    education: studentData.otherInfo?.education,
    languages: studentData.otherInfo?.languages ?? [],
    joinedAt: studentData.otherInfo?.joinedAt,
    interests: studentData.interests ?? [],
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-6">
      <div className="max-w-6xl mx-auto">
        {error ? (
          <div className="mb-4 p-4 rounded-2xl border border-red-200 bg-red-50 text-red-700">
            {error}
          </div>
        ) : null}

        {/* Top Card */}
        <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="relative">
                <img
                  src={p.avatar}
                  alt="avatar"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = buildDefaultAvatarUrl(p.avatarSeed || { email: p.email, fullName: p.name });
                  }}

                  className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-neutral-900 shadow"
                />

                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                  <span
                    className={`px-3 py-1 text-xs font-bold text-white rounded-full shadow ${currentRank.labelBg}`}
                  >
                    {currentRank.label}
                  </span>
                </div>
              </div>

              <div>
                <h1 className="text-2xl font-extrabold text-neutral-900 dark:text-white">
                  {p.name}
                </h1>
                <p className="text-blue-600 dark:text-blue-400 font-semibold">
                  {p.title}
                </p>

                <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                  <span className="inline-flex items-center gap-1.5">
                    <HiMail className="w-4 h-4" />
                    {p.email}
                  </span>

                  {p.location ? (
                    <span className="inline-flex items-center gap-1.5">
                      <HiLocationMarker className="w-4 h-4" />
                      {p.location}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => navigate("/student/profile/edit")}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow"
              >
                <Edit2 size={16} />
                Edit Profile
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 text-center">
              <div className="text-neutral-400 text-xs font-bold uppercase tracking-wider">
                Sessions
              </div>
              <div className="text-xl font-extrabold text-neutral-900 dark:text-white mt-1">
                {p.stats.sessionsCompleted}
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 text-center">
              <div className="text-neutral-400 text-xs font-bold uppercase tracking-wider">
                Hours
              </div>
              <div className="text-xl font-extrabold text-neutral-900 dark:text-white mt-1">
                {p.stats.hoursLearned}
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 text-center">
              <div className="text-neutral-400 text-xs font-bold uppercase tracking-wider">
                Rating
              </div>
              <div className="text-xl font-extrabold text-neutral-900 dark:text-white mt-1 flex justify-center items-center gap-1">
                <Star size={16} className="text-yellow-500" />
                {p.stats.rating}
              </div>
            </div>

            <button
              onClick={() => setIsFollowersModalOpen(true)}
              className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 text-center hover:border-blue-300 dark:hover:border-blue-700 transition group"
            >
              <div className="flex items-center justify-center gap-1.5 text-blue-600 dark:text-blue-400 mb-1 group-hover:scale-105 transition-transform">
                <Users size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Followers
                </span>
              </div>
              <div className="text-xl font-bold text-blue-700 dark:text-blue-300">
                {formatFollowers(p.stats.followers)}
              </div>
            </button>
          </div>
        </div>

        {/* Mentor Application Banner */}
        <MentorApplicationBanner
          statusData={mentorStatus}
          onOpenApply={() => setIsApplyModalOpen(true)}
          onOpenConfirm={() => setIsConfirmModalOpen(true)}
        />



        {/* About + Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm p-6">
              <h2 className="text-base font-semibold text-neutral-900 dark:text-white mb-3 flex items-center gap-2">
                <HiUser className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                About
              </h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                {p.bio || "No bio yet."}
              </p>
            </div>

            <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm p-6">
              <h2 className="text-base font-semibold text-neutral-900 dark:text-white mb-3 flex items-center gap-2">
                <HiAcademicCap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                General Info
              </h2>

              <div className="space-y-4">
                <div>
                  <span className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">
                    School
                  </span>
                  <p className="text-sm font-medium text-neutral-900 dark:text-white mt-1">
                    {p.school || "N/A"}
                  </p>
                </div>

                <div>
                  <span className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">
                    Major
                  </span>
                  <p className="text-sm font-medium text-neutral-900 dark:text-white mt-1">
                    {p.major || "N/A"}
                  </p>
                </div>

                <div>
                  <span className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">
                    Education
                  </span>
                  <p className="text-sm font-medium text-neutral-900 dark:text-white mt-1">
                    {p.education || "N/A"}
                  </p>
                </div>

                <div>
                  <span className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">
                    Languages
                  </span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(p.languages || []).length ? (
                      p.languages.map((lang, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-200 text-sm font-medium rounded-full shadow-sm"
                        >
                          {lang}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-neutral-500">N/A</span>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">
                    Joined
                  </span>
                  <p className="text-sm font-medium text-neutral-900 dark:text-white mt-1 flex items-center gap-1.5">
                    <HiCalendar className="w-4 h-4 text-neutral-400" />
                    {formatDate(p.joinedAt)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm p-6">
              <h2 className="text-base font-semibold text-neutral-900 dark:text-white mb-3 flex items-center gap-2">
                <HiCheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Completed Sessions
              </h2>

              {(p.completedCourses || []).length ? (
                <div className="space-y-2">
                  {p.completedCourses.map((course, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between gap-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                          <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-neutral-900 dark:text-white">
                            {course.title}
                          </div>
                          <div className="text-xs text-neutral-500 dark:text-neutral-400">
                            with {course.mentor}
                          </div>
                        </div>
                      </div>

                      <div className="text-xs text-neutral-400">{course.date}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-neutral-500">No sessions yet.</div>
              )}
            </div>

            <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm p-6">
              <h2 className="text-base font-semibold text-neutral-900 dark:text-white mb-3 flex items-center gap-2">
                <HiBookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Interests
              </h2>

              {(p.interests || []).length ? (
                <div className="flex flex-wrap gap-2">
                  {p.interests.map((interest, index) => (
                    <span
                      key={index}
                      className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-sm font-semibold rounded-full"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-neutral-500">N/A</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <FollowersModal
        isOpen={isFollowersModalOpen}
        onClose={() => setIsFollowersModalOpen(false)}
        followers={p.followersList || []}
      />

      <ApplyMentorModal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        onSuccess={fetchMentorStatus}
      />

      <ConfirmSwitchModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onSuccess={fetchMentorStatus}
      />


    </div>
  );
};

export default StudentProfilePage;

