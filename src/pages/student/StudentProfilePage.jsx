import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  HiUser, HiAcademicCap, HiCalendar, HiClock, HiMail, HiLocationMarker,
  HiBookOpen, HiLightBulb, HiCheckCircle
} from "react-icons/hi";
import { Edit2, Users, BookOpen, Star } from "lucide-react";
import FollowersModal from "../../components/profile/FollowersModal";
import userProfileApi from "../../api/userProfile";

// ✅ fallback ONLY khi backend chưa có field
import studentData from "../../mock/studentProfile.json";

const StudentProfilePage = () => {
  const navigate = useNavigate();
  const [isFollowersModalOpen, setIsFollowersModalOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ✅ profile thật từ DB
  const [profile, setProfile] = useState(null);

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

  // ✅ gọi API lấy profile thật
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        setError("");

        const res = await userProfileApi.getAll(); // GET /api/User/profile (theo comment trong file mày)
        const u = res?.data?.data ?? res?.data;    // tùy format backend

        if (!u) throw new Error("No user profile data");

        const location = [u.city, u.country].filter(Boolean).join(", ");

        // ✅ map data thật
        const mapped = {
          // header
          name: u.fullName || "Unknown",
          title: "Student",
          email: u.email || "",
          phone: u.phone || "",
          gender: u.gender || "",
          school: u.school || "",
          major: u.major || "",
          bio: u.bio || "",

          location,
          avatar: u.avatarUrl || u.avatar || studentData.avatar,

          // joinedAt: nếu backend có CreatedAt/createdAt thì dùng, không có thì fallback mock
          joinedAt: u.createdAt || u.created_at || studentData.otherInfo?.joinedAt,

          // stats: nếu backend chưa có thì fallback mock
          stats: {
            sessionsCompleted: u.sessionsCompleted ?? studentData.stats.sessionsCompleted ?? 0,
            hoursLearned: u.hoursLearned ?? studentData.stats.hoursLearned ?? 0,
            rating: u.rating ?? studentData.stats.rating ?? 0,
            followers: u.followers ?? studentData.stats.followers ?? 0,
          },

          // lists (nếu backend chưa có): fallback mock
          learningGoals: u.learningGoals ?? studentData.learningGoals ?? [],
          interests: u.interests ?? studentData.interests ?? [],
          completedCourses: u.completedCourses ?? studentData.completedCourses ?? [],
          followersList: u.followersList ?? studentData.followersList ?? [],
          languages: u.languages ?? studentData.otherInfo?.languages ?? [],
          education: u.education ?? studentData.otherInfo?.education ?? "",
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
        <div className="text-neutral-500">Loading profile...</div>
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
    learningGoals: studentData.learningGoals ?? [],
    completedCourses: studentData.completedCourses ?? [],
    followersList: studentData.followersList ?? [],
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {!!error && (
          <div className="mb-4 p-3 rounded-xl border border-red-200 bg-red-50 text-red-600 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <div className="xl:col-span-3 space-y-6">
            {/* Header */}
            <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm p-6 md:p-8">
              <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
                <div className="relative flex-shrink-0 group">
                  <div className={`absolute -inset-1 bg-gradient-to-r ${currentRank.gradient} rounded-full opacity-90 blur-sm`}></div>
                  <div className={`absolute -inset-0.5 bg-gradient-to-r ${currentRank.gradient} rounded-full`}></div>
                  <img
                    src={p.avatar}
                    alt={p.name}
                    className="relative w-32 h-32 md:w-36 md:h-36 rounded-full object-cover border-4 border-white dark:border-gray-800 shadow-xl"
                  />
                  <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 px-3 py-0.5 ${currentRank.labelBg} text-white text-xs font-bold rounded-full shadow-lg`}>
                    {currentRank.label}
                  </div>
                </div>

                <div className="flex-1 text-center md:text-left min-w-0 w-full">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
                    <div>
                      <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-white tracking-tight">
                        {p.name}
                      </h1>
                      <p className="text-lg text-blue-600 dark:text-blue-400 font-medium mt-1">
                        {p.title}
                      </p>

                      <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-3 text-sm text-neutral-500 dark:text-neutral-400">
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-neutral-100 dark:bg-neutral-800/50 rounded-full">
                          <HiMail className="w-4 h-4" />
                          <span>{p.email}</span>
                        </div>

                        {!!p.location && (
                          <div className="flex items-center gap-1.5 px-3 py-1 bg-neutral-100 dark:bg-neutral-800/50 rounded-full">
                            <HiLocationMarker className="w-4 h-4" />
                            <span>{p.location}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => navigate("/student/profile/edit")}
                      className="self-center md:self-start px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm flex items-center gap-2 transition-all shadow-lg shadow-blue-500/30 active:scale-95"
                    >
                      <Edit2 size={16} />
                      Edit Profile
                    </button>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-3 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 flex flex-col items-center justify-center min-h-[90px]">
                      <div className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400 mb-1">
                        <BookOpen size={16} />
                        <span className="text-xs font-semibold uppercase tracking-wider">Sessions</span>
                      </div>
                      <div className="text-xl font-bold text-neutral-900 dark:text-white">
                        {p.stats.sessionsCompleted}
                      </div>
                    </div>

                    <div className="p-3 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 flex flex-col items-center justify-center min-h-[90px]">
                      <div className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400 mb-1">
                        <HiClock size={16} />
                        <span className="text-xs font-semibold uppercase tracking-wider">Hours</span>
                      </div>
                      <div className="text-xl font-bold text-neutral-900 dark:text-white">
                        {p.stats.hoursLearned}
                      </div>
                    </div>

                    <div className="p-3 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 flex flex-col items-center justify-center min-h-[90px]">
                      <div className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400 mb-1">
                        <Star size={16} className="fill-amber-400 text-amber-400" />
                        <span className="text-xs font-semibold uppercase tracking-wider">Rating</span>
                      </div>
                      <div className="text-xl font-bold text-neutral-900 dark:text-white">
                        {p.stats.rating}
                      </div>
                    </div>

                    <button
                      onClick={() => setIsFollowersModalOpen(true)}
                      className="p-3 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border-2 border-blue-200 dark:border-blue-800 flex flex-col items-center justify-center min-h-[90px] cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-400 transition-all group"
                    >
                      <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 mb-1 group-hover:scale-105 transition-transform">
                        <Users size={16} />
                        <span className="text-xs font-bold uppercase tracking-wider">Followers</span>
                      </div>
                      <div className="text-xl font-bold text-blue-700 dark:text-blue-300">
                        {formatFollowers(p.stats.followers)}
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>

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
                      <span className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">School</span>
                      <p className="text-sm font-medium text-neutral-900 dark:text-white mt-1">
                        {p.school || "N/A"}
                      </p>
                    </div>

                    <div>
                      <span className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">Major</span>
                      <p className="text-sm font-medium text-neutral-900 dark:text-white mt-1">
                        {p.major || "N/A"}
                      </p>
                    </div>

                    <div>
                      <span className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">Education</span>
                      <p className="text-sm font-medium text-neutral-900 dark:text-white mt-1">
                        {p.education || "N/A"}
                      </p>
                    </div>

                    <div>
                      <span className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">Languages</span>
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
                      <span className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">Joined</span>
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
                        <div key={index} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                              {course.name}
                            </p>
                            <p className="text-xs text-neutral-500">with {course.mentor}</p>
                          </div>
                          <span className="text-xs text-neutral-400 flex-shrink-0 ml-2">
                            {formatDate(course.completedAt)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-neutral-500">No sessions yet.</p>
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
                          className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-sm font-medium rounded-full border border-blue-200 dark:border-blue-800"
                        >
                          {interest}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-neutral-500">No interests yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar (giữ nguyên) */}
          <div className="hidden xl:block space-y-6">
            {/* ... */}
          </div>
        </div>
      </div>

      <FollowersModal
        isOpen={isFollowersModalOpen}
        onClose={() => setIsFollowersModalOpen(false)}
        followers={p.followersList || []}
      />
    </div>
  );
};

export default StudentProfilePage;
